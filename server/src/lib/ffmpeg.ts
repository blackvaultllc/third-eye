import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface ExtractedClip {
  framesDir: string;
  audioPath: string;
  durationSeconds: number | null;
  format: string | null;
}

/** Extract 1-fps JPEG frames and a mono 16kHz WAV track. Throws on failure. */
export async function extractClip(videoPath: string, workDir: string): Promise<ExtractedClip> {
  const framesDir = `${workDir}/frames`;
  const audioPath = `${workDir}/audio.wav`;
  await mkdir(framesDir, { recursive: true });

  const probe = await probeVideo(videoPath);
  await execFileAsync("ffmpeg", [
    "-y", "-i", videoPath,
    "-vf", "fps=1", "-q:v", "4",
    `${framesDir}/frame-%04d.jpg`,
  ]);
  // Audio is optional: a silent clip still gets a visual verdict.
  try {
    await execFileAsync("ffmpeg", [
      "-y", "-i", videoPath,
      "-vn", "-ac", "1", "-ar", "16000",
      audioPath,
    ]);
  } catch {
    // Leave audioPath missing; the voice layer reports "no audio track".
  }
  return { framesDir, audioPath, durationSeconds: probe.duration, format: probe.format };
}

async function probeVideo(videoPath: string): Promise<{ duration: number | null; format: string | null }> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet", "-print_format", "json",
      "-show_format", videoPath,
    ]);
    const parsed = JSON.parse(stdout) as { format?: { duration?: string; format_name?: string } };
    return {
      duration: parsed.format?.duration ? Number(parsed.format.duration) : null,
      format: parsed.format?.format_name ?? null,
    };
  } catch {
    return { duration: null, format: null };
  }
}

/** True when the file's bytes contain a C2PA / Content Credentials marker. */
export async function sniffC2PA(videoPath: string): Promise<boolean> {
  try {
    const buf = await readFile(videoPath);
    // MP4/JPEG C2PA manifests live in a `c2pa` box / JUMBF segment.
    return buf.includes(Buffer.from("c2pa")) || buf.includes(Buffer.from("Content Credentials"));
  } catch {
    return false;
  }
}
