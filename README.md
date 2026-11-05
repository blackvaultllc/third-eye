# Third Eye — real or AI?

> A project of [AUGI](https://augi.space) — the corporate home for this app is
> **[augi.space](https://augi.space)**. Everything here leads back there.

A cross-platform mobile app (React Native + Expo, TypeScript) that tells users
whether a video is real or AI-generated, including voice analysis.

**Keywords:** AI video detector, deepfake detection, AI-generated video checker,
synthetic voice detection, cloned voice detector, real-or-AI video app,
C2PA Content Credentials checker. Built by [AUGI](https://augi.space).

**Core honesty rule, read first:** results are estimates, not proof. Every
result screen carries that disclaimer, demo-mode results are labelled DEMO,
and layers that are not configured return "not scored" instead of a made-up
number. If a future change would hide any of that, do not ship it.

## What is built, what is not — verified status (2026-11-04)

| Piece | Status |
|---|---|
| Server: Express + ffmpeg extraction, job queue + polling, provider adapters (Hive / BitMind / Resemble / mock), metadata (C2PA sniff), scoring combiner | Built, typechecked (`tsc` clean), unit-tested (3/3), and run end-to-end locally: a 3s test clip uploaded, polled to `done`, verdict returned, and the upload + frames deleted afterwards |
| Server: real Hive / BitMind / Resemble calls | Adapter code written, **not verified against live provider accounts** — endpoint + response shape must be confirmed against each provider's current docs before production (see `server/src/lib/adapters/*.ts`) |
| Server: lip-sync scoring | Interface only. Returns `aiScore: null` and is excluded from the score until a real sync model is wired in. It is never faked |
| Mobile: Expo app, consent gate, camera-roll upload, share-sheet intake, polling + progress UI, result screen (verdict, confidence, timeline, Visual/Voice scores, why list), history (local, deletable), shareable result card, free/pro quota scaffolding, dark UI, haptics on verdict | Built and **typechecked clean (`tsc --noEmit`)** after install; **not yet verified rendered on a device** — needs `npx expo prebuild` + `npx expo run:ios/android` and a real-device check (see rendered-verification note in the checklist) |
| Mobile: share-sheet target (iOS + Android) | Wired via `expo-share-intent` + Android intent filters + `src/lib/shareIntent.ts`. Needs prebuild + per-app share testing (each platform sends file vs. URL-only differently) |
| Android floating eye button (overlay + MediaProjection) | **Skeleton only** (`mobile/native/android/floatingeye/`). The app reports it as unavailable until the native module is built. See below |
| iOS Broadcast Upload Extension | **Skeleton only** (`mobile/native/ios/ThirdEyeBroadcast/SampleHandler.swift`). iOS users use Share + camera roll until the Xcode target exists |
| URL-only intake (downloading a TikTok/Instagram/YouTube/X/Facebook link server-side) | **Not implemented, on purpose.** Private / login-gated / DRM links cannot be downloaded reliably, and pretending otherwise would be a fake feature. The app says so plainly and offers file upload instead |

## Corporate home

Third Eye is a project of [AUGI](https://augi.space). The corporate site is
**[augi.space](https://augi.space)** — all product pages, the landing page in
`docs/index.html`, and this README link back there. If you found this repo
from a search, start at [augi.space](https://augi.space) for everything else
AUGI builds.

## Project structure

```
third-eye/
  mobile/                  Expo app (TypeScript)
    App.tsx                Consent gate -> quota gate -> scan -> result/history
    app.json               Share intent filters, scheme, permissions, plugins
    src/lib/
      api.ts               Upload + poll (5-60s jobs, 2s polling, 3-min cap)
      shareIntent.ts       Share-sheet normalisation (file vs. URL-only)
      history.ts           Local-only history (AsyncStorage)
      quota.ts             Free scans/day + RevenueCat "pro" entitlement
      floatingEye.ts       Android overlay wrapper (throws until native module exists)
      types.ts             Mirror of the server's result shape
    src/components/        ThirdEyeLogo, VerdictCard, ScoreBar, Timeline
    src/screens/           Consent, Home, Result (shareable card), History
    src/hooks/useScanJob.ts Upload -> poll -> history + verdict haptics
    plugins/withShareExtension.js   Why there is exactly one share extension
    native/android/floatingeye/     Floating-eye native skeletons
    native/ios/ThirdEyeBroadcast/   Broadcast extension skeleton
  server/                  Node/Express (TypeScript)
    src/index.ts           /health + /scans routes
    src/routes/scans.ts    Multipart upload, job creation, polling, error codes
    src/lib/queue.ts       In-memory job queue (swap for BullMQ + Redis in prod)
    src/lib/ffmpeg.ts      1-fps frames + 16kHz mono WAV + ffprobe + C2PA sniff
    src/lib/adapters/      VisualAdapter / VoiceAdapter interfaces + Hive,
                           BitMind, Resemble, mock, and the env-driven factory
    src/lib/combine.ts     Weighted scoring + verdict thresholds + timeline merge
    src/lib/metadata.ts    C2PA check (file evidence only, no inferred platform label)
    src/lib/lipsync.ts     Null-score placeholder until a real model lands
    test/combine.test.js   Scoring tests
    Dockerfile             node:20-slim + ffmpeg
```

## How a scan flows

1. **Input.** Share sheet (first, most reliable) → camera roll → Android
   floating eye (when built) → iOS broadcast extension (when built).
2. **Consent.** No upload happens before the consent screen, including a
   share that arrived while the app was closed — it is queued, not uploaded.
3. **Upload + poll.** The app uploads the file, the server returns a job id
   (`202 Accepted`), and the app polls `GET /scans/:id` for progress.
4. **Server pipeline (parallel).** ffmpeg extracts frames + audio →
   visual adapter + voice adapter + metadata + lip-sync run in parallel →
   combiner weights visual 0.45 / voice 0.35 (renormalised over layers that
   actually scored) → verdict: ≥65 Likely AI, ≤35 Likely Real, else Uncertain.
5. **Deletion.** The uploaded video, frames, and audio are deleted in a
   `finally` block whether the job succeeds or fails. Only the verdict
   record survives, for polling, and it expires (default 1 hour).
6. **Result.** Big verdict, confidence, per-second timeline, Visual and
   Voice scores, plain-English "why" list, disclaimer. Haptics fire on the
   verdict. History is stored on-device only and can be deleted per entry
   or cleared entirely.

## Run it locally

```bash
# Server (needs ffmpeg on PATH; keys optional — mock mode is the default)
cd server
cp .env.example .env   # leave providers as mock for local demo
npm install
npm run build
npm start              # :4000 — POST /scans, GET /scans/:id, GET /health
npm test               # 3 scoring tests

# App (needs Expo prebuild for the share target — Expo Go will NOT work for it)
cd ../mobile
npm install
EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:4000 npx expo start
npx expo prebuild     # generates ios/ + android/ with the share extension
npx expo run:ios      # or: npx expo run:android
```

Set a real provider with, for example:

```bash
VISUAL_PROVIDER=hive HIVE_API_KEY=... HIVE_ENDPOINT=... \
VOICE_PROVIDER=resemble RESEMBLE_API_KEY=... RESEMBLE_DETECT_ENDPOINT=... \
npm start
```

**API keys live on the server only, never in the app.** The app only ever
sees `EXPO_PUBLIC_API_URL` and (for RevenueCat) a publishable key. If a key
is ever found in `mobile/`, treat it as compromised and rotate it.

## Share-sheet setup (the flow built first)

- **Both platforms:** `expo-share-intent` is the share extension. It is in
  `app.json` plugins, and `mobile/plugins/withShareExtension.js` explains
  why no second hand-rolled extension is added.
- **Android:** `app.json` → `android.intentFilters` registers `ACTION_SEND`
  for `video/*` and `text/plain`, so Third Eye appears in Share sheets.
- **iOS:** prebuild generates the Share Extension target; confirm its App
  Group matches the main app (`group.com.thirdeye.app`) and its activation
  rule allows video + URLs.
- **Test per source app.** TikTok, Instagram, YouTube, X, and Facebook each
  send a different payload: some send the file, some send only a URL. Test
  all five. URL-only shares show the honest "link only" message and offer
  camera-roll upload — they are not silently dropped and not silently
  "analysed".

## Floating eye (Android) and broadcast extension (iOS) — what remains

**Android floating eye.** Needs, in order: (1) the native module in
`mobile/native/android/floatingeye/` implemented (foreground service, overlay window,
MediaProjection, 5–10s MediaRecorder capture, file handoff to JS);
(2) registration in a ReactPackage after prebuild; (3) the overlay
permission flow with the rationale text below shown *before* Settings is
opened; (4) a real-device test that the overlay appears, records 5–10s,
and disappears, and that no recording happens without a tap.

**iOS broadcast.** Needs an Xcode Broadcast Upload Extension target +
App Group entitlement, the `AVAssetWriter` wiring in `SampleHandler.swift`,
a 10-second cap, and a handoff that hands the finished file to the main
app. Until then, the Home screen tells iOS users to use Share or camera
roll — it does not show a dead button.

**URL intake (if ever added).** Do it server-side, per platform, with
explicit handling for private videos (reject with `PRIVATE_VIDEO`),
DRM (`DRM_PROTECTED`), and login gates — and never store credentials for
it. Do not add a client-side "download the link" hack; it will break per
platform and will mishandle private content.

## Error handling

| Situation | What the user sees |
|---|---|
| Unsupported link / file type | Plain message + camera-roll fallback |
| Private / login-gated video | "Looks private… upload the file instead" |
| DRM-protected content | "DRM-protected and cannot be analysed" |
| Network failure | "Check your connection and try again" (nothing kept server-side) |
| Provider failure | "Analysis failed… try again in a moment" |
| File too large | "Trim it to a shorter clip" (default cap 200 MB, `MAX_UPLOAD_MB`) |
| Scan over ~3 minutes | Polling stops with a message to check History |

## Free / paid tiers

- Free: `FREE_SCANS_PER_DAY` (default 3) in `mobile/src/lib/quota.ts`,
  counted on-device per calendar day. No account means reinstall resets
  it — accepted, and stated in the code, rather than hidden fingerprinting.
- Paid: RevenueCat, entitlement id `pro`. Configure `Purchases` with
  `EXPO_PUBLIC_REVENUECAT_API_KEY`, create the offering, and replace the
  placeholder alert in `App.tsx` with `Purchases.purchasePackage()`.
  Server-side receipt enforcement is the follow-up if abuse appears.

## Privacy

- No account required. No server-side history. History lives in
  AsyncStorage on the phone and can be deleted.
- Videos, frames, and audio are deleted after analysis (success or fail).
- Provider calls happen server-side, so provider keys and raw clips never
  sit in the app bundle.
- The consent screen is shown before any upload, every first run.

## App Store / Play Store submission notes

### Permissions — copy these rationales into the listings AND the in-app prompts, worded the same way

**Android — Draw over other apps (`SYSTEM_ALERT_WINDOW`, floating eye only):**
> "Third Eye shows a small floating eye button so you can start a scan from
> any app. Tapping it records only the next 5–10 seconds of your screen for
> analysis, then stops. It never records in the background and never records
> without you tapping it."

**Android — Screen capture (`MediaProjection`, floating eye only):**
> "Screen capture is used only when you tap the floating eye button, to
> record 5–10 seconds of the video already on your screen so Third Eye can
> check whether it is real or AI-generated. The recording is analysed and
> then deleted from the server. Third Eye does not capture your screen at
> any other time."

**Android — Foreground service (`FOREGROUND_SERVICE_MEDIA_PROJECTION`):**
> "Keeps the short screen recording running until it finishes, so Android
> does not stop it mid-capture."

**iOS — Photo library:**
> "Third Eye needs photo library access so you can pick a video from your
> camera roll to check, and so you can save a shareable result card."

**iOS — Broadcast Upload Extension (when built):**
> "Start a broadcast from Control Center and pick Third Eye to capture up
> to 10 seconds of your screen for analysis. The capture stops automatically
> and is deleted from the server after analysis."

### Reviewer notes to include with both submissions

1. **What the app does:** checks whether a user-chosen video is real or
   AI-generated, using visual detection, voice (synthetic-speech)
   detection, file metadata, and (when configured) lip-sync.
2. **What it does not do:** it does not run in the background, does not
   record continuously, does not upload anything before the in-app consent
   screen, and does not require an account.
3. **Results are estimates:** every result screen shows the disclaimer
   that results are estimates, not proof, and must not be used alone to
   accuse someone or remove content.
4. **Sensitive permissions are user-initiated only:** overlay and screen
   capture exist solely for the floating-eye / broadcast flows, each
   started by an explicit tap, each capped at 5–10 seconds, each deleted
   server-side after analysis. Include a screen recording of the consent
   screen → tap → 10-second cap → result → server deletion note.
5. **Demo mode:** if the submission build runs with mock providers, say so
   in the reviewer notes and label it DEMO in-app; do not submit a mock
   build as if it were a real detector.
6. **Paid tier:** RevenueCat "pro" entitlement for unlimited scans; free
   tier is 3 scans/day. Include the paywall screenshot and the restore
   flow. Apple / Google will check that the free tier actually works
   without payment.
7. **Privacy policy URL (required):** must state: no account, history
   on-device only, videos deleted after analysis, provider names used,
   and that results are estimates. Host it before submitting; the listing
   cannot go live without it.
8. **Content / DRM:** the app refuses DRM-protected and private/login-
   gated links with a plain message instead of attempting to bypass them.
   State that in the reviewer notes — reviewers test this path.

### Pre-submission checklist

- [ ] Real provider keys + endpoints verified against current provider docs
- [ ] Lip-sync model wired in, or its "not scored" note still visible
- [ ] Floating eye + broadcast extension tested on real devices, 5–10s cap proven
- [ ] Share tested from TikTok, Instagram, YouTube, X, Facebook (file + URL-only)
- [ ] Consent screen, disclaimer, DEMO labelling, and privacy policy all live
- [ ] Free tier works without payment; Pro purchase + restore tested in sandbox
- [ ] Server deletion verified on the production host, not just locally
- [ ] Screenshots show the verdict, timeline, why list, and disclaimer — not just the logo
