import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { withTimeout } from "@/lib/utils";

const FALLBACK = ["fallback"];

let errors: unknown[][];
let spy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  errors = [];
  spy = jest
    .spyOn(console, "error")
    .mockImplementation((...args: unknown[]) => void errors.push(args));
});

afterEach(() => {
  spy.mockRestore();
});

describe("withTimeout", () => {
  it("passes a resolved value straight through and logs nothing", async () => {
    await expect(withTimeout(Promise.resolve(["real"]), FALLBACK, 50, "ok")).resolves.toEqual([
      "real",
    ]);
    expect(errors).toEqual([]);
  });

  /**
   * The guarantee this suite exists for. `withTimeout` resolves with its
   * fallback instead of rejecting, so a caller wrapping it in
   * `Promise.allSettled` can never observe the failure — the home page shipped
   * a `status === "rejected"` branch that was dead code, which meant a throwing
   * query degraded the page in total silence. A silent empty fallback is what
   * hid a 9 MB query for weeks, so the log has to happen in here.
   */
  it("logs the error when the promise rejects, then serves the fallback", async () => {
    const boom = new Error("connection pool exhausted");

    await expect(withTimeout(Promise.reject(boom), FALLBACK, 50, "getRecentPieces")).resolves.toBe(
      FALLBACK,
    );

    expect(errors).toHaveLength(1);
    expect(String(errors[0]![0])).toContain("getRecentPieces");
    expect(String(errors[0]![0])).toContain("failed");
    // The error object itself is passed through, so the stack survives.
    expect(errors[0]![1]).toBe(boom);
  });

  it("logs the elapsed budget when the promise is too slow, then serves the fallback", async () => {
    // The handle is cleared below: leaving it pending would hold jest's event
    // loop open past the run, which is the very leak the timer test guards.
    let slowTimer: ReturnType<typeof setTimeout>;
    const slow = new Promise<string[]>((resolve) => {
      slowTimer = setTimeout(() => resolve(["late"]), 5000);
    });

    try {
      await expect(withTimeout(slow, FALLBACK, 20, "getFeaturedSeries")).resolves.toBe(FALLBACK);

      expect(errors).toHaveLength(1);
      expect(String(errors[0]![0])).toContain("getFeaturedSeries");
      expect(String(errors[0]![0])).toContain("20ms");
    } finally {
      clearTimeout(slowTimer!);
    }
  });

  it("names the query even when a caller passes no label", async () => {
    await withTimeout(Promise.reject(new Error("x")), FALLBACK, 50);
    expect(String(errors[0]![0])).toContain("query");
  });

  /**
   * An uncleared timer keeps the event loop alive for the rest of the budget
   * after the response has already been sent — on a serverless function that is
   * billed wall-clock time. Asserting on jest's own timer count is the only way
   * to see the timer from outside.
   */
  it("clears its timer once the promise settles", async () => {
    jest.useFakeTimers();
    try {
      await withTimeout(Promise.resolve(["real"]), FALLBACK, 30_000, "fast");
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("clears its timer when the promise rejects", async () => {
    jest.useFakeTimers();
    try {
      await withTimeout(Promise.reject(new Error("x")), FALLBACK, 30_000, "failing");
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
