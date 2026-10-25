/** @jest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { useAdminPolling } from "../use-admin-polling";

describe("admin polling", () => {
  let visibility = "visible";
  beforeEach(() => {
    jest.useFakeTimers();
    visibility = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  });
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

  it("skips hidden ticks and resumes without a burst", async () => {
    let calls = 0;
    const { unmount } = renderHook(() => useAdminPolling(async () => { calls++; }, 60000));
    await act(async () => { jest.advanceTimersByTime(60000); });
    expect(calls).toBe(1);
    visibility = "hidden";
    await act(async () => { jest.advanceTimersByTime(180000); });
    expect(calls).toBe(1);
    visibility = "visible";
    await act(async () => { jest.advanceTimersByTime(60000); });
    expect(calls).toBe(2);
    unmount();
    await act(async () => { jest.advanceTimersByTime(60000); });
    expect(calls).toBe(2);
  });

  it("does not overlap slow requests or restart its timer on rerender", async () => {
    let calls = 0;
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    const { rerender } = renderHook(() => useAdminPolling(async () => { calls++; await pending; }, 1000));
    await act(async () => { jest.advanceTimersByTime(1000); });
    rerender();
    await act(async () => { jest.advanceTimersByTime(3000); });
    expect(calls).toBe(1);
    await act(async () => { finish(); });
    await act(async () => { jest.advanceTimersByTime(1000); });
    expect(calls).toBe(2);
  });

  it("respects opt-out and offline state", async () => {
    let calls = 0;
    const { rerender } = renderHook(({ enabled }) => useAdminPolling(async () => { calls++; }, 1000, enabled), { initialProps: { enabled: false } });
    await act(async () => { jest.advanceTimersByTime(1000); });
    expect(calls).toBe(0);
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    rerender({ enabled: true });
    await act(async () => { jest.advanceTimersByTime(1000); });
    expect(calls).toBe(0);
  });
});
