/**
 * Interactive Transliteration Tester Component
 * 
 * Live testing interface for transliteration with real-time conversion
 */

"use client";

import { useState, useEffect } from "react";
import { banglaToEnglish, englishToBangla, toEnglishSlug } from "@/lib/transliterate";

export function TransliterationTester() {
  const [inputBn, setInputBn] = useState("থট্‌স হোয়াটেভার");
  const [outputEn, setOutputEn] = useState("");
  const [inputEn, setInputEn] = useState("thoughts whatever");
  const [outputBn, setOutputBn] = useState("");
  const [slugInput, setSlugInput] = useState("থট্‌স হোয়াটেভার নতুন লেখা");
  const [slugOutput, setSlugOutput] = useState("");

  // Bengali → English
  useEffect(() => {
    const result = banglaToEnglish(inputBn);
    setOutputEn(result);
  }, [inputBn]);

  // English → Bengali
  useEffect(() => {
    const result = englishToBangla(inputEn);
    setOutputBn(result);
  }, [inputEn]);

  // Slug generation
  useEffect(() => {
    const result = toEnglishSlug(slugInput);
    setSlugOutput(result);
  }, [slugInput]);

  return (
    <div className="space-y-8">
      {/* Bengali → English */}
      <div className="rounded-sm border border-rule p-6">
        <h3 className="font-serif text-base font-semibold text-content">
          Bengali → English Conversion
        </h3>
        <p className="mt-1 text-sm text-content-soft">
          Type Bengali text to see automatic English conversion
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="bn-input" className="block text-sm font-medium text-content">
              Input (Bengali)
            </label>
            <textarea
              id="bn-input"
              value={inputBn}
              onChange={(e) => setInputBn(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-sm border border-rule bg-surface px-3 py-2 font-bengali text-sm text-content focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="থট্‌স হোয়াটেভার"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content">
              Output (English)
            </label>
            <div className="mt-1 w-full rounded-sm border border-rule bg-surface-raised px-3 py-2 font-mono text-sm text-accent">
              {outputEn || <span className="text-content-faint">—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* English → Bengali */}
      <div className="rounded-sm border border-rule p-6">
        <h3 className="font-serif text-base font-semibold text-content">
          English → Bengali Conversion
        </h3>
        <p className="mt-1 text-sm text-content-soft">
          Type English text to see reverse conversion (for display purposes)
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="en-input" className="block text-sm font-medium text-content">
              Input (English)
            </label>
            <textarea
              id="en-input"
              value={inputEn}
              onChange={(e) => setInputEn(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-sm text-content focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="thoughts whatever"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content">
              Output (Bengali)
            </label>
            <div className="mt-1 w-full rounded-sm border border-rule bg-surface-raised px-3 py-2 font-bengali text-sm text-accent">
              {outputBn || <span className="text-content-faint">—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* URL Slug Generator */}
      <div className="rounded-sm border border-rule p-6">
        <h3 className="font-serif text-base font-semibold text-content">
          URL Slug Generator
        </h3>
        <p className="mt-1 text-sm text-content-soft">
          Test how Bengali text converts to SEO-friendly English slugs
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="slug-input" className="block text-sm font-medium text-content">
              Input (Mixed/Bengali)
            </label>
            <input
              id="slug-input"
              type="text"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              className="mt-1 w-full rounded-sm border border-rule bg-surface px-3 py-2 font-bengali text-sm text-content focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="থট্‌স হোয়াটেভার নতুন লেখা"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content">
              URL Slug (English)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-content-faint">/</span>
              <div className="flex-1 rounded-sm border border-rule bg-surface-raised px-3 py-2 font-mono text-sm text-accent">
                {slugOutput || <span className="text-content-faint">—</span>}
              </div>
            </div>
          </div>
          {slugOutput && (
            <div className="rounded-sm bg-accent/5 px-3 py-2 text-xs text-content-soft">
              <strong>Full URL:</strong>{" "}
              <span className="font-mono">{`https://yourdomain.com/${slugOutput}`}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
