import { Router } from "express";
import multer from "multer";
import { mkdirSync } from "node:fs";
import { createJob, getJob, runJob } from "../lib/queue";
import { ERROR_MESSAGES } from "../lib/types";

const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
mkdirSync(uploadDir, { recursive: true });

const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 200);
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Accept common phone/container formats only.
    const ok = /^(video\/|application\/octet-stream)/.test(file.mimetype)
      || /\.(mp4|mov|m4v|webm|mkv)$/i.test(file.originalname);
    // @types/multer narrows the callback's error param to null; cast to pass a real error.
    (cb as (err: Error | null, accept: boolean) => void)(ok ? null : new Error("UNSUPPORTED_FILE"), ok);
  },
});

export const scansRouter = Router();

/**
 * POST /scans — upload a clip, get a job id, poll GET /scans/:id.
 * Body: multipart `video` file, optional `source` string (shared URL or "file_upload").
 * URL-only intake (no file) is intentionally NOT implemented here: downloading
 * from TikTok/Instagram/YouTube/X/Facebook links needs per-platform handling
 * (private videos, login gates, DRM) and is a separate, explicitly-scoped
 * feature — see README "URL intake" notes. The app sends the file it received
 * through the share sheet instead, which is the reliable path.
 */
scansRouter.post("/", upload.single("video"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { code: "UNSUPPORTED_FILE", message: ERROR_MESSAGES.UNSUPPORTED_FILE } });
    return;
  }
  const job = createJob(req.body?.source ?? "file_upload");
  // Fire-and-forget: the client polls. The job deletes its files on completion.
  void runJob(job, req.file.path);
  res.status(202).json({ jobId: job.id, status: job.status });
});

scansRouter.get("/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "That scan is unknown or has expired." } });
    return;
  }
  res.json(job);
});

// Multer / filter errors mapped to the app's plain-English error codes.
scansRouter.use((err: Error, _req: unknown, res: import("express").Response, next: import("express").NextFunction) => {
  if (err.message === "UNSUPPORTED_FILE") {
    res.status(415).json({ error: { code: "UNSUPPORTED_FILE", message: ERROR_MESSAGES.UNSUPPORTED_FILE } });
    return;
  }
  if ((err as { code?: string }).code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: { code: "FILE_TOO_LARGE", message: ERROR_MESSAGES.FILE_TOO_LARGE } });
    return;
  }
  next(err);
});
