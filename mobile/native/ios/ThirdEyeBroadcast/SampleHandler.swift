import ReplayKit

/**
 * STUB / SKELETON — iOS Broadcast Upload Extension (the iOS fallback for
 * screen capture, since iOS has no floating overlay button).
 *
 * How it is meant to work:
 * 1. User starts a broadcast from Control Center → picks Third Eye.
 * 2. This extension receives CMSampleBuffers in processSampleBuffer.
 * 3. It writes them to a temp file in the shared App Group container
 *    (group.com.thirdeye.app), capped at ~10 seconds, then stops.
 * 4. When the broadcast finishes, the main app (opened via the
 *    thirdeye:// scheme, or on next launch) reads that file from the
 *    App Group and offers it as a scan — exactly like a camera-roll clip.
 *
 * What is NOT here yet, on purpose: the AVAssetWriter wiring, the
 * 10-second cap, and the handoff to the main app. Those need an Xcode
 * Broadcast Upload Extension target + App Group entitlement, which
 * Expo prebuild does not generate. Until that target exists and is
 * tested on a real device, iOS users use Share + camera-roll upload,
 * and the Home screen says so plainly.
 */
class SampleHandler: RPBroadcastSampleHandler {
    override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
        // TODO: start AVAssetWriter to the App Group container.
    }

    override func broadcastPaused() {
        // TODO: pause writer.
    }

    override func broadcastResumed() {
        // TODO: resume writer.
    }

    override func broadcastFinished() {
        // TODO: finish writer, notify the main app via the App Group flag file.
    }

    override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
        // TODO: append video samples only; drop audio/app-info samples.
        // Never stream samples off-device from inside the extension.
    }
}
