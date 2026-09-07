/**
 * Local (device-only) preference for which navigation app "Como chegar"
 * opens. Deliberately NOT synced to Supabase — it's a device preference,
 * not account data, so plain localStorage is enough and avoids an
 * unnecessary write path.
 */

export type NavApp = "google_maps" | "waze";

const STORAGE_KEY = "rotas_nav_app_preference";

export const NAV_APP_LABELS: Record<NavApp, string> = {
  google_maps: "Google Maps",
  waze: "Waze",
};

export function getSavedNavApp(): NavApp | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "google_maps" || saved === "waze" ? saved : null;
  } catch {
    return null;
  }
}

export function saveNavApp(app: NavApp): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, app);
  } catch {
    // Ignore storage failures (e.g. private browsing) — chooser will just
    // show again next time instead of persisting the choice.
  }
}

export function clearSavedNavApp(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

/**
 * Universal links only (no geo: / comgooglemaps:// custom schemes). These
 * open the native app automatically when installed, or the web version
 * otherwise, on every platform — no extra fallback handling needed.
 */
export function buildNavUrl(app: NavApp, lat: number, lng: number): string {
  if (app === "waze") {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function openNavigation(app: NavApp, lat: number, lng: number): void {
  const url = buildNavUrl(app, lat, lng);
  window.open(url, "_blank", "noopener,noreferrer");
}
