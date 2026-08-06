"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, X, ExternalLink, Mic } from "lucide-react";
import { Prose } from "@/components/reader/prose";
import { bengaliSlug, countBengaliWords, readingMinutes, toBengaliNumber } from "@/lib/bengali";
import { deriveExcerpt } from "@/lib/markdown";
import { KIND_META, piecePath, type PieceKindKey } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";
import { ImageUpload } from "@/components/admin/image-upload";
import { AudioTranscribe } from "@/components/admin/audio-transcribe";
import { PieceSourcesEditor } from "./piece-editor/piece-sources-editor";
import { PieceTimelineEditor } from "./piece-editor/piece-timeline-editor";


/**
 * The editor.
 *
 * One screen, no modals, no autosave. Autosave and a publish workflow are the
 * same feature in most CMSes and it is a bad pairing for one person writing
 * essays: an accidental keystroke should never touch the live site. So the
 * publisher presses Save, and Save is the only thing that writes.
 *
 * The preview is the real reading component — `Prose` — not a lookalike. Bengali
 * conjuncts, verse blocks, and drop caps are exactly where the typography can
 * go wrong, so the preview has to be the same code that renders the page.
 */

export type EditorOption = { id: string; labelBn: string; labelEn?: string | null };
export type EditorTag = EditorOption & { kind: "FORM" | "THEME" | "ERA" | "TOPIC" };

export type EditorSource = { label: string; url: string; note: string };
export type EditorTimeline = { year: string; labelBn: string; descBn: string };

export type EditorPiece = {
  id: string;
  kind: PieceKindKey;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  slug: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  dekBn: string;
  bodyBn: string;
  excerptBn: string;
  coverImage: string;
  coverImageWidth?: number | null;
  coverImageHeight?: number | null;
  reelUrl: string;
  videoUrl: string;
  audioUrl: string;
  audioSec: string;
  featured: boolean;
  seoDescription: string;
  ogImage: string;
  publishedAt: string; // value for <input type="datetime-local">
  seriesId: string;
  seriesOrder: string;
  authorIds: string[];
  tagIds: string[];
  sources: EditorSource[];
  timeline: EditorTimeline[];
};

export const EMPTY_PIECE: EditorPiece = {
  id: "",
  kind: "RACHANA",
  status: "DRAFT",
  slug: "",
  titleBn: "",
  titleEn: "",
  subtitleBn: "",
  dekBn: "",
  bodyBn: "",
  excerptBn: "",
  coverImage: "",
  reelUrl: "",
  videoUrl: "",
  audioUrl: "",
  audioSec: "",
  featured: false,
  seoDescription: "",
  ogImage: "",
  publishedAt: "",
  seriesId: "",
  seriesOrder: "",
  authorIds: [],
  tagIds: [],
  sources: [],
  timeline: [],
};

const TAG_GROUPS: { kind: EditorTag["kind"]; labelEn: string; labelBn: string }[] = [
  { kind: "FORM", labelEn: "Form", labelBn: "রূপ" },
  { kind: "THEME", labelEn: "Theme", labelBn: "বিষয়" },
  { kind: "ERA", labelEn: "Era", labelBn: "কাল" },
  { kind: "TOPIC", labelEn: "Topic", labelBn: "অন্যান্য" },
];

/**
 * `<input type="datetime-local">` holds local wall-clock time with no zone, so
 * the conversion has to happen in the browser — done on the server it would
 * render in the server's zone, which is UTC on every host worth using and an
 * hour or five off from the person actually typing.
 *
 * Which is why this runs in a mount effect rather than during render: the field
 * starts empty on both sides, so there is nothing to mismatch on hydration.
 */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ─── small building blocks ─────────────────────────────── */

function Field({
  labelEn,
  hintBn,
  error,
  children,
}: {
  labelEn: string;
  hintBn?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="label" lang="en">
        {labelEn}
      </span>
      <div className="mt-1.5">{children}</div>
      {hintBn && !error && (
        <p className="mt-1 font-bengali text-xs text-content-faint" lang="bn">
          {hintBn}
        </p>
      )}
      {error && (
        <p className="mt-1 font-bengali text-xs text-accent" lang="bn">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-sm border border-rule bg-surface px-3 py-2 font-bengali text-[0.9375rem] text-content outline-none transition-colors placeholder:text-content-faint focus:border-accent";
const monoInputClass =
  "w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-[0.8125rem] text-content outline-none transition-colors placeholder:text-content-faint focus:border-accent";

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-sm border px-2.5 py-1 font-bengali text-[0.875rem] transition",
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-rule text-content-soft hover:text-content",
      )}
    >
      {children}
    </button>
  );
}

