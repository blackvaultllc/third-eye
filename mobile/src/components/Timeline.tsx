import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { SegmentScore } from "../lib/types";

/**
 * Per-second suspiciousness timeline. Each block is one second of the clip;
 * red = looks AI, green = looks real, yellow = uncertain. Empty = the
 * provider returned no per-second breakdown, and the UI says so.
 */
export function Timeline({ segments }: { segments: SegmentScore[] }) {
  if (segments.length === 0) {
    return <Text style={styles.empty}>No per-second breakdown was returned for this clip.</Text>;
  }
  return (
    <View>
      <View style={styles.row}>
        {segments.map((seg) => {
          const pct = seg.aiScore * 100;
          const color = pct >= 65 ? "#f87171" : pct <= 35 ? "#34d399" : "#facc15";
          return <View key={seg.start} style={[styles.block, { backgroundColor: color }]} />;
        })}
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>0s</Text>
        <Text style={styles.label}>{segments[segments.length - 1].end}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2, marginTop: 8 },
  block: { flex: 1, height: 28, borderRadius: 3 },
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  label: { color: "#94a3b8", fontSize: 12 },
  empty: { color: "#94a3b8", fontSize: 13, marginTop: 8 },
});
