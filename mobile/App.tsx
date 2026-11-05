import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShareIntentProvider, useShareIntent } from "expo-share-intent";
import { ConsentScreen } from "./src/screens/ConsentScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { useScanJob } from "./src/hooks/useScanJob";
import { normaliseShareIntent } from "./src/lib/shareIntent";
import { clearHistory, deleteHistoryEntry, loadHistory } from "./src/lib/history";
import { hasProEntitlement, remainingFreeScans } from "./src/lib/quota";
import type { HistoryEntry, ScanJob } from "./src/lib/types";

const CONSENT_KEY = "third-eye:consent:v1";
type Route = "home" | "history" | "result";

/**
 * App shell. Order of gates, on purpose:
 * 1. Consent — no upload happens before it, including a share that arrived
 *    while the app was closed. The share payload is queued, not uploaded.
 * 2. Quota — free scans left, or Pro. The upload never starts over quota.
 * 3. Scan — upload, poll, verdict, haptics, history.
 *
 * Share-sheet entry: expo-share-intent delivers the payload through
 * useShareIntent() once the provider mounts. If it is a file, it is
 * queued for scanning after consent; if it is a URL only, the user is
 * told plainly that a link alone cannot be analysed (see shareIntent.ts).
 */
function Inner() {
  const [consented, setConsented] = useState<boolean | null>(null);
  const [route, setRoute] = useState<Route>("home");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyJob, setHistoryJob] = useState<ScanJob | null>(null);
  const [remaining, setRemaining] = useState(3);
  const [isPro, setIsPro] = useState(false);
  const { state: scan, start, reset } = useScanJob();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    (async () => {
      setConsented((await AsyncStorage.getItem(CONSENT_KEY)) === "yes");
      setHistory(await loadHistory());
      setRemaining(await remainingFreeScans());
      setIsPro(await hasProEntitlement());
    })();
  }, []);

  // A share that arrived before consent is held, not uploaded.
  useEffect(() => {
    if (!hasShareIntent || !consented) return;
    const input = normaliseShareIntent(shareIntent);
    void resetShareIntent();
    if (!input) return;
    if (input.kind === "url_only") {
      Alert.alert(
        "Link only — no video attached",
        "That share sent a link, not the video file, so Third Eye cannot download it (private / login-gated / DRM links especially). If you can, download the video in the source app and share the file, or pick it from your camera roll.",
      );
      return;
    }
    void startScan(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent, consented]);

  const startScan = async (input: { uri: string; filename: string; mimeType: string; source: string }) => {
    const pro = await hasProEntitlement();
    const left = await remainingFreeScans();
    setIsPro(pro);
    setRemaining(left);
    if (!pro && left <= 0) {
      Alert.alert("Free scans used up", "You have used today's free scans. Go Pro for unlimited scans, or try again tomorrow.");
      return;
    }
    setRoute("home");
    await start(input);
  };

  useEffect(() => {
    if (scan.phase === "done") {
      setRoute("result");
      void (async () => setRemaining(await remainingFreeScans()))();
    }
  }, [scan]);

  const acceptConsent = async () => {
    await AsyncStorage.setItem(CONSENT_KEY, "yes");
    setConsented(true);
  };

  if (consented === null) return <View style={{ flex: 1, backgroundColor: "#020617" }} />;
  if (!consented) return <ConsentScreen onAccept={acceptConsent} onDecline={() => Alert.alert("Third Eye needs your consent before it can upload a clip for analysis.")} />;

  if (route === "result" && (scan.phase === "done" || historyJob)) {
    const job = scan.phase === "done" ? scan.job : historyJob!;
    return <ResultScreen job={job} onDone={() => { setHistoryJob(null); reset(); setRoute("home"); }} onNewScan={() => { setHistoryJob(null); reset(); setRoute("home"); }} />;
  }

  if (route === "history") {
    return (
      <HistoryScreen
        entries={history}
        onOpen={(entry) => {
          setHistoryJob({ id: entry.id, status: "done", progress: 100, progressLabel: "Done", result: entry.result, createdAt: entry.createdAt, source: entry.source });
          setRoute("result");
        }}
        onDelete={async (id) => { await deleteHistoryEntry(id); setHistory(await loadHistory()); }}
        onClear={async () => { await clearHistory(); setHistory([]); }}
        onBack={() => setRoute("home")}
      />
    );
  }

  return (
    <HomeScreen
      scan={scan}
      remaining={remaining}
      isPro={isPro}
      onPickFile={(input) => void startScan(input)}
      onShowHistory={async () => { setHistory(await loadHistory()); setRoute("history"); }}
      onUpgrade={() => Alert.alert("Go Pro", "Pro checkout is wired through RevenueCat (entitlement: pro). Configure your RevenueCat API key and offering, then replace this alert with Purchases.purchasePackage().")}
    />
  );
}

export default function App() {
  useEffect(() => {
    // RevenueCat: configure once. Missing key = free tier only, never a crash.
    (async () => {
      try {
        const key = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
        if (!key) return;
        const Purchases = (await import("react-native-purchases")).default;
        await Purchases.configure({ apiKey: key });
      } catch {
        // Free tier continues.
      }
    })();
  }, []);

  return (
    <ShareIntentProvider>
      <Inner />
    </ShareIntentProvider>
  );
}
