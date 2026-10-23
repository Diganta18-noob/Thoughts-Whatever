/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EMPTY_PIECE, PieceEditor } from "../piece-editor";

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));
jest.mock("@/components/providers/language-provider", () => ({ useTranslation: () => (key: string) => key }));
jest.mock("@/components/reader/prose", () => ({ Prose: () => null }));
jest.mock("../image-upload", () => ({ ImageUpload: () => null }));
jest.mock("../media-picker", () => ({ MediaPicker: () => null }));
jest.mock("../audio-transcribe", () => ({ AudioTranscribe: () => null }));

const initial = { ...EMPTY_PIECE, id: "piece1", titleBn: "Saved title", bodyBn: "Saved body", slug: "saved" };
const key = "tw:editor:v1:writer1:piece1";
const editor = () => <PieceEditor recoveryOwner="writer1" initial={initial} authors={[]} tags={[]} series={[]} />;

describe("piece editor recovery integration", () => {
  const originalFetch = global.fetch;
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

  it("does not let Ctrl+S erase a pending recovery copy", () => {
    localStorage.setItem(key, JSON.stringify({ version: 1, savedAt: Date.now(), value: { ...initial, bodyBn: "Pending recovery" } }));
    global.fetch = jest.fn();
    render(editor());
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(key)!).value.bodyBn).toBe("Pending recovery");
  });

  it("can recover a new piece after changing its kind", () => {
    const newEditor = () => <PieceEditor recoveryOwner="writer1" initial={EMPTY_PIECE} authors={[]} tags={[]} series={[]} />;
    const first = render(newEditor());
    fireEvent.click(screen.getByRole("button", { name: "ব্লগ" }));
    first.unmount();
    render(newEditor());
    expect(screen.getByRole("button", { name: "Restore writing" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore writing" }));
    expect(screen.getByRole("button", { name: "ব্লগ" })).toHaveAttribute("aria-pressed", "true");
  });

  it("requires explicit recovery, never publishes automatically, and removes the copy after saving", async () => {
    localStorage.setItem(key, JSON.stringify({ version: 1, savedAt: Date.now(), value: { ...initial, titleBn: "Recovered title", bodyBn: "Recovered body" } }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, id: "piece1" }) });
    render(editor());
    expect(screen.getByDisplayValue("Saved body")).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Restore writing" }));
    expect(screen.getByDisplayValue("Recovered body")).toBeEnabled();
    expect(global.fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "admin.editor.saveDraft" }));
    await waitFor(() => expect(localStorage.getItem(key)).toBeNull());
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/admin/pieces/piece1");
    expect(JSON.parse(options.body)).toMatchObject({ status: "DRAFT", bodyBn: "Recovered body" });
    expect(screen.getByRole("status")).toHaveTextContent("No unsaved changes");
  });

  it("keeps the recovery copy when the server rejects a save", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false, error: "Unavailable" }) });
    const { unmount } = render(editor());
    fireEvent.change(screen.getByDisplayValue("Saved body"), { target: { value: "Keep my writing" } });
    fireEvent.click(screen.getByRole("button", { name: "admin.editor.saveDraft" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "admin.editor.saveDraft" })).toBeEnabled());
    unmount();
    expect(JSON.parse(localStorage.getItem(key)!).value.bodyBn).toBe("Keep my writing");
  });

  it("warns before an unsaved editor is unloaded", async () => {
    render(editor());
    fireEvent.change(screen.getByDisplayValue("Saved body"), { target: { value: "Changed body" } });
    const event = new Event("beforeunload", { cancelable: true });
    act(() => { window.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
  });
});
