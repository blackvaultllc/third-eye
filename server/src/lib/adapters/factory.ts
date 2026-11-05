import { bitmindVisual } from "./bitmind";
import { hiveVisual } from "./hive";
import { mockVisual, mockVoice } from "./mock";
import { resembleVoice } from "./resemble";
import type { VisualAdapter, VoiceAdapter } from "./types";

/**
 * Adapter selection is env-driven and server-only.
 * Unknown provider names fall back to mock (flagged demo) rather than
 * crashing the whole service — but the fallback is visible in the result.
 */
export function visualAdapter(): VisualAdapter {
  const name = (process.env.VISUAL_PROVIDER ?? "mock").toLowerCase();
  try {
    if (name === "hive") return hiveVisual();
    if (name === "bitmind") return bitmindVisual();
  } catch {
    // Missing key/endpoint: fall through to mock so local dev still runs,
    // with demo:true making it obvious no real provider ran.
  }
  return mockVisual;
}

export function voiceAdapter(): VoiceAdapter {
  const name = (process.env.VOICE_PROVIDER ?? "mock").toLowerCase();
  try {
    if (name === "resemble") return resembleVoice();
  } catch {
    // Same fall-through as above.
  }
  return mockVoice;
}

export function isDemo(providerName: string): boolean {
  return providerName.includes("mock");
}
