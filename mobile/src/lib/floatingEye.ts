/**
 * ANDROID FLOATING EYE — native module wrapper (STUB wiring, see README).
 *
 * Real behaviour needs a prebuild native module, because Expo Go cannot:
 * - draw an overlay window (SYSTEM_ALERT_WINDOW), or
 * - capture the screen (MediaProjection).
 *
 * Native side — skeletons at mobile/native/android/floatingeye/:
 * - FloatingEyeService.kt: foreground service, overlay button, MediaProjection
 *   capture, records 5-10s to a temp file, then hands the file to the app.
 * - FloatingEyeModule.kt: React Native bridge exposing start/stop + the
 *   recorded file path.
 *
 * Until that module is built and linked, this wrapper throws a clear error
 * instead of pretending the button works. The iOS equivalent is a Broadcast
 * Upload Extension (mobile/native/ios/ThirdEyeBroadcast/) — iOS has no floating overlay.
 */
import { NativeModules } from "react-native";

type FloatingEyeBridge = {
  startFloatingEye?: () => Promise<string>;
  stopFloatingEye?: () => Promise<void>;
};

const bridge = NativeModules.FloatingEye as FloatingEyeBridge | undefined;

export function isFloatingEyeAvailable(): boolean {
  return Boolean(bridge?.startFloatingEye);
}

/** Start the overlay; resolves with the recorded clip's file URI (5-10s). */
export async function startFloatingEye(): Promise<string> {
  if (!bridge?.startFloatingEye) {
    throw new Error(
      "Floating eye needs the native module (prebuild + overlay + MediaProjection permissions). " +
        "Use Share or camera-roll upload for now.",
    );
  }
  return bridge.startFloatingEye();
}

export async function stopFloatingEye(): Promise<void> {
  await bridge?.stopFloatingEye?.();
}
