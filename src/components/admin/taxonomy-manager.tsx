"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { bengaliSlug, toBengaliNumber } from "@/lib/bengali";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";

/**
 * One editor for authors, tags, and series.
 *
 * These three are the same shape of thing — a slug, a Bengali label, a couple of
 * optional fields — and giving each its own page would triple the code for no
 * gain. Each list declares its fields; this handles the rest.
 */

export type TaxonomyField = {
  key: string;
  labelEn: string;
  type?: "text" | "textarea" | "select";
  options?: { value: string; label: string }[];
  placeholderBn?: string;
  mono?: boolean;
  /** The Bengali label the slug is derived from on a new row. */
  primary?: boolean;
};

export type TaxonomyRow = {
  id: string;
  slug: string;
  count: number;
  values: Record<string, string>;
};

const inputClass =
  "w-full rounded-sm border border-rule bg-surface px-3 py-2 font-bengali text-[0.9375rem] text-content outline-none transition-colors placeholder:text-content-faint focus:border-accent";
const monoInputClass =
  "w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-[0.8125rem] text-content outline-none transition-colors placeholder:text-content-faint focus:border-accent";

function emptyValues(fields: TaxonomyField[]): Record<string, string> {
  const out: Record<string, string> = { slug: "" };
  for (const field of fields) {
    out[field.key] = field.type === "select" ? (field.options?.[0]?.value ?? "") : "";
  }
  return out;
}

export function TaxonomyManager({
  titleEn,
  titleBn,
  hintBn,
  endpoint,
  fields,
  rows,
  addLabelBn,
  countNounBn,
}: {
  titleEn: string;
  titleBn: string;
  hintBn?: string;
  /** e.g. "/api/admin/authors" */
  endpoint: string;
  fields: TaxonomyField[];
  rows: TaxonomyRow[];
  addLabelBn: string;
  countNounBn: string;
}) {
  const router = useRouter();
  const t = useTranslation();
  const [editing, setEditing] = useState<string | null>(null); // row id, or "new"
  const [draft, setDraft] = useState<Record<string, string>>(emptyValues(fields));
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Every list declares at least one field, so the "" tail is unreachable —
  // it is there so this can be used as an index without a non-null assertion.
  const primaryKey = fields.find((f) => f.primary)?.key ?? fields[0]?.key ?? "";

  function startNew() {
    setEditing("new");
    setDraft(emptyValues(fields));
    setSlugTouched(false);
    setError("");
  }

  function startEdit(row: TaxonomyRow) {
    setEditing(row.id);
    setDraft({ ...row.values, slug: row.slug });
    setSlugTouched(true);
    setError("");
  }

  function cancel() {
    setEditing(null);
    setError("");
  }

  function setField(key: string, value: string) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === primaryKey && !slugTouched) next.slug = bengaliSlug(value);
      return next;
    });
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");

    const isNew = editing === "new";
    const res = await fetch(isNew ? endpoint : `${endpoint}/${editing}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
    };

    if (!res.ok || !data.ok) {
      setError(
        data.error ||
          Object.values(data.fieldErrors ?? {})[0] ||
          t("admin.taxonomy.saveFailed"),
      );
      setBusy(false);
      return;
    }

    setEditing(null);
    setBusy(false);
    router.refresh();
  }

  async function remove(row: TaxonomyRow) {
    if (!window.confirm(t("admin.taxonomy.confirmDelete", { name: row.values[primaryKey] ?? row.slug })))
      return;

    const res = await fetch(`${endpoint}/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error || t("admin.taxonomy.deleteFailed"));
      return;
    }
    router.refresh();
  }

  const form = (
    <div className="space-y-3 border border-accent/40 bg-accent/5 p-4">
      {fields.map((field) => (
        <div key={field.key}>
          <span className="label" lang="en">
            {field.labelEn}
          </span>
          <div className="mt-1.5">
            {field.type === "textarea" ? (
              <textarea
                value={draft[field.key] ?? ""}
                onChange={(e) => setField(field.key, e.target.value)}
                rows={3}
                placeholder={field.placeholderBn}
                lang="bn"
                className={cn(inputClass, "resize-y")}
              />
            ) : field.type === "select" ? (
              <select
                value={draft[field.key] ?? ""}
                onChange={(e) => setField(field.key, e.target.value)}
                className={inputClass}
                lang="bn"
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={draft[field.key] ?? ""}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.placeholderBn}
                lang={field.mono ? undefined : "bn"}
                className={field.mono ? monoInputClass : inputClass}
              />
            )}
          </div>
        </div>
      ))}

      <div>
        <span className="label" lang="en">
          Slug
        </span>
        <input
          value={draft.slug ?? ""}
          onChange={(e) => {
            setSlugTouched(true);
            setDraft((prev) => ({ ...prev, slug: e.target.value.trim() }));
          }}
          className={cn(monoInputClass, "mt-1.5")}
        />
      </div>

      {error && (
        <p className="font-bengali text-xs text-accent" lang="bn">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-3.5 py-1.5 font-bengali text-[0.9375rem] text-surface transition hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t("common.save")}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-sm border border-rule px-3.5 py-1.5 font-bengali text-[0.9375rem] text-content-soft transition hover:text-content"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="label" lang="en">
            {titleEn} · {toBengaliNumber(rows.length)}
          </span>
          <h2
            className="mt-1 font-bengali text-[1.25rem] font-medium text-content"
            lang="bn"
          >
            {titleBn}
          </h2>
        </div>

        {editing !== "new" && (
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-1.5 font-bengali text-[0.9375rem] text-accent transition hover:opacity-75"
          >
            <Plus className="h-3.5 w-3.5" />
            {addLabelBn}
          </button>
        )}
      </div>

      {hintBn && (
        <p className="mt-2 font-bengali text-xs text-content-faint" lang="bn">
          {hintBn}
        </p>
      )}

      {editing === "new" && <div className="mt-4">{form}</div>}

      <ul className="mt-5 divide-y divide-rule border-y border-rule">
        {rows.map((row) => (
          <li key={row.id} className="py-3">
            {editing === row.id ? (
              form
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-bengali text-bengali-base text-content" lang="bn">
                  {row.values[primaryKey]}
                </span>
                <span className="font-mono text-[0.6875rem] text-content-faint">
                  /{row.slug}
                </span>
                <span className="font-bengali text-xs text-content-faint">
                  {toBengaliNumber(row.count)}
                  {countNounBn}
                </span>

                <span className="ml-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="text-content-faint transition hover:text-accent"
                    title={t("admin.taxonomy.editTooltip")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    className="text-content-faint transition hover:text-accent"
                    title={t("admin.taxonomy.deleteTooltip")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            )}
          </li>
        ))}

        {rows.length === 0 && editing !== "new" && (
          <li className="py-6 text-sm text-content-soft">
            {t("admin.taxonomy.emptyList")}
          </li>
        )}
      </ul>
    </section>
  );
}
