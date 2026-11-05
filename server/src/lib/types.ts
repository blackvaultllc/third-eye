/**
 * Shared scan types. The mobile app imports its own copy of this shape
 * (mobile/src/lib/types.ts) — keep the two in sync by hand until a shared
 * package is worth it. The server is the source of truth.
 */

export type Verdict = "likely_real" | "likely_ai" | "uncertain";

export interface SegmentScore {
  /** Start second, relative to the analysed clip. */
  start: number;
  end: number;
  /** 0 = looks real, 1 = looks AI-generated. */
  aiScore: number;
}

export interface VisualResult {
  provider: string;
  aiScore: number;
  segments: SegmentScore[];
  notes: string[];
}

export interface VoiceResult {
  provider: string;
  aiScore: number;
  /** Per-segment synthetic-speech scores, when the provider returns them. */
  segments: SegmentScore[];
  notes: string[];
}

export interface MetadataResult {
  hasC2PA: boolean;
  hasContentCredentials: boolean;
  containerFormat: string | null;
  durationSeconds: number | null;
  notes: string[];
}

export interface LipSyncResult {
  /** Null when no lip-sync model is configured — never invent a number. */
  aiScore: number | null;
  notes: string[];
}

export interface ScanResult {
  verdict: Verdict;
  /** 0-100, how far the combined score sits from the uncertain middle. */
  confidence: number;
  /** 0-100 combined AI likelihood. */
  aiScore: number;
  visual: VisualResult;
  voice: VoiceResult;
  metadata: MetadataResult;
  lipSync: LipSyncResult;
  timeline: SegmentScore[];
  why: string[];
  /** True when any adapter ran in demo/mock mode. Never hide this from the UI. */
  demo: boolean;
  disclaimer: string;
}

export type JobStatus = "queued" | "processing" | "done" | "failed";

export interface ScanJob {
  id: string;
  status: JobStatus;
  progress: number; // 0-100
  progressLabel: string;
  result?: ScanResult;
  error?: { code: string; message: string };
  createdAt: string;
  /** Original source the user shared, URL or "file_upload". Stored, never the video. */
  source: string;
}

export const DISCLAIMER =
  "This is an estimate, not proof. Detection models can be wrong in both directions, " +
  "especially on short, compressed, or heavily edited clips. Do not use a result alone " +
  "to accuse someone, remove content, or make a legal or safety decision.";

export const ERROR_MESSAGES: Record<string, string> = {
  UNSUPPORTED_LINK: "That link could not be opened. It may be private, deleted, or from an unsupported source.",
  PRIVATE_VIDEO: "That video looks private or login-gated, so it cannot be analysed from its link. Try downloading it first (only if you have the right to) and uploading the file instead.",
  DRM_PROTECTED: "That video is DRM-protected and cannot be analysed.",
  UNSUPPORTED_FILE: "That file type is not supported. Try an MP4 or MOV clip.",
  DOWNLOAD_FAILED: "The video could not be downloaded. Check the link and your connection, then try again.",
  NETWORK_ERROR: "Network error while analysing. Your clip was not kept — try again.",
  PROVIDER_ERROR: "A detection provider failed. Try again in a moment.",
  FILE_TOO_LARGE: "That clip is too large. Trim it to a shorter clip and try again.",
};
