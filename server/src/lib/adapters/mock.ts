import type { VisualAdapter, VoiceAdapter } from "./types";
import { emptySegments } from "./types";

/**
 * Demo-only adapters. Used when VISUAL_PROVIDER/VOICE_PROVIDER=mock, or when
 * no key is configured and the caller explicitly allows demo mode.
 *
 * They return a neutral 0.5 score and the result is flagged demo:true all
 * the way to the UI, so a demo can never be mistaken for a real verdict.
 * Delete nothing here to "make it look real" — that would break the app's
 * core honesty rule.
 */
export const mockVisual: VisualAdapter = {
  name: "mock (demo)",
  async analyzeVisual({ durationSeconds }) {
    return {
      provider: "mock (demo)",
      aiScore: 0.5,
      segments: emptySegments(durationSeconds),
      notes: ["Demo mode: no visual provider key is configured, so no real visual analysis ran."],
    };
  },
};

export const mockVoice: VoiceAdapter = {
  name: "mock (demo)",
  async analyzeVoice({ durationSeconds }) {
    return {
      provider: "mock (demo)",
      aiScore: 0.5,
      segments: emptySegments(durationSeconds),
      notes: ["Demo mode: no voice provider key is configured, so no real voice analysis ran."],
    };
  },
};
