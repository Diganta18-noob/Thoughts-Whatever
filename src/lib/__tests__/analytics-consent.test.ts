/** @jest-environment jsdom */
import { analyticsAllowed, saveConsent, readConsent } from "@/lib/analytics-consent";
import { trackEvent } from "@/lib/tracker";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = "tw_consent=; Max-Age=0; Path=/";
  Object.defineProperty(navigator, "doNotTrack", { value: "0", configurable: true });
  Object.defineProperty(navigator, "sendBeacon", { value: jest.fn(), configurable: true });
});

it("sends no analytics or session identifier before consent", () => {
  trackEvent({ eventType: "view" });
  expect(navigator.sendBeacon).not.toHaveBeenCalled();
  expect(sessionStorage.getItem("tw_analytics_session")).toBeNull();
});

it("allows explicit acceptance and stops immediately after withdrawal", () => {
  saveConsent("accepted");
  expect(readConsent()).toBe("accepted");
  trackEvent({ eventType: "view" });
  expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  saveConsent("rejected");
  trackEvent({ eventType: "view" });
  expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem("tw_analytics_session")).toBeNull();
});

it("honours Do Not Track even after acceptance", () => {
  saveConsent("accepted");
  Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });
  expect(analyticsAllowed()).toBe(false);
});

it("fails closed when browser storage is unavailable", () => {
  const get = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  expect(analyticsAllowed()).toBe(false);
  get.mockRestore();
});
