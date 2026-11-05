import React, { useRef } from "react";
import { Alert, Button, ScrollView, StyleSheet, View } from "react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { VerdictCard } from "../components/VerdictCard";
import type { ScanJob } from "../lib/types";

/** Result screen: verdict first, shareable card second, no extra taps to the answer. */
export function ResultScreen({ job, onDone, onNewScan }: { job: ScanJob; onDone: () => void; onNewScan: () => void }) {
  const cardRef = useRef<View>(null);
  if (!job.result) return null;

  const shareCard = async () => {
    try {
      const uri = await (cardRef.current as unknown as { capture?: () => Promise<string> })?.capture?.();
      // ViewShot's capture is normally called via its ref API; if the ref
      // shape differs in the installed version, fall back to a plain share.
      if (uri && (await Sharing.isAvailableAsync())) await Sharing.shareAsync(uri);
      else Alert.alert("Share", "Result card image capture is not available in this build.");
    } catch (err) {
      Alert.alert("Share failed", err instanceof Error ? err.message : "Try again.");
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <ViewShot ref={cardRef} options={{ format: "png", quality: 1 }}>
        <VerdictCard result={job.result} source={job.source} />
      </ViewShot>
      <View style={styles.buttons}>
        <Button title="Share result card" onPress={shareCard} />
        <Button title="Scan another" onPress={onNewScan} />
        <Button title="Back to home" onPress={onDone} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 20 },
  buttons: { gap: 10, marginTop: 20 },
});
