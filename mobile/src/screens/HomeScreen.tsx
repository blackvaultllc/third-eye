import React from "react";
import { ActivityIndicator, Alert, Button, Platform, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ThirdEyeLogo } from "../components/ThirdEyeLogo";
import { isFloatingEyeAvailable, startFloatingEye } from "../lib/floatingEye";
import type { ScanState } from "../hooks/useScanJob";

export function HomeScreen(args: {
  scan: ScanState;
  remaining: number;
  isPro: boolean;
  onPickFile: (input: { uri: string; filename: string; mimeType: string; source: string }) => void;
  onShowHistory: () => void;
  onUpgrade: () => void;
}) {
  const { scan, remaining, isPro, onPickFile, onShowHistory, onUpgrade } = args;

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to pick a video.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 1 });
    const asset = res.assets?.[0];
    if (res.canceled || !asset?.uri) return;
    onPickFile({ uri: asset.uri, filename: asset.fileName ?? "video.mp4", mimeType: asset.mimeType ?? "video/mp4", source: "camera_roll" });
  };

  const floatingEye = async () => {
    try {
      const uri = await startFloatingEye();
      onPickFile({ uri, filename: "screen-capture.mp4", mimeType: "video/mp4", source: "floating_eye" });
    } catch (err) {
      Alert.alert("Floating eye unavailable", err instanceof Error ? err.message : "Try Share or camera-roll upload.");
    }
  };

  const busy = scan.phase === "uploading" || scan.phase === "scanning";

  return (
    <View style={styles.wrap}>
      <ThirdEyeLogo />
      <Text style={styles.title}>Third Eye</Text>
      <Text style={styles.sub}>Is this video real, or AI?</Text>
      <Text style={styles.quota}>
        {isPro ? "Pro — unlimited scans" : `${remaining} free scan${remaining === 1 ? "" : "s"} left today`}
      </Text>

      {busy ? (
        <View style={styles.progress}>
          <ActivityIndicator size="large" color="#22d3ee" />
          <Text style={styles.progressLabel}>{scan.label} ({scan.progress}%)</Text>
          <Text style={styles.progressNote}>Scans usually take 5–60 seconds.</Text>
        </View>
      ) : (
        <View style={styles.buttons}>
          <Button title="Pick a video from camera roll" onPress={pickFromLibrary} />
          <Button title="Share a video to Third Eye" onPress={() => Alert.alert("Share to Third Eye", "In TikTok, Instagram, YouTube, X, or Facebook, tap Share and pick Third Eye. The clip will land here for scanning.")} />
          {Platform.OS === "android" ? (
            <Button
              title={isFloatingEyeAvailable() ? "Floating eye — record screen (5–10s)" : "Floating eye (needs native build)"}
              onPress={floatingEye}
            />
          ) : (
            <Button title="Screen recording (iOS)" onPress={() => Alert.alert("iOS screen recording", "Use the Broadcast Upload Extension from Control Center, or pick a screen recording from your camera roll. iOS does not allow a floating overlay button.")} />
          )}
          <Button title="History" onPress={onShowHistory} />
          {!isPro ? <Button title="Go Pro — unlimited scans" onPress={onUpgrade} /> : null}
        </View>
      )}
      {scan.phase === "error" ? <Text style={styles.error}>{scan.message}</Text> : null}
      <Text style={styles.foot}>Results are estimates, not proof. Videos are deleted from the server after analysis.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" },
  title: { color: "#f8fafc", fontSize: 34, fontWeight: "800", marginTop: 16 },
  sub: { color: "#94a3b8", fontSize: 16, marginTop: 6, textAlign: "center" },
  quota: { color: "#22d3ee", fontSize: 14, fontWeight: "600", marginTop: 12 },
  buttons: { width: "100%", gap: 10, marginTop: 24 },
  progress: { alignItems: "center", marginTop: 24 },
  progressLabel: { color: "#e2e8f0", fontSize: 16, marginTop: 12 },
  progressNote: { color: "#94a3b8", fontSize: 13, marginTop: 6 },
  error: { color: "#f87171", fontSize: 14, marginTop: 16, textAlign: "center" },
  foot: { color: "#64748b", fontSize: 12, textAlign: "center", marginTop: 24, lineHeight: 17 },
});
