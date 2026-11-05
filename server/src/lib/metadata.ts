import type { MetadataResult } from "./types";
import { sniffC2PA } from "./ffmpeg";

/**
 * Metadata layer. It reports only what the file itself proves:
 * - a C2PA / Content Credentials marker present in the bytes, and
 * - container format / duration from ffprobe.
 *
 * It does NOT claim a platform AI label: a shared link alone does not prove
 * a platform labelled the video, and a downloaded file usually strips that
 * label. If a future integration receives a platform's label through an
 * official API, add it here as a separate, sourced field — never inferred.
 */
export async function checkMetadata(videoPath: string, format: string | null, durationSeconds: number | null): Promise<MetadataResult> {
  const hasC2PA = await sniffC2PA(videoPath);
  const notes: string[] = [];
  if (hasC2PA) notes.push("Content Credentials (C2PA) marker found in the file — check its manifest for the claimed origin.");
  else notes.push("No C2PA / Content Credentials marker found. That is common: most shared videos strip or never had one.");
  notes.push("No platform AI label could be verified from the file alone.");
  return {
    hasC2PA,
    hasContentCredentials: hasC2PA,
    containerFormat: format,
    durationSeconds,
    notes,
  };
}
