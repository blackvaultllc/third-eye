import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { checkLipSync } from "./lipsync";
import { checkMetadata } from "./metadata";
import { combineScores } from "./combine";
import { extractClip } from "./ffmpeg";
import { isDemo, visualAdapter, voiceAdapter } from "./adapters/factory";
import type { ScanJob } from "./types";

/**
 * Async job queue with polling.
 *
 * This build uses an in-memory queue so the scaffold runs with zero infra.
 * For production, swap this module for BullMQ + Redis: the route layer only
 * uses createJob / getJob, so the swap is contained here. Jobs keep the
 * VERDICT only — the uploaded video and extracted frames are deleted when
 * the job finishes or fails (see finally below), per the privacy promise.
 */
const jobs = new Map<string, ScanJob>();
const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";

export function createJob(source: string): ScanJob {
  const job: ScanJob = {
    id: randomUUID(),
    status: "queued",
    progress: 0,
    progressLabel: "Queued",
    createdAt: new Date().toISOString(),
    source,
  };
  jobs.set(job.id, job);
  // Best-effort TTL for the verdict record (not the video, which is deleted).
  const ttl = Number(process.env.JOB_TTL_SECONDS ?? 3600) * 1000;
  setTimeout(() => jobs.delete(job.id), ttl).unref();
  return job;
}

export function getJob(id: string): ScanJob | undefined {
  return jobs.get(id);
}

export async function runJob(job: ScanJob, videoPath: string): Promise<void> {
  const workDir = join(uploadDir, job.id);
  try {
    job.status = "processing";
    job.progress = 10; job.progressLabel = "Extracting frames and audio…";
    await mkdir(workDir, { recursive: true });
    const clip = await extractClip(videoPath, workDir);

    job.progress = 35; job.progressLabel = "Running visual and voice detection…";
    // Layers run in parallel, exactly as specced.
    const [visual, voice, metadata, lipSync] = await Promise.all([
      visualAdapter().analyzeVisual({ framesDir: clip.framesDir, durationSeconds: clip.durationSeconds }),
      voiceAdapter().analyzeVoice({ audioPath: clip.audioPath, durationSeconds: clip.durationSeconds }),
      checkMetadata(videoPath, clip.format, clip.durationSeconds),
      checkLipSync(videoPath, clip.audioPath),
    ]);

    job.progress = 85; job.progressLabel = "Combining results…";
    const demo = isDemo(visual.provider) || isDemo(voice.provider);
    job.result = combineScores({ visual, voice, metadata, lipSync, demo });
    job.status = "done";
    job.progress = 100; job.progressLabel = "Done";
  } catch (err) {
    job.status = "failed";
    job.error = {
      code: "PROVIDER_ERROR",
      message: err instanceof Error ? err.message : "Analysis failed.",
    };
  } finally {
    // Privacy: delete the video, frames, and audio, whatever happened.
    await rm(videoPath, { force: true }).catch(() => undefined);
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
