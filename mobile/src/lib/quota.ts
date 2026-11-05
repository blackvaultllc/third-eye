import AsyncStorage from "@react-native-async-storage/async-storage";

export const FREE_SCANS_PER_DAY = 3; // "N scans per day" — change this one constant.

const countKey = (day: string) => `third-eye:scans:${day}`;
const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Free tier is counted on-device (no account). A determined user can reset
 * it by reinstalling — that is accepted for a no-account app; server-side
 * enforcement belongs with a future account/Receipt system, not a silent
 * device fingerprint.
 */
export async function scansUsedToday(): Promise<number> {
  const raw = await AsyncStorage.getItem(countKey(todayKey()));
  return raw ? Number(raw) : 0;
}

export async function recordScanUsed(): Promise<void> {
  const used = await scansUsedToday();
  await AsyncStorage.setItem(countKey(todayKey()), String(used + 1));
}

export async function remainingFreeScans(): Promise<number> {
  return Math.max(0, FREE_SCANS_PER_DAY - (await scansUsedToday()));
}

/**
 * Paid tier via RevenueCat. Returns true when the customer holds the
 * "pro" entitlement. Configure the entitlement id in RevenueCat, and call
 * Purchases.configure() once at app start (see App.tsx) — never ship a
 * RevenueCat API key check that bypasses the store receipt.
 */
export async function hasProEntitlement(): Promise<boolean> {
  try {
    // Dynamic import so the free build still compiles if purchases is removed.
    const Purchases = (await import("react-native-purchases")).default;
    const info = await Purchases.getCustomerInfo();
    return Boolean(info.entitlements.active.pro);
  } catch {
    return false;
  }
}
