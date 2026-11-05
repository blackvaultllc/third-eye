import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HistoryEntry } from "./types";

const KEY = "third-eye:history:v1";

/** Scan history lives on-device only. No account, no server history. */
export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const existing = await loadHistory();
  await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...existing].slice(0, 200)));
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const existing = await loadHistory();
  await AsyncStorage.setItem(KEY, JSON.stringify(existing.filter((e) => e.id !== id)));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
