import type { LipSyncResult, MetadataResult, ScanResult, SegmentScore, Verdict, VisualResult, VoiceResult } from "./types";
import { DISCLAIMER } from "./types";
import { clamp01 } from "./adapters/types";

/**
 * Combines the layers into one verdict. Weights are renormalised over the
 * layers that actually produced a score, so an unconfigured layer (lip-sync
 * today) never drags the result toward "uncertain" by default.
 */
export function combineScores(args: {
  visual: VisualResult;
  voice: VoiceResult;
  metadata: MetadataResult;
  lipSync: LipSyncResult;
  demo: boolean;
}): ScanResult {
  const { visual, voice, metadata, lipSync, demo } = args;
  const parts: Array<{ score: number; weight: number }> = [
    { score: visual.aiScore, weight: 0.45 },
    { score: voice.aiScore, weight: 0.35 },
  ];
  if (lipSync.aiScore !== null) parts.push({ score: lipSync.aiScore, weight: 0.1 });
  // Metadata is evidence, not a score: a missing C2PA marker proves nothing.
  // It only nudges when a credential IS present and consistent — handled
  // in `why`, not as a fake numeric layer.
  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  const aiScore01 = parts.reduce((sum, p) => sum + p.score * p.weight, 0) / totalWeight;
  const aiScore = Math.round(clamp01(aiScore01) * 100);

  const verdict: Verdict = aiScore >= 65 ? "likely_ai" : aiScore <= 35 ? "likely_real" : "uncertain";
  // Confidence = distance from the uncertain middle, scaled to 0-100.
  const confidence = Math.round(Math.abs(aiScore01 - 0.5) * 2 * 100);

  const why: string[] = [];
  if (visual.aiScore >= 0.65) why.push(`Visual analysis flagged AI-like patterns (score ${Math.round(visual.aiScore * 100)}/100).`);
  else if (visual.aiScore <= 0.35) why.push(`Visual analysis looked consistent with a real recording (score ${Math.round(visual.aiScore * 100)}/100).`);
  else why.push("Visual analysis was inconclusive on its own.");
  if (voice.aiScore >= 0.65) why.push(`Voice analysis flagged synthetic or cloned-speech patterns (score ${Math.round(voice.aiScore * 100)}/100).`);
  else if (voice.aiScore <= 0.35) why.push(`Voice analysis looked consistent with a natural voice (score ${Math.round(voice.aiScore * 100)}/100).`);
  else why.push("Voice analysis was inconclusive on its own.");
  if (metadata.hasC2PA) why.push("A Content Credentials marker was found — its manifest, not this score, is the strongest origin evidence.");
  else why.push("No Content Credentials marker was found, which is common and proves nothing on its own.");
  if (lipSync.aiScore === null) why.push("Lip-sync was not scored (no lip-sync model configured).");
  if (demo) why.push("Demo mode: one or more layers ran without a real provider key.");

  return {
    verdict,
    confidence,
    aiScore,
    visual,
    voice,
    metadata,
    lipSync,
    timeline: mergeTimeline(visual.segments, voice.segments),
    why,
    demo,
    disclaimer: DISCLAIMER,
  };
}

/** Per-second timeline: the higher of the visual / voice AI score wins each second. */
export function mergeTimeline(visual: SegmentScore[], voice: SegmentScore[]): SegmentScore[] {
  const byStart = new Map<number, SegmentScore>();
  for (const seg of [...visual, ...voice]) {
    const existing = byStart.get(seg.start);
    if (!existing || seg.aiScore > existing.aiScore) {
      byStart.set(seg.start, { start: seg.start, end: Math.max(existing?.end ?? seg.end, seg.end), aiScore: seg.aiScore });
    }
  }
  return [...byStart.values()].sort((a, b) => a.start - b.start);
}
