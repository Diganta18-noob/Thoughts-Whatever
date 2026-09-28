"use client";

import React, { useState, useEffect } from "react";
import {
  ReferenceType,
  ReferenceLanguage,
  ReferenceRightsStatus,
  ReferenceHostingMode,
} from "@prisma/client";
import { BookOpen, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, NativeSelect, Textarea } from "@/components/ui";
import { MediaPicker } from "@/components/admin/media-picker";

interface ReferenceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any | null;
}

export function ReferenceEditorModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ReferenceEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "edition" | "source" | "rights">("basic");
  const [authors, setAuthors] = useState<Array<{ id: string; nameBn: string; slug: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  // Form fields
  const [titleBn, setTitleBn] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitleBn, setSubtitleBn] = useState("");
  const [descriptionBn, setDescriptionBn] = useState("");
  const [type, setType] = useState<ReferenceType>("BOOK");
  const [language, setLanguage] = useState<ReferenceLanguage>("BENGALI");
  const [era, setEra] = useState("");
  const [subject, setSubject] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [authorId, setAuthorId] = useState("");

  // Edition fields
  const [editor, setEditor] = useState("");
  const [translator, setTranslator] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publicationYear, setPublicationYear] = useState<string>("");
  const [publicationPlace, setPublicationPlace] = useState("");
  const [isbn, setIsbn] = useState("");
  const [pages, setPages] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [hostingMode, setHostingMode] = useState<ReferenceHostingMode>("EXTERNAL");

  // Source fields
  const [sourceName, setSourceName] = useState("Internet Archive");
  const [sourceUrl, setSourceUrl] = useState("");
  const [externalId, setExternalId] = useState("");
  const [sourceDescription, setSourceDescription] = useState("");

  // Rights fields
  const [rightsStatus, setRightsStatus] = useState<ReferenceRightsStatus>("RIGHTS_UNVERIFIED");
  const [license, setLicense] = useState("");
  const [rightsHolder, setRightsHolder] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");

  // Fetch authors on mount
  useEffect(() => {
    fetch("/api/admin/authors")
      .then((r) => r.json())
      .then((data) => {
        if (data.authors) setAuthors(data.authors);
      })
      .catch(() => {});
  }, []);

  // Sync initialData if editing
  useEffect(() => {
    if (initialData) {
      setTitleBn(initialData.titleBn || "");
      setTitleEn(initialData.titleEn || "");
      setSlug(initialData.slug || "");
      setSubtitleBn(initialData.subtitleBn || "");
      setDescriptionBn(initialData.descriptionBn || "");
      setType(initialData.type || "BOOK");
      setLanguage(initialData.language || "BENGALI");
      setEra(initialData.era || "");
      setSubject(initialData.subject || "");
      setTags(initialData.tags ? initialData.tags.join(", ") : "");
      setFeatured(initialData.featured || false);
      setPublished(initialData.published ?? true);
      setAuthorId(initialData.authorId || "");

      const ed = initialData.editions?.[0];
      if (ed) {
        setEditor(ed.editor || "");
        setTranslator(ed.translator || "");
        setPublisher(ed.publisher || "");
        setPublicationYear(ed.publicationYear ? String(ed.publicationYear) : "");
        setPublicationPlace(ed.publicationPlace || "");
        setIsbn(ed.isbn || "");
        setPages(ed.pages ? String(ed.pages) : "");
        setNotes(ed.notes || "");
        setCoverImage(ed.coverImage || "");
        setHostingMode(ed.hostingMode || "EXTERNAL");

        const src = ed.sources?.[0];
        if (src) {
          setSourceName(src.sourceName || "Internet Archive");
          setSourceUrl(src.sourceUrl || "");
          setExternalId(src.externalId || "");
          setSourceDescription(src.sourceDescription || "");
        }

        const r = ed.rights;
        if (r) {
          setRightsStatus(r.status || "RIGHTS_UNVERIFIED");
          setLicense(r.license || "");
          setRightsHolder(r.rightsHolder || "");
          setEvidenceUrl(r.evidenceUrl || "");
          setVerificationNotes(r.verificationNotes || "");
        }
      }
    } else {
      // Reset defaults
      setTitleBn("");
      setTitleEn("");
      setSlug("");
      setSubtitleBn("");
      setDescriptionBn("");
      setType("BOOK");
      setLanguage("BENGALI");
      setEra("");
      setSubject("");
      setTags("");
      setFeatured(false);
      setPublished(true);
      setAuthorId("");
      setEditor("");
      setTranslator("");
      setPublisher("");
      setPublicationYear("");
      setPublicationPlace("");
      setIsbn("");
      setPages("");
      setNotes("");
      setCoverImage("");
      setHostingMode("EXTERNAL");
      setSourceName("Internet Archive");
      setSourceUrl("");
      setExternalId("");
      setSourceDescription("");
      setRightsStatus("RIGHTS_UNVERIFIED");
      setLicense("");
      setRightsHolder("");
      setEvidenceUrl("");
      setVerificationNotes("");
    }
  }, [initialData]);

  if (!isOpen) return null;

  // UX Guardrail enforcement:
  const canHostLocally = rightsStatus === "PUBLIC_DOMAIN" || rightsStatus === "LICENSED";

  function handleHostingModeChange(mode: ReferenceHostingMode) {
    if (mode === "THOUGHTS_WHATEVER" && !canHostLocally) {
      toast.error(
        "Hosting blocked: A resource must have verified Public Domain or Licensed rights before selecting Thoughts.Whatever hosting.",
      );
      setHostingMode("EXTERNAL");
      return;
    }
    setHostingMode(mode);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titleBn.trim()) {
      toast.error("বাংলা শিরোনাম আবশ্যক।");
      setActiveTab("basic");
      return;
    }
    if (!slug.trim()) {
      toast.error("স্লাগ আবশ্যক।");
      setActiveTab("basic");
      return;
    }
    if (!sourceUrl.trim()) {
      toast.error("উৎস URL আবশ্যক।");
      setActiveTab("source");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        titleBn,
        titleEn: titleEn || null,
        slug,
        subtitleBn: subtitleBn || null,
        descriptionBn: descriptionBn || null,
        type,
        language,
        era: era || null,
        subject: subject || null,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        featured,
        published,
        authorId: authorId || null,
        edition: {
          editor: editor || null,
          translator: translator || null,
          publisher: publisher || null,
          publicationYear: publicationYear ? parseInt(publicationYear, 10) : null,
          publicationPlace: publicationPlace || null,
          isbn: isbn || null,
          pages: pages ? parseInt(pages, 10) : null,
          notes: notes || null,
          coverImage: coverImage || null,
          hostingMode,
          source: {
            sourceName,
            sourceUrl,
            externalId: externalId || null,
            sourceDescription: sourceDescription || null,
          },
          rights: {
            status: rightsStatus,
            license: license || null,
            rightsHolder: rightsHolder || null,
            evidenceUrl: evidenceUrl || null,
            verificationNotes: verificationNotes || null,
          },
        },
      };

      const url = initialData
        ? `/api/admin/reference/${initialData.id}`
        : "/api/admin/reference";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save reference");

      toast.success(
        initialData
          ? "রেফারেন্স সফলভাবে আপডেট করা হয়েছে।"
          : "নতুন রেফারেন্স উপাদান সফলভাবে সংরক্ষণ করা হয়েছে।",
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "সংরক্ষণ ব্যর্থ হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-surface border border-rule rounded-card shadow-2xl p-6 text-content-faint my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-content-faint hover:text-content-faint/80 p-1.5 rounded-lg hover:bg-surface-raised/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-rule pb-4 mb-5">
          <div className="p-2.5 rounded-lg bg-success/40 border border-success/40 text-success">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-content-faint">
              {initialData ? "Edit Reference Resource" : "Add Reference Resource"}
            </h2>
            <p className="text-xs text-content-faint">
              Rights-aware Bengali literary & historical catalog entry
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-rule mb-5 gap-2 text-xs font-mono">
          {[
            { id: "basic", label: "1. Work Metadata" },
            { id: "edition", label: "2. Edition & Bibliography" },
            { id: "source", label: "3. Source Attribution" },
            { id: "rights", label: "4. Rights & Hosting" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-success text-success font-semibold"
                  : "border-transparent text-content-faint hover:text-content-faint/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    বাংলা শিরোনাম (Title Bn) *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="যেমন: কালিকাপুরাণ"
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    English Title
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Kalika Purana"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    স্লাগ (URL Slug) *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="যেমন: kalika-purana বা কালিকাপুরাণ"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    সম্পর্কিত সাহিত্যিক / লেখক (Author Dossier)
                  </label>
                  <NativeSelect
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                  >
                    <option value="">-- কোনো লেখক যুক্ত নেই --</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nameBn} ({a.slug})
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    উপাদানের ধরন (Type)
                  </label>
                  <NativeSelect
                    value={type}
                    onChange={(e) => setType(e.target.value as ReferenceType)}
                  >
                    <option value="BOOK">BOOK (বই / গ্রন্থ)</option>
                    <option value="DOCUMENT">DOCUMENT (ঐতিহাসিক নথি)</option>
                    <option value="MANUSCRIPT">MANUSCRIPT (পাণ্ডুলিপি)</option>
                    <option value="ARTICLE">ARTICLE (প্রবন্ধ / নিবন্ধ)</option>
                    <option value="AUDIO">AUDIO (শ্রব্য কথিকা / অডিও)</option>
                    <option value="TRANSCRIPT">TRANSCRIPT (অনুলিপি)</option>
                    <option value="ARCHIVE">ARCHIVE (সংগ্রহশালা)</option>
                    <option value="OTHER">OTHER (অন্যান্য)</option>
                  </NativeSelect>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    ভাষা (Language)
                  </label>
                  <NativeSelect
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as ReferenceLanguage)}
                  >
                    <option value="BENGALI">বাংলা (Bengali)</option>
                    <option value="SANSKRIT">সংস্কৃত (Sanskrit)</option>
                    <option value="ENGLISH">ইংরেজি (English)</option>
                    <option value="HINDI">হিন্দি (Hindi)</option>
                    <option value="URDU">উর্দু (Urdu)</option>
                    <option value="OTHER">অন্যান্য (Other)</option>
                  </NativeSelect>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    ঐতিহাসিক কালখণ্ড (Era)
                  </label>
                  <Input
                    type="text"
                    placeholder="যেমন: ঊনবিংশ শতাব্দী, ১৯২০"
                    value={era}
                    onChange={(e) => setEra(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  সংক্ষিপ্ত বিবরণ (Description Bn)
                </label>
                <Textarea
                  rows={3}
                  placeholder="উপাদানটির বিষয়বস্তু ও ঐতিহাসিক গুরুত্বের সারসংক্ষেপ..."
                  value={descriptionBn}
                  onChange={(e) => setDescriptionBn(e.target.value)}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-content-faint cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-rule text-success focus:ring-success"
                  />
                  Featured on Reference Home
                </label>
                <label className="flex items-center gap-2 text-xs text-content-faint cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="rounded border-rule text-success focus:ring-success"
                  />
                  Publicly Published
                </label>
              </div>
            </div>
          )}

          {activeTab === "edition" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    সম্পাদক (Editor)
                  </label>
                  <Input
                    type="text"
                    placeholder="যেমন: পঞ্চানন তর্করত্ন"
                    value={editor}
                    onChange={(e) => setEditor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    অনুবাদক (Translator)
                  </label>
                  <Input
                    type="text"
                    placeholder="অনুবাদকের নাম..."
                    value={translator}
                    onChange={(e) => setTranslator(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    প্রকাশক (Publisher)
                  </label>
                  <Input
                    type="text"
                    placeholder="যেমন: বঙ্গবাসী স্টিম প্রেস"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    প্রকাশনার সাল (Publication Year)
                  </label>
                  <Input
                    type="number"
                    placeholder="যেমন: 1909"
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    প্রকাশনার স্থান (Place)
                  </label>
                  <Input
                    type="text"
                    placeholder="যেমন: কলকাতা"
                    value={publicationPlace}
                    onChange={(e) => setPublicationPlace(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    মোট পৃষ্ঠা (Pages)
                  </label>
                  <Input
                    type="number"
                    placeholder="যেমন: 540"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  প্রচ্ছদ ছবি URL (Cover Image URL)
                </label>
                <Input
                  type="url"
                  placeholder="https://... (Cloudinary / Image URL)"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />
                <button type="button" onClick={() => setCoverPickerOpen(true)} className="mt-2 text-xs text-accent underline">Choose from Media Library</button>
                {coverPickerOpen && <MediaPicker type="image" onClose={() => setCoverPickerOpen(false)} onSelect={(asset) => setCoverImage(asset.url)} />}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  সংস্করণ সংক্রান্ত টীকা (Bibliographic Notes)
                </label>
                <Textarea
                  rows={2}
                  placeholder="গ্রন্থপঞ্জি বা বিশেষ টীকা..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === "source" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    উৎস বা প্রতিষ্ঠানের নাম (Source Name) *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Internet Archive, National Library, University of Calcutta"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    মূল ডিজিটাল উৎসের URL (Source URL) *
                  </label>
                  <Input
                    type="url"
                    required
                    placeholder="https://archive.org/details/..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  বাহ্যিক শনাক্তকারী (External ID / ARK / Barcode)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. ark:/13960/t4km8f73b or 2990100012345"
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  উৎস সংক্রান্ত বিবরণ (Source Description)
                </label>
                <Textarea
                  rows={2}
                  placeholder="ডিজিটাইজেশন বা সংগ্রহশালার তথ্য..."
                  value={sourceDescription}
                  onChange={(e) => setSourceDescription(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === "rights" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  স্বত্ব স্থিতি (Rights Status) *
                </label>
                <NativeSelect
                  value={rightsStatus}
                  onChange={(e) => {
                    const next = e.target.value as ReferenceRightsStatus;
                    setRightsStatus(next);
                    if (next !== "PUBLIC_DOMAIN" && next !== "LICENSED") {
                      setHostingMode("EXTERNAL");
                    }
                  }}
                >
                  <option value="RIGHTS_UNVERIFIED">
                    RIGHTS_UNVERIFIED (স্বত্ব অপরীক্ষিত — ডিফল্ট বহিরাগত উৎস)
                  </option>
                  <option value="PUBLIC_DOMAIN">
                    PUBLIC_DOMAIN (যাচাইকৃত পাবলিক ডোমেইন — হোস্টিং ও পাঠকক্ষ প্রযোজ্য)
                  </option>
                  <option value="LICENSED">
                    LICENSED (অনুমোদিত লাইসেন্স / অনুমতিপত্র সংবলিত)
                  </option>
                  <option value="EXTERNAL_SOURCE">
                    EXTERNAL_SOURCE (শুধুমাত্র প্রাতিষ্ঠানিক রেফারেন্স লিংক)
                  </option>
                  <option value="RESTRICTED">
                    RESTRICTED (সংরক্ষিত কপিরাইট — কেবল গ্রন্থপঞ্জি তথ্য)
                  </option>
                </NativeSelect>
              </div>

              {/* Hosting Mode Selection with Invariant Guard */}
              <div className="p-4 bg-surface-raised/60 border border-rule rounded-card space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint">
                  হোস্টিং মডেল (Hosting Architecture)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      hostingMode === "EXTERNAL"
                        ? "border-success bg-success/20 text-content-faint"
                        : "border-rule bg-surface/50 text-content-faint"
                    }`}
                  >
                    <input
                      type="radio"
                      name="hostingMode"
                      value="EXTERNAL"
                      checked={hostingMode === "EXTERNAL"}
                      onChange={() => handleHostingModeChange("EXTERNAL")}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-sm block">External Reference Only</span>
                      <span className="text-xs text-content-faint block mt-0.5">
                        Thoughts.Whatever catalogs metadata and points to legitimate source. Zero file hosting.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      hostingMode === "THOUGHTS_WHATEVER"
                        ? "border-success bg-success/20 text-content-faint"
                        : canHostLocally
                        ? "border-rule bg-surface/50 text-content-faint"
                        : "border-rule/40 bg-surface/20 text-content-soft cursor-not-allowed opacity-60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="hostingMode"
                      value="THOUGHTS_WHATEVER"
                      checked={hostingMode === "THOUGHTS_WHATEVER"}
                      disabled={!canHostLocally}
                      onChange={() => handleHostingModeChange("THOUGHTS_WHATEVER")}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-sm block">Thoughts.Whatever Hosted</span>
                      <span className="text-xs text-content-faint block mt-0.5">
                        Allowed only for verified Public Domain or Licensed works.
                      </span>
                    </div>
                  </label>
                </div>

                {!canHostLocally && (
                  <div className="p-2.5 bg-warning/30 border border-warning/40 rounded flex items-start gap-2 text-warning text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Hosting Safeguard Active:</strong> A resource must have verified <code>PUBLIC_DOMAIN</code> or <code>LICENSED</code> status before Thoughts.Whatever can host downloadable or readable files.
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    লাইসেন্স (License)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Public Domain Mark 1.0, CC BY-SA 4.0"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    স্বত্বাধিকারী / প্রকাশক (Rights Holder)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Public Domain / Author Estate"
                    value={rightsHolder}
                    onChange={(e) => setRightsHolder(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  প্রমাণপত্র বা আর্কাইভ দলিল URL (Evidence URL)
                </label>
                <Input
                  type="url"
                  placeholder="https://archive.org/... or copyright registry link"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  স্বত্ব পরীক্ষণ সংক্রান্ত টীকা (Verification Notes)
                </label>
                <Textarea
                  rows={2}
                  placeholder="ভারতীয় কপিরাইট আইন বা পাবলিক ডোমেইনের মেয়াদ উত্তীর্ণের প্রমাণ..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-rule">
            <div className="flex items-center gap-2">
              {activeTab !== "basic" && (
                <Button variant="secondary" size="sm"
                  onClick={() => {
                    if (activeTab === "edition") setActiveTab("basic");
                    if (activeTab === "source") setActiveTab("edition");
                    if (activeTab === "rights") setActiveTab("source");
                  }}
                  className="font-mono hover:text-content-faint/80"
                >
                  ← Previous Step
                </Button>
              )}
              {activeTab !== "rights" && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "basic") setActiveTab("edition");
                    if (activeTab === "edition") setActiveTab("source");
                    if (activeTab === "source") setActiveTab("rights");
                  }}
                  className="px-3 py-1.5 text-xs font-mono text-success hover:text-success/80 border border-success/60 rounded"
                >
                  Next Step →
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary"
                onClick={onClose}
                className="hover:text-content-faint/80"
              >
                Cancel
              </Button>
              <Button variant="success"
                type="submit"
                disabled={isSubmitting}
                className="px-5"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {initialData ? "Update Resource" : "Create Reference"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
