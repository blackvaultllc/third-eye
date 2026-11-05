/** Mirror of server/src/lib/types.ts — keep in sync by hand. */
export type Verdict = "likely_real" | "likely_ai" | "uncertain";

export interface SegmentScore { start: number; end: number; aiScore: number; }
export interface VisualResult { provider: string; aiScore: number; segments: SegmentScore[]; notes: string[]; }
export interface VoiceResult { provider: string; aiScore: number; segments: SegmentScore[]; notes: string[]; }
export interface MetadataResult { hasC2PA: boolean; hasContentCredentials: boolean; containerFormat: string | null; durationSeconds: number | null; notes: string[]; }
export interface LipSyncResult { aiScore: number | null; notes: string[]; }

export interface ScanResult {
  verdict: Verdict;
  confidence: number;
  aiScore: number;
  visual: VisualResult;
  voice: VoiceResult;
  metadata: MetadataResult;
  lipSync: LipSyncResult;
  timeline: SegmentScore[];
  why: string[];
  demo: boolean;
  disclaimer: string;
}

export type JobStatus = "queued" | "processing" | "done" | "failed";

export interface ScanJob {
  id: string;
  status: JobStatus;
  progress: number;
  progressLabel: string;
  result?: ScanResult;
  error?: { code: string; message: string };
  createdAt: string;
  source: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  source: string;
  result: ScanResult;
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  likely_real: "Likely Real",
  likely_ai: "Likely AI",
  uncertain: "Uncertain",
};

export const ERROR_MESSAGES: Record<string, string> = {
  UNSUPPORTED_LINK: "That link could not be opened. It may be private, deleted, or from an unsupported source.",
  PRIVATE_VIDEO: "That video looks private or login-gated, so it cannot be analysed from its link. Try uploading the file instead.",
  DRM_PROTECTED: "That video is DRM-protected and cannot be analysed.",
  UNSUPPORTED_FILE: "That file type is not supported. Try an MP4 or MOV clip.",
  DOWNLOAD_FAILED: "The video could not be downloaded. Check the link and your connection, then try again.",
  NETWORK_ERROR: "Network error. Check your connection and try again.",
  PROVIDER_ERROR: "Analysis failed on the server. Try again in a moment.",
  FILE_TOO_LARGE: "That clip is too large. Trim it to a shorter clip and try again.",
  NOT_FOUND: "That scan is unknown or has expired.",
};
