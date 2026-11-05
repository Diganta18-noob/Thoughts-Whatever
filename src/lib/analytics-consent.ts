export const CONSENT_EVENT = "tw:consent-changed";
export type Consent = "accepted" | "rejected";
const KEY = "tw_consent";

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch { return null; }
}

export function analyticsAllowed(): boolean {
  return typeof navigator !== "undefined" && navigator.doNotTrack !== "1"
    && !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
    && readConsent() === "accepted";
}

export function saveConsent(value: Consent) {
  try {
    localStorage.setItem(KEY, value);
    document.cookie = `${KEY}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    if (value === "rejected") sessionStorage.removeItem("tw_analytics_session");
  } catch { /* Storage unavailable: analytics remains disabled. */ }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
