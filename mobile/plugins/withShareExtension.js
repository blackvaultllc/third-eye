/**
 * Share-extension setup for Third Eye.
 *
 * DO NOT hand-roll a second Share Extension alongside expo-share-intent:
 * two extensions fighting over the same share will confuse both stores'
 * reviewers and the user. This plugin is the documentation + wiring point:
 *
 * - iOS: expo-share-intent (in app.json plugins) generates the Share
 *   Extension target on `npx expo prebuild`. It writes the shared file/URL
 *   into the App Group container, and the main app reads it via
 *   useShareIntent() — see src/lib/shareIntent.ts and App.tsx.
 * - Android: the intentFilters in app.json (ACTION_SEND, video/* and
 *   text/plain) register Third Eye as a share target. expo-share-intent
 *   reads the incoming intent and delivers it the same way.
 *
 * Manual steps that remain (once, in Xcode / Android Studio after prebuild):
 * 1. iOS: confirm the Share Extension target's App Group matches the main
 *    app's (group.com.thirdeye.app), and that the extension's
 *    NSExtensionActivationRule allows video + URLs.
 * 2. Android: confirm the intent filter survives prebuild (check
 *    AndroidManifest.xml) and test Share from each target app — TikTok,
 *    Instagram, YouTube, X, Facebook — because each sends a different
 *    payload shape (file vs. URL only). URL-only shares are handled
 *    honestly in shareIntent.ts, not silently failed.
 *
 * This file intentionally exports no config-plugin mutation: the mutation
 * lives in expo-share-intent + app.json, so there is exactly one source
 * of truth for the extension.
 */
module.exports = function withShareExtension(config) {
  return config;
};
