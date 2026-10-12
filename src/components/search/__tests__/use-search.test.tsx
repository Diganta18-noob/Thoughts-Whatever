/** @jest-environment jsdom */
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSearchIndex } from "../use-search";

describe("search index recovery", () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

  it("reports a failed request and allows a successful retry", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    const { result } = renderHook(() => useSearchIndex({ eager: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toHaveProperty("error", true);
    expect(result.current.docs).toBeNull();
    await act(async () => { await result.current.load(); });
    expect(result.current).toHaveProperty("error", false);
    expect(result.current.docs).toEqual([]);
  });

  it.each(["network", "invalid payload"])("reports %s failures without caching an empty index", async (failure) => {
    global.fetch = failure === "network"
      ? jest.fn().mockRejectedValue(new Error("Offline"))
      : jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: "Unavailable" }) });
    const { result } = renderHook(() => useSearchIndex({ eager: true }));
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.docs).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
