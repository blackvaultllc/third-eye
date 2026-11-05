import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ScanResult } from "../lib/types";
import { VERDICT_LABEL } from "../lib/types";
import { ScoreBar } from "./ScoreBar";
import { Timeline } from "./Timeline";
import { ThirdEyeLogo } from "./ThirdEyeLogo";

/**
 * The result card — also the shareable image. Wrap it in a ViewShot ref
 * in ResultScreen; the capture is of this exact component, so the shared
 * card can never drift from the on-screen verdict.
 */
export const VerdictCard = forwardRef<View, { result: ScanResult; source: string }>(function VerdictCard({ result, source }, ref) {
  const color = result.verdict === "likely_ai" ? "#f87171" : result.verdict === "likely_real" ? "#34d399" : "#facc15";
  return (
    <View ref={ref} style={styles.card}>
      <ThirdEyeLogo size={64} />
      <Text style={[styles.verdict, { color }]}>{VERDICT_LABEL[result.verdict]}</Text>
      <Text style={styles.score}>AI likelihood {result.aiScore}/100 · Confidence {result.confidence}%</Text>
      {result.demo ? <Text style={styles.demo}>DEMO — no real provider ran for this scan</Text> : null}
      <ScoreBar label="Visual" score01={result.visual.aiScore} detail={result.visual.notes[0]} />
      <ScoreBar label="Voice" score01={result.voice.aiScore} detail={result.voice.notes[0]} />
      <Text style={styles.section}>Suspicious seconds</Text>
      <Timeline segments={result.timeline} />
      <Text style={styles.section}>Why</Text>
      {result.why.map((line) => (
        <Text key={line} style={styles.why}>• {line}</Text>
      ))}
      {result.metadata.hasC2PA ? <Text style={styles.why}>• Content Credentials marker found in the file.</Text> : null}
      <Text style={styles.disclaimer}>{result.disclaimer}</Text>
      <Text style={styles.source}>Checked from: {source}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: "#0f172a", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#1e293b" },
  verdict: { fontSize: 34, fontWeight: "800", textAlign: "center", marginTop: 12 },
  score: { color: "#e2e8f0", textAlign: "center", fontSize: 15, marginTop: 4 },
  demo: { color: "#facc15", textAlign: "center", fontSize: 13, fontWeight: "700", marginTop: 6 },
  section: { color: "#e2e8f0", fontSize: 16, fontWeight: "700", marginTop: 18 },
  why: { color: "#cbd5e1", fontSize: 14, lineHeight: 20, marginTop: 6 },
  disclaimer: { color: "#94a3b8", fontSize: 12, lineHeight: 17, marginTop: 18, fontStyle: "italic" },
  source: { color: "#64748b", fontSize: 11, marginTop: 10 },
});
