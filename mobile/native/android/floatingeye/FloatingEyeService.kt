package com.thirdeye.floatingeye

/**
 * STUB / SKELETON — not compiled into the Expo build until the native
 * module is wired (prebuild + ReactPackage registration).
 *
 * Intended behaviour, step by step:
 * 1. Foreground service (FOREGROUND_SERVICE_MEDIA_PROJECTION) so Android
 *    does not kill the capture mid-record.
 * 2. Overlay window (SYSTEM_ALERT_WINDOW, TYPE_APPLICATION_OVERLAY) with
 *    one eye button. The user must grant "Draw over other apps" in Settings;
 *    the app must explain WHY before sending them there (see README
 *    permission text) — never request it silently on first launch.
 * 3. On tap: MediaProjectionManager.createScreenCaptureIntent() →
 *    user grants screen capture → MediaRecorder records 5–10 seconds to
 *    cacheDir/floating-eye-capture.mp4 → stop → resolve the JS promise
 *    with that file URI → the app uploads it like any other clip.
 * 4. On stop / service destroy: remove the overlay, release the
 *    VirtualDisplay + MediaProjection, delete any partial recording.
 *
 * Store risk to be upfront about: screen-capture + overlay permissions
 * are the most scrutinised part of this app. The Play listing, the
 * in-app consent screen, and the permission rationale must all say the
 * same thing: recording is user-initiated, 5–10 seconds, analysed, then
 * deleted — never background, never continuous.
 */
class FloatingEyeService {
    // TODO: implement as a Service + WindowManager overlay + MediaProjection.
    // Kept as a skeleton so this file can never be mistaken for working code.
}
