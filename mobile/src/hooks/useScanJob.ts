import { useCallback, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { pollJob, uploadVideo } from "../lib/api";
import { addHistory } from "../lib/history";
import { recordScanUsed } from "../lib/quota";
import type { ScanJob } from "../lib/types";

export type ScanState =
  | { phase: "idle" }
  | { phase: "uploading" | "scanning"; progress: number; label: string }
  | { phase: "done"; job: ScanJob }
  | { phase: "error"; message: string };

/**
 * Upload -> poll -> history, with haptic feedback on the verdict.
 * The hook owns no provider logic: the server does that, and the app
 * only ever sees job progress + the final verdict.
 */
export function useScanJob() {
  const [state, setState] = useState<ScanState>({ phase: "idle" });
  const cancelled = useRef(false);

  const start = useCallback(async (input: { uri: string; filename: string; mimeType: string; source: string }) => {
    cancelled.current = false;
    setState({ phase: "uploading", progress: 5, label: "Uploading clip…" });
    try {
      const jobId = await uploadVideo(input);
      if (cancelled.current) return;
      const job = await pollJob(jobId, (j) => {
        if (!cancelled.current) setState({ phase: "scanning", progress: j.progress, label: j.progressLabel });
      });
      if (cancelled.current || !job.result) return;
      await addHistory({ id: job.id, createdAt: job.createdAt, source: input.source, result: job.result });
      await recordScanUsed();
      // Haptics on the verdict: success for real, warning for AI, light for uncertain.
      if (job.result.verdict === "likely_ai") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      else if (job.result.verdict === "likely_real") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setState({ phase: "done", job });
    } catch (err) {
      if (!cancelled.current) setState({ phase: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }, []);

  const reset = useCallback(() => {
    cancelled.current = true;
    setState({ phase: "idle" });
  }, []);

  return { state, start, reset };
}
