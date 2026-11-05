import type { LipSyncResult, MetadataResult, SegmentScore, VisualResult, VoiceResult } from "../types";

/**
 * Provider adapter pattern.
 *
 * Every real provider sits behind one of these interfaces so it can be
 * swapped by changing an env var, not by rewriting the pipeline.
 * Adapters receive local file paths only, and they own their own HTTP call,
 * auth header, and response mapping. No adapter key ever leaves the server.
 */
export interface VisualAdapter {
  readonly name: string;
  analyzeVisual(args: { framesDir: string; durationSeconds: number | null }): Promise<VisualResult>;
}

export interface VoiceAdapter {
  readonly name: string;
  analyzeVoice(args: { audioPath: string; durationSeconds: number | null }): Promise<VoiceResult>;
}

export interface LipSyncAdapter {
  readonly name: string;
  analyzeLipSync(args: { videoPath: string; audioPath: string }): Promise<LipSyncResult>;
}

export class ProviderConfigError extends Error {
  constructor(provider: string) {
    super(`Provider ${provider} is selected but its API key / endpoint is not configured.`);
    this.name = "ProviderConfigError";
  }
}

export class ProviderError extends Error {
  constructor(provider: string, cause: string) {
    super(`Provider ${provider} failed: ${cause}`);
    this.name = "ProviderError";
  }
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

export function emptySegments(durationSeconds: number | null): SegmentScore[] {
  if (!durationSeconds || durationSeconds <= 0) return [];
  const out: SegmentScore[] = [];
  for (let s = 0; s < Math.floor(durationSeconds); s++) {
    out.push({ start: s, end: s + 1, aiScore: 0.5 });
  }
  return out;
}
