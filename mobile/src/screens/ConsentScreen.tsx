import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

/**
 * Consent screen — shown before ANY upload, every first run, and again
 * after the privacy text changes. No upload path in the app bypasses it:
 * App.tsx gates start() on consent, and the share intent is queued until
 * consent is given, not uploaded in the background.
 */
export function ConsentScreen({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Before you scan</Text>
      <Text style={styles.body}>
        Third Eye sends the clip you choose to its analysis server. The server extracts frames and
        audio, runs detection, and then DELETES the video, frames, and audio. No account is required,
        and your scan history stays on this phone unless you share a result card yourself.
      </Text>
      <Text style={styles.body}>
        Results are estimates, not proof. A “Likely AI” result alone should never be used to accuse
        someone or remove content.
      </Text>
      <Text style={styles.body}>
        Only share or upload videos you have the right to check. Private, login-gated, and
        DRM-protected videos cannot be analysed from a link.
      </Text>
      <View style={styles.buttons}>
        <Button title="I understand — continue" onPress={onAccept} />
        <Button title="Not now" onPress={onDecline} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#020617" },
  title: { color: "#f8fafc", fontSize: 28, fontWeight: "800", marginBottom: 16 },
  body: { color: "#cbd5e1", fontSize: 16, lineHeight: 23, marginBottom: 14 },
  buttons: { gap: 8, marginTop: 12 },
});
