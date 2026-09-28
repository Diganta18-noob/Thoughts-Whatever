"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FileText, Music2, Video, X } from "lucide-react";

type Asset = { id: string; filename: string; mimeType: string; url: string; width?: number | null; height?: number | null };

export function MediaPicker({ type = "image", onSelect, onClose }: {
  type?: "image" | "audio" | "video" | "document";
  onSelect: (asset: Asset) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/media?type=${type}&limit=60&search=${encodeURIComponent(search)}`, { signal: controller.signal })
        .then((res) => res.json()).then((data) => setItems(data.ok ? data.items : []))
        .catch(() => { if (!controller.signal.aborted) setItems([]); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 150);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, type]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={`Choose ${type} from media library`} className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-card border border-rule bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-xl text-content">Choose from Media Library</h2><button type="button" onClick={onClose} aria-label="Close media picker" className="rounded-card p-2 text-content-soft hover:bg-surface-raised"><X className="h-4 w-4" /></button></div>
        <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assets…" className="mb-4 rounded-card border border-rule bg-surface-raised px-3 py-2 text-sm text-content" />
        <div className="grid min-h-28 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {loading ? <p className="col-span-full p-8 text-center text-sm text-content-soft">Loading assets…</p> : items.length === 0 ? <p className="col-span-full p-8 text-center text-sm text-content-soft">No matching assets.</p> : items.map((asset) => (
            <button key={asset.id} type="button" onClick={() => { onSelect(asset); onClose(); }} className="overflow-hidden rounded-card border border-rule bg-surface-raised text-left transition hover:border-accent focus-visible:border-accent">
              <span className="relative flex aspect-square items-center justify-center bg-surface">
                {asset.mimeType.startsWith("image/") ? <Image src={asset.url} alt={asset.filename} fill sizes="180px" className="object-cover" unoptimized /> : asset.mimeType.startsWith("audio/") ? <Music2 className="h-8 w-8 text-accent" /> : asset.mimeType.startsWith("video/") ? <Video className="h-8 w-8 text-accent" /> : <FileText className="h-8 w-8 text-accent" />}
              </span>
              <span className="block truncate p-2 text-xs text-content" title={asset.filename}>{asset.filename}</span>
            </button>
          ))}
        </div>
      </div>
    </div>, document.body
  );
}