function Panel({
  labelEn,
  children,
}: {
  labelEn: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-rule p-4">
      <h2 className="label" lang="en">
        {labelEn}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/* ─── the editor ────────────────────────────────────────── */

export function PieceEditor({
  initial,
  publishedAtIso,
  authors,
  tags,
  series,
}: {
  initial: EditorPiece;
  publishedAtIso?: string | null;
  authors: (EditorOption & { era?: string | null })[];
  tags: EditorTag[];
  series: EditorOption[];
}) {
  const router = useRouter();
  const t = useTranslation();
  const isNew = !initial?.id;
  const safeInitial: EditorPiece = useMemo(() => ({
    ...EMPTY_PIECE,
    ...(initial || {}),
    slug: initial?.slug ?? "",
    titleBn: initial?.titleBn ?? "",
    titleEn: initial?.titleEn ?? "",
    subtitleBn: initial?.subtitleBn ?? "",
    dekBn: initial?.dekBn ?? "",
    bodyBn: initial?.bodyBn ?? "",
    excerptBn: initial?.excerptBn ?? "",
    coverImage: initial?.coverImage ?? "",
    coverImageWidth: (initial as any)?.coverImageWidth ?? null,
    coverImageHeight: (initial as any)?.coverImageHeight ?? null,
    reelUrl: initial?.reelUrl ?? "",
    videoUrl: initial?.videoUrl ?? "",
    audioUrl: initial?.audioUrl ?? "",
    audioSec: initial?.audioSec ?? "",
    seoDescription: initial?.seoDescription ?? "",
    ogImage: initial?.ogImage ?? "",
    publishedAt: initial?.publishedAt ?? "",
    seriesId: initial?.seriesId ?? "",
    seriesOrder: initial?.seriesOrder ?? "",
    authorIds: initial?.authorIds ?? [],
    tagIds: initial?.tagIds ?? [],
    sources: initial?.sources ?? [],
    timeline: initial?.timeline ?? [],
  }), [initial]);

  const [form, setForm] = useState<EditorPiece>(safeInitial);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showTranscriber, setShowTranscriber] = useState(false);

  const handleTranscriptionComplete = (text: string, audioUrl?: string) => {
    setForm((prev) => ({
      ...prev,
      bodyBn: prev.bodyBn ? `${prev.bodyBn}\n\n${text}` : text,
      audioUrl: audioUrl || prev.audioUrl,
    }));
    setDirty(true);
    setNotice("Audio transcribed successfully via Whisper API! Transcribed text appended to Body.");
  };

  // The slug follows the title only until the publisher edits it, and never on
  // an existing piece — a live URL must not change because a typo was fixed.
  const slugTouched = useRef(!isNew || !!initial.slug);

  function set<K extends keyof EditorPiece>(key: K, value: EditorPiece[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setNotice("");
  }

  function setTitle(value: string) {
    setForm((prev) => ({
      ...prev,
      titleBn: value,
      slug: slugTouched.current ? prev.slug : bengaliSlug(value),
    }));
    setDirty(true);
    setNotice("");
  }

  function toggleIn(key: "authorIds" | "tagIds", id: string) {
    setForm((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
      };
    });
    setDirty(true);
  }

  // Fill the date field once, in the browser's zone, without marking the form
  // dirty — showing "unsaved changes" on a page nobody has typed into yet
  // teaches the publisher to ignore the warning.
  useEffect(() => {
    if (!publishedAtIso) return;
    const local = toLocalInputValue(publishedAtIso);
    setForm((prev) => (prev.publishedAt ? prev : { ...prev, publishedAt: local }));
  }, [publishedAtIso]);

  const words = useMemo(() => countBengaliWords(form.bodyBn), [form.bodyBn]);  const minutes = useMemo(() => readingMinutes(form.bodyBn), [form.bodyBn]);
  const autoExcerpt = useMemo(() => deriveExcerpt(form.bodyBn), [form.bodyBn]);

  // Leaving with unsaved work is the one loss this editor can actually cause.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(overrideStatus?: EditorPiece["status"]) {
    if (busy) return;
    setBusy(true);
    setErrors({});
    setNotice("");

    const status = overrideStatus ?? form.status;

    const payload = {
      kind: form.kind,
      status,
      slug: (form.slug || "").trim(),
      titleBn: form.titleBn,
      titleEn: form.titleEn,
      subtitleBn: form.subtitleBn,
      dekBn: form.dekBn,
      bodyBn: form.bodyBn,
      excerptBn: form.excerptBn,
      coverImage: form.coverImage,
      coverImageWidth: form.coverImageWidth,
      coverImageHeight: form.coverImageHeight,
      reelUrl: form.reelUrl,
      videoUrl: form.videoUrl,
      audioUrl: form.audioUrl,
      audioSec: form.audioSec === "" ? null : form.audioSec,
      featured: form.featured,
      seoDescription: form.seoDescription,
      ogImage: form.ogImage,
      // The date input gives local wall-clock time; send an instant so the
      // server does not reinterpret it in whatever zone it happens to run in.
      publishedAt: form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : "",
      authorIds: form.authorIds,
      tagIds: form.tagIds,
      seriesId: form.seriesId,
      seriesOrder: form.seriesId && form.seriesOrder ? form.seriesOrder : null,
      sources: (form.sources || []).filter((s) => s?.label?.trim()),
      timeline: (form.timeline || []).filter((t) => t?.year?.trim() && t?.labelBn?.trim()),
    };

    try {
      const res = await fetch(
        isNew ? "/api/admin/pieces" : `/api/admin/pieces/${form.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        id?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!res.ok || !data.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setNotice(data.error || t("admin.editor.saveError"));
        setBusy(false);
        return;
      }

      setDirty(false);
      setForm((prev) => ({ ...prev, status }));
      setNotice(
        status === "PUBLISHED" ? t("admin.editor.published") : t("admin.editor.saved"),
      );

      if (isNew && data.id) {
        router.replace(`/admin/pieces/${data.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setNotice(t("admin.editor.connectionError"));
    }
    setBusy(false);
  }

  // ⌘S / Ctrl+S saves, because the muscle memory exists and the browser's own
  // Save Page dialog is never what was wanted here.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, busy]);

  const isDocumentary = form.kind === "DOCUMENTARY";

  return (
    <div>
      {/* ─── header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="label" lang="en">
            {isNew ? "New piece" : `Editing · ${KIND_META[form.kind].labelEn}`}
          </span>
          <h1
            className="mt-2 text-[1.5rem] font-medium text-content"
          >
            {form.titleBn || t("admin.editor.untitled")}
          </h1>
          <p className="mt-1 font-mono text-[0.6875rem] text-content-faint">
            {t("admin.editor.words", { count: words })} · {t("admin.editor.readTime", { count: minutes })}
            {form.status === "PUBLISHED" && form.slug && (
              <>
                {" · "}
                <Link
                  href={piecePath(form.kind, form.slug)}
                  target="_blank"
                  className="inline-flex items-center gap-1 transition hover:text-accent"
                >
                  live <ExternalLink className="h-3 w-3" />
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="rounded-sm border border-rule px-3 py-2 font-serif text-sm text-content-soft transition hover:text-content"
            lang="en"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>

          <button
            type="button"
            onClick={() => void save("DRAFT")}
            disabled={busy}
            className="rounded-sm border border-rule px-3 py-2 text-[0.9375rem] text-content-soft transition hover:text-content disabled:opacity-50"
          >
            {t("admin.editor.saveDraft2")}
          </button>

          <button
            type="button"
            onClick={() => void save("PUBLISHED")}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-[0.9375rem] text-surface transition hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {form.status === "PUBLISHED" ? t("admin.editor.update") : t("admin.editor.publishBtn")}
          </button>
        </div>
      </div>

      {notice && (
        <p
          className="mt-4 border-l-2 border-accent pl-3 font-bengali text-[0.9375rem] text-accent"
          lang="bn"
        >
          {notice}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ─── main column ──────────────────────────────── */}
        <div className="space-y-6">
          <Field labelEn="Title (Bengali)" error={errors.titleBn}>
            <input
              value={form.titleBn}
              onChange={(e) => setTitle(e.target.value)}
              lang="bn"
              className={cn(inputClass, "text-[1.125rem]")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              labelEn="Slug"
              hintBn={t("admin.editor.slugHint")}
              error={errors.slug}
            >
              <input
                value={form.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  set("slug", e.target.value.trim());
                }}
                className={monoInputClass}
              />
            </Field>

            <Field labelEn="Title (English, optional)" error={errors.titleEn}>
              <input
                value={form.titleEn}
                onChange={(e) => set("titleEn", e.target.value)}
                lang="en"
                className={inputClass}
              />
            </Field>
          </div>

          <Field labelEn="Subtitle" error={errors.subtitleBn}>
            <input
              value={form.subtitleBn}
              onChange={(e) => set("subtitleBn", e.target.value)}
              lang="bn"
              className={inputClass}
            />
          </Field>

          <Field
            labelEn="Standfirst"
            hintBn={t("admin.editor.standfirstHint")}
            error={errors.dekBn}
          >
            <textarea
              value={form.dekBn}
              onChange={(e) => set("dekBn", e.target.value)}
              rows={2}
              lang="bn"
              className={cn(inputClass, "resize-y leading-relaxed")}
            />
          </Field>

          <Field
            labelEn="Body (Markdown)"
            hintBn={t("admin.editor.bodyHint")}
            error={errors.bodyBn}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-content-faint">
                Supports mixed Bengali-English Markdown content
              </span>
              <button
                type="button"
                onClick={() => setShowTranscriber(!showTranscriber)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/20"
              >
                <Mic className="h-3.5 w-3.5" />
                {showTranscriber ? "Hide Transcriber" : "🎙️ Transcribe Audio Narration / Reel"}
              </button>
            </div>

            {showTranscriber && (
              <div className="mb-4">
                <AudioTranscribe
                  onTranscriptionComplete={handleTranscriptionComplete}
                  storeAudio={true}
                />
              </div>
            )}
            <textarea
              value={form.bodyBn}
              onChange={(e) => set("bodyBn", e.target.value)}
              rows={26}
              lang="bn"
              spellCheck={false}
              className={cn(
                inputClass,
                "resize-y font-bengali text-bengali-base leading-[1.9]",
              )}
            />
          </Field>

          {showPreview && (form.bodyBn || "").trim() && (
            <div>
              <span className="label" lang="en">
                Preview
              </span>
              <div className="mt-3 border border-rule p-5 sm:p-7">
                <Prose body={form.bodyBn} dropCap />
              </div>
            </div>
          )}

          {/* ─── sources ────────────────────────────────── */}
          <Panel labelEn={isDocumentary ? t("admin.editor.sourcesDocumentary") : t("admin.editor.sourcesOptional")}>
            {!isDocumentary && (
              <p className="text-xs text-content-faint">
                {t("admin.editor.sourcesHint")}
              </p>
            )}
            <PieceSourcesEditor
              sources={form.sources}
              onChange={(next) => set("sources", next)}
              monoInputClass={monoInputClass}
              inputClass={inputClass}
              t={t}
            />
          </Panel>

          {/* ─── timeline ───────────────────────────────── */}
          <Panel labelEn={t("admin.editor.timeline")}>
            <p className="text-xs text-content-faint">
              {t("admin.editor.timelineHint")}
            </p>
            <PieceTimelineEditor
              timeline={form.timeline}
              onChange={(next) => set("timeline", next)}
              inputClass={inputClass}
              t={t}
            />
          </Panel>
        </div>


        {/* ─── sidebar ──────────────────────────────────── */}
        <div className="space-y-6">
          <Panel labelEn="Publishing">
            <Field labelEn="Kind">
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(KIND_META) as PieceKindKey[]).map((kind) => (
                  <Toggle
                    key={kind}
                    active={form.kind === kind}
                    onClick={() => set("kind", kind)}
                  >
                    {KIND_META[kind].labelBn}
                  </Toggle>
                ))}
              </div>
            </Field>

            <Field labelEn="Status">
              <div className="flex flex-wrap gap-1.5">
                {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((status) => (
                  <Toggle
                    key={status}
                    active={form.status === status}
                    onClick={() => set("status", status)}
                  >
                    {status === "DRAFT"
                      ? t("admin.editor.statusDraft")
                      : status === "PUBLISHED"
                        ? t("admin.editor.statusPublished")
                        : t("admin.editor.statusArchived")}
                  </Toggle>
                ))}
              </div>
            </Field>

            <Field
              labelEn="Publish date"
              hintBn={t("admin.editor.publishDateHint")}
            >
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => set("publishedAt", e.target.value)}
                className={monoInputClass}
              />
            </Field>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="text-[0.9375rem] text-content-soft">
                {t("admin.editor.featureOnHome")}
              </span>
            </label>
          </Panel>

          <Panel labelEn="Media">
            <Field
              labelEn="Reel URL"
              hintBn={t("admin.editor.reelUrlHint")}
              error={errors.reelUrl}
            >
              <input
                value={form.reelUrl}
                onChange={(e) => set("reelUrl", e.target.value)}
                placeholder="https://www.instagram.com/reel/…"
                className={monoInputClass}
              />
            </Field>

            <Field labelEn="Video URL" error={errors.videoUrl}>
              <input
                value={form.videoUrl}
                onChange={(e) => set("videoUrl", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className={monoInputClass}
              />
            </Field>

            <ImageUpload
              value={form.coverImage}
              onChange={(url, meta) => {
                set("coverImage", url);
                if (meta?.width) set("coverImageWidth", meta.width);
                if (meta?.height) set("coverImageHeight", meta.height);
              }}
              label="Cover Image"
              folder="covers"
            />

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_90px]">
              <Field
                labelEn="Narration (audio)"
                hintBn={t("admin.editor.narrationHint")}
                error={errors.audioUrl}
              >
                <input
                  value={form.audioUrl}
                  onChange={(e) => set("audioUrl", e.target.value)}
                  placeholder="/audio/….mp3"
                  className={monoInputClass}
                />
              </Field>
              <Field labelEn="Seconds" error={errors.audioSec}>
                <input
                  value={form.audioSec}
                  onChange={(e) => set("audioSec", e.target.value)}
                  inputMode="numeric"
                  className={monoInputClass}
                />
              </Field>
            </div>
          </Panel>

          <Panel labelEn={t("admin.editor.aboutWhom")}>
            {authors.length === 0 ? (
              <p className="text-xs text-content-faint">
                {t("admin.editor.noAuthorsYet")}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {authors.map((author) => (
                  <Toggle
                    key={author.id}
                    active={form.authorIds.includes(author.id)}
                    onClick={() => toggleIn("authorIds", author.id)}
                  >
                    {author.labelBn}
                  </Toggle>
                ))}
              </div>
            )}
          </Panel>

          <Panel labelEn="Tags">
            {TAG_GROUPS.map((group) => {
              const groupTags = tags.filter((tag) => tag.kind === group.kind);
              if (groupTags.length === 0) return null;
              return (
                <div key={group.kind}>
                  <span className="font-mono text-[0.625rem] uppercase tracking-wider text-content-faint">
                    {group.labelEn}
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {groupTags.map((tag) => (
                      <Toggle
                        key={tag.id}
                        active={form.tagIds.includes(tag.id)}
                        onClick={() => toggleIn("tagIds", tag.id)}
                      >
                        {tag.labelBn}
                      </Toggle>
                    ))}
                  </div>
                </div>
              );
            })}
            {tags.length === 0 && (
              <p className="text-xs text-content-faint">
                {t("admin.editor.noTagsYet")}
              </p>
            )}
          </Panel>

          <Panel labelEn={t("admin.editor.series")}>
            <Field labelEn="Series">
              <select
                value={form.seriesId}
                onChange={(e) => set("seriesId", e.target.value)}
                className={inputClass}
                lang="bn"
              >
                <option value="">{t("admin.editor.noSeries")}</option>
                {series.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.labelBn}
                  </option>
                ))}
              </select>
            </Field>

            {form.seriesId && (
              <Field
                labelEn="Order"
                hintBn={t("admin.editor.orderHint")}
                error={errors.seriesOrder}
              >
                <input
                  value={form.seriesOrder}
                  onChange={(e) => set("seriesOrder", e.target.value)}
                  inputMode="numeric"
                  className={monoInputClass}
                />
              </Field>
            )}
          </Panel>

          <Panel labelEn="Excerpt & SEO">
            <Field
              labelEn="Excerpt"
              hintBn={t("admin.editor.excerptHint")}
              error={errors.excerptBn}
            >
              <textarea
                value={form.excerptBn}
                onChange={(e) => set("excerptBn", e.target.value)}
                rows={3}
                placeholder={autoExcerpt}
                lang="bn"
                className={cn(inputClass, "resize-y")}
              />
            </Field>

            <Field labelEn="Meta description" error={errors.seoDescription}>
              <textarea
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                rows={2}
                lang="bn"
                className={cn(inputClass, "resize-y")}
              />
            </Field>

            <Field labelEn="OG image" error={errors.ogImage}>
              <input
                value={form.ogImage}
                onChange={(e) => set("ogImage", e.target.value)}
                placeholder="/og/….jpg"
                className={monoInputClass}
              />
            </Field>
          </Panel>

          {dirty && (
            <p className="text-xs text-accent">
              {t("admin.editor.unsavedChanges")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
