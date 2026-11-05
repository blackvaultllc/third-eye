import type { LipSyncResult } from "./types";

/**
 * Lip-sync layer — interface first, model later.
 *
 * A real lip-sync check needs a dedicated audio-visual sync model
 * (SyncNet-style: face landmarks vs. speech). Shipping a duration
 * comparison or a random number here would be a fake signal, so this
 * layer returns aiScore: null and the combiner excludes it from the
 * weighted score until a real model adapter is wired in.
 *
 * To add one: implement LipSyncAdapter in adapters/, return per-second
 * mismatch scores, and pass it into combineScores().
 */
export async function checkLipSync(_videoPath: string, _audioPath: string): Promise<LipSyncResult> {
  return {
    aiScore: null,
    notes: ["Lip-sync model not configured yet — this layer did not contribute to the score."],
  };
}
