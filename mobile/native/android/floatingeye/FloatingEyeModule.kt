package com.thirdeye.floatingeye

/**
 * STUB — React Native bridge for FloatingEyeService (see that file).
 * Exposes to JS as NativeModules.FloatingEye:
 *   startFloatingEye(): Promise<String>  // resolves with the clip file URI
 *   stopFloatingEye(): Promise<void>
 * Register it in a ReactPackage after prebuild; until then
 * src/lib/floatingEye.ts reports it as unavailable, honestly.
 */
class FloatingEyeModule {
    // TODO: ReactMethod startFloatingEye / stopFloatingEye, promise resolution
    // from the service's onRecordingFinished callback.
}
