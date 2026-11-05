import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function ScoreBar({ label, score01, detail }: { label: string; score01: number; detail?: string }) {
  const pct = Math.round(score01 * 100);
  const color = pct >= 65 ? "#f87171" : pct <= 35 ? "#34d399" : "#facc15";
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{pct}/100</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 8 },
  header: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: "#e2e8f0", fontSize: 15, fontWeight: "600" },
  value: { fontSize: 15, fontWeight: "700" },
  track: { height: 10, borderRadius: 5, backgroundColor: "#1e293b", marginTop: 6, overflow: "hidden" },
  fill: { height: 10, borderRadius: 5 },
  detail: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
});
