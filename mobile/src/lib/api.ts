import type { ScanJob } from "./types";
import { ERROR_MESSAGES } from "./types";

// Set in app config / EAS env (EXPO_PUBLIC_API_URL). Never put provider keys here.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export class ScanApiError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? ERROR_MESSAGES[code] ?? "Something went wrong.");
    this.code = code;
  }
}

async function parseError(res: Response): Promise<ScanApiError> {
  try {
    const body = await res.json() as { error?: { code?: string; message?: string } };
    const code = body.error?.code ?? "PROVIDER_ERROR";
    return new ScanApiError(code, body.error?.message);
  } catch {
    return new ScanApiError("NETWORK_ERROR");
  }
}

/** Upload a local video file and return the job id. The server deletes the file after analysis. */
export async function uploadVideo(args: { uri: string; filename: string; mimeType: string; source: string }): Promise<string> {
  const form = new FormData();
  // React Native FormData file shape.
  form.append("video", { uri: args.uri, name: args.filename, type: args.mimeType } as unknown as Blob);
  form.append("source", args.source);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/scans`, { method: "POST", body: form });
  } catch {
    throw new ScanApiError("NETWORK_ERROR");
  }
  if (!res.ok) throw await parseError(res);
  const body = await res.json() as { jobId: string };
  return body.jobId;
}

/** Poll a job until it finishes. Scans take 5-60s; poll every 2s, cap at 3 minutes. */
export async function pollJob(jobId: string, onProgress?: (job: ScanJob) => void): Promise<ScanJob> {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/scans/${jobId}`);
    } catch {
      throw new ScanApiError("NETWORK_ERROR");
    }
    if (!res.ok) throw await parseError(res);
    const job = await res.json() as ScanJob;
    onProgress?.(job);
    if (job.status === "done" && job.result) return job;
    if (job.status === "failed") {
      throw new ScanApiError(job.error?.code ?? "PROVIDER_ERROR", job.error?.message);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new ScanApiError("PROVIDER_ERROR", "Analysis is taking longer than expected. Check History and try again.");
}
