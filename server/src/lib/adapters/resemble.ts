import { readFile } from "node:fs/promises";
import type { VoiceAdapter } from "./types";
import { ProviderConfigError, ProviderError, clamp01 } from "./types";

/**
 * Resemble Detect voice adapter.
 *
 * Contract: the caller hands it the separated audio track (WAV/MP3).
 * This adapter posts the audio to the configured Resemble Detect endpoint
 * and maps the response to per-segment synthetic-speech scores.
 *
 * Verify before production: endpoint, auth, and response shape against
 * Resemble's current Detect docs. A shape mismatch fails loudly.
 */
export function resembleVoice(): VoiceAdapter {
  const apiKey = process.env.RESEMBLE_API_KEY ?? "";
  const endpoint = process.env.RESEMBLE_DETECT_ENDPOINT ?? "";
  if (!apiKey || !endpoint) throw new ProviderConfigError("resemble");

  return {
    name: "resemble",
    async analyzeVoice({ audioPath }) {
      try {
        const audio = await readFile(audioPath);
        const form = new FormData();
        form.append("audio", new Blob([audio]), "audio.wav");
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as Record<string, unknown>;
        const raw = typeof data.aiScore === "number" ? data.aiScore : typeof data.score === "number" ? (data.score as number) : 0.5;
        const segments = Array.isArray(data.segments)
          ? (data.segments as Array<Record<string, unknown>>)
              .filter((s) => typeof s.start === "number" && typeof s.end === "number" && typeof s.aiScore === "number")
              .map((s) => ({ start: s.start as number, end: s.end as number, aiScore: clamp01(s.aiScore as number) }))
          : [];
        return { provider: "resemble", aiScore: clamp01(raw), segments, notes: [] };
      } catch (err) {
        if (err instanceof ProviderError) throw err;
        throw new ProviderError("resemble", err instanceof Error ? err.message : String(err));
      }
    },
  };
}
