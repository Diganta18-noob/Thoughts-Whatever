/** @jest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { useEditorRecovery } from "../use-editor-recovery";

const valid = (value: unknown): value is { body: string } => typeof (value as { body?: unknown })?.body === "string";
const original = { body: "Saved article" };
describe("local editor recovery", () => {
  beforeEach(() => { localStorage.clear(); jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

  it("recovers unsaved edits after unmount without overwriting them on initial mount", () => {
    const first = renderHook(({ value, dirty }) => useEditorRecovery("writer:piece1", value, dirty, valid), { initialProps: { value: original, dirty: false } });
    first.rerender({ value: { body: "Unsaved Bengali essay বাংলা" }, dirty: true });
    first.unmount(); // flush even before the debounce
    const second = renderHook(() => useEditorRecovery("writer:piece1", original, false, valid));
    expect(second.result.current.recovered?.value.body).toBe("Unsaved Bengali essay বাংলা");
    act(() => { jest.advanceTimersByTime(1000); });
    expect(JSON.parse(localStorage.getItem("writer:piece1")!).value.body).toBe("Unsaved Bengali essay বাংলা");
    act(() => { second.result.current.discard(); });
    expect(localStorage.getItem("writer:piece1")).toBeNull();
  });

  it("keeps recovery after a failed save and clears it only when explicitly committed", () => {
    const { result } = renderHook(() => useEditorRecovery("writer:piece1", { body: "Changed" }, true, valid));
    act(() => { jest.advanceTimersByTime(600); });
    expect(localStorage.getItem("writer:piece1")).not.toBeNull();
    act(() => { result.current.commit(); });
    expect(localStorage.getItem("writer:piece1")).toBeNull();
  });

  it("isolates accounts and pieces and rejects damaged drafts", () => {
    localStorage.setItem("writer:piece1", JSON.stringify({ version: 1, savedAt: Date.now(), value: { body: "Private" } }));
    const other = renderHook(() => useEditorRecovery("other:piece1", original, false, valid));
    expect(other.result.current.recovered).toBeNull();
    localStorage.setItem("writer:piece2", '{broken');
    const damaged = renderHook(() => useEditorRecovery("writer:piece2", original, false, valid));
    expect(damaged.result.current.recovered).toBeNull();
    expect(damaged.result.current.error).toBeTruthy();
  });

  it("reports storage failure without crashing editing", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    const { result } = renderHook(() => useEditorRecovery("writer:piece1", { body: "Changed" }, true, valid));
    act(() => { jest.advanceTimersByTime(600); });
    expect(result.current.error).toBeTruthy();
  });
});
