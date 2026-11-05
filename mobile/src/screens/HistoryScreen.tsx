import React from "react";
import { Alert, Button, FlatList, StyleSheet, Text, View } from "react-native";
import type { HistoryEntry } from "../lib/types";
import { VERDICT_LABEL } from "../lib/types";

export function HistoryScreen(args: {
  entries: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onBack: () => void;
}) {
  const { entries, onOpen, onDelete, onClear, onBack } = args;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Scan history</Text>
      <Text style={styles.sub}>Stored only on this phone. Delete any entry, or clear all.</Text>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text style={styles.empty}>No scans yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.verdict}>{VERDICT_LABEL[item.result.verdict]} · {item.result.aiScore}/100</Text>
            <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()} · {item.source}</Text>
            <View style={styles.rowButtons}>
              <Button title="View" onPress={() => onOpen(item)} />
              <Button title="Delete" onPress={() => onDelete(item.id)} />
            </View>
          </View>
        )}
      />
      <View style={styles.buttons}>
        <Button title="Clear all history" onPress={() => Alert.alert("Clear history?", "This cannot be undone.", [{ text: "Cancel" }, { text: "Clear all", style: "destructive", onPress: onClear }])} />
        <Button title="Back" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: "#020617" },
  title: { color: "#f8fafc", fontSize: 26, fontWeight: "800" },
  sub: { color: "#94a3b8", fontSize: 13, marginVertical: 8 },
  empty: { color: "#94a3b8", marginTop: 24, textAlign: "center" },
  row: { borderWidth: 1, borderColor: "#1e293b", borderRadius: 12, padding: 14, marginVertical: 6, backgroundColor: "#0f172a" },
  verdict: { color: "#e2e8f0", fontSize: 16, fontWeight: "700" },
  meta: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  rowButtons: { flexDirection: "row", gap: 8, marginTop: 8 },
  buttons: { gap: 10, marginTop: 12 },
});
