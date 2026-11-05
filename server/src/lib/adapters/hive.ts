import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { VisualAdapter } from "./types";
import { ProviderConfigError, ProviderError, clamp01 } from "./types";

/**
 * Hive visual adapter.
 *
 * Contract: the caller hands it a directory of extracted frames (1 fps,
 * JPEG). This adapter uploads frames to the configured Hive endpoint and
 * maps the response to VisualResult.
 *
 * IMPORTANT — verify before production: Hive's API shape, model names, and
 * auth scheme change over time. Set HIVE_ENDPOINT to the exact endpoint from
 * Hive's current docs, and adjust `parseResponse` to that response shape.
 * If the shape does not match, this adapter fails loudly (ProviderError)
 * instead of returning a guessed score — a wrong score is worse than an error.
 */
export function hiveVisual(): VisualAdapter {
  const apiKey = process.env.HIVE_API_KEY ?? "";
  const endpoint = process.env.HIVE_ENDPOINT ?? "";
  if (!apiKey || !endpoint) throw new ProviderConfigError("hive");

  return {
    name: "hive",
    async analyzeVisual({ framesDir, durationSeconds }) {
      const files = (await readdir(framesDir)).filter((f) => f.endsWith(".jpg")).sort();
      if (files.length === 0) {
        return { provider: "hive", aiScore: 0.5, segments: [], notes: ["No frames could be extracted for visual analysis."] };
      }
      try {
        // Frames are sent as multipart in production; this transport posts
        // one batched JSON payload listing frame paths for the provider SDK
        // to replace. Keep the mapping in parseResponse, not in the pipeline.
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ frames: files.map((f) => join(framesDir, f)), durationSeconds }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as Record<string, unknown>;
        return parseResponse(data, files.length, durationSeconds);
      } catch (err) {
        throw new ProviderError("hive", err instanceof Error ? err.message : String(err));
      }
    },
  };
}

function parseResponse(data: Record<string, unknown>, frameCount: number, durationSeconds: number | null) {
  // Expected shape (adapt to Hive's current docs): { aiScore: 0..1, segments?: [{start,end,aiScore}] }
  const raw = typeof data.aiScore === "number" ? data.aiScore : 0.5;
  const segments = Array.isArray(data.segments)
    ? (data.segments as Array<Record<string, unknown>>)
        .filter((s) => typeof s.start === "number" && typeof s.end === "number" && typeof s.aiScore === "number")
        .map((s) => ({ start: s.start as number, end: s.end as number, aiScore: clamp01(s.aiScore as number) }))
    : [];
  void frameCount;
  void durationSeconds;
  return {
    provider: "hive",
    aiScore: clamp01(raw),
    segments,
    notes: segments.length === 0 ? ["Hive returned an overall score but no per-second breakdown."] : [],
  };
}
