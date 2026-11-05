import { readdir } from "node:fs/promises";
import type { VisualAdapter } from "./types";
import { ProviderConfigError, ProviderError, clamp01 } from "./types";

/**
 * BitMind visual adapter — same contract as Hive (see hive.ts).
 * Swap VISUAL_PROVIDER=bitmind and set BITMIND_API_KEY / BITMIND_ENDPOINT.
 * Verify the endpoint and response shape against BitMind's current docs
 * before production; a shape mismatch fails loudly instead of guessing.
 */
export function bitmindVisual(): VisualAdapter {
  const apiKey = process.env.BITMIND_API_KEY ?? "";
  const endpoint = process.env.BITMIND_ENDPOINT ?? "";
  if (!apiKey || !endpoint) throw new ProviderConfigError("bitmind");

  return {
    name: "bitmind",
    async analyzeVisual({ framesDir }) {
      const files = (await readdir(framesDir)).filter((f) => f.endsWith(".jpg")).sort();
      if (files.length === 0) {
        return { provider: "bitmind", aiScore: 0.5, segments: [], notes: ["No frames could be extracted for visual analysis."] };
      }
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ frames: files }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as Record<string, unknown>;
        const raw = typeof data.aiScore === "number" ? data.aiScore : 0.5;
        return { provider: "bitmind", aiScore: clamp01(raw), segments: [], notes: [] };
      } catch (err) {
        throw new ProviderError("bitmind", err instanceof Error ? err.message : String(err));
      }
    },
  };
}
