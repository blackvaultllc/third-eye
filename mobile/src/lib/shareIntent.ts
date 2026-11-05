/**
 * SHARE-SHEET FLOW — the most reliable intake, built first.
 *
 * How it works (Expo, prebuild required — this does NOT work in Expo Go):
 * 1. User taps Share in TikTok / Instagram / YouTube / X / Facebook and picks Third Eye.
 * 2. expo-share-intent's native extension receives the share and hands it to
 *    the app through `useShareIntent()` (see App.tsx).
 * 3. This module normalises that payload into one of two cases:
 *      - a video FILE  -> upload it directly (reliable, works for private videos
 *        the user already has access to, and for DRM-free downloads).
 *      - a URL only   -> the app cannot download most platform links itself
 *        (private / login-gated / DRM). It tells the user plainly instead of
 *        pretending, and offers camera-roll upload as the fallback.
 *        URL downloading, if ever added, belongs server-side with per-platform
 *        handling — see server README notes, not a silent client fetch.
 */
import type { ShareIntent } from "expo-share-intent";

export type SharedInput =
  | { kind: "file"; uri: string; filename: string; mimeType: string; source: string }
  | { kind: "url_only"; url: string };

export function normaliseShareIntent(intent: ShareIntent | null): SharedInput | null {
  if (!intent) return null;
  const file = intent.files?.[0];
  if (file?.path) {
    const filename = file.fileName ?? file.path.split("/").pop() ?? "shared-video.mp4";
    return {
      kind: "file",
      uri: file.path.startsWith("file://") ? file.path : `file://${file.path}`,
      filename,
      mimeType: file.mimeType ?? "video/mp4",
      source: intent.webUrl ?? intent.text ?? "shared_file",
    };
  }
  const url = intent.webUrl ?? intent.text ?? "";
  if (url.startsWith("http")) return { kind: "url_only", url };
  return null;
}

/** A URL the user pasted/shared without a file attached. */
export function isSupportedShareUrl(url: string): boolean {
  // We accept the URL for display and for the history record, but the server
  // does not download platform links (see header). This is a UX gate, not a
  // promise that the link can be analysed.
  return /^https?:\/\//.test(url);
}
