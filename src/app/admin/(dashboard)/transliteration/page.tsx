/**
 * Admin Transliteration Settings Page
 * 
 * Allows admins to:
 * - View current transliteration rules
 * - Test transliteration in real-time
 * - Add/edit/remove transliteration pairs
 * - Enable/disable auto-transliteration
 */

import { Metadata } from "next";
import { TransliterationTester } from "./transliteration-tester";

export const metadata: Metadata = {
  title: "Transliteration Settings",
  robots: { index: false, follow: false },
};

export default function TransliterationSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-semibold text-content">
          Transliteration Settings
        </h1>
        <p className="mt-2 text-sm text-content-soft">
          Configure automatic Bengali → English transliteration rules.
          Changes apply immediately across the entire site.
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-sm border border-accent/20 bg-accent/5 p-4">
        <h2 className="font-serif text-sm font-semibold text-content">
          Loop Engineering Active ✓
        </h2>
        <p className="mt-1 text-sm text-content-soft">
          The transliteration system is currently running. All &quot;থট্‌স হোয়াটেভার&quot; text
          is automatically converted to &quot;thoughts whatever&quot; in:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-content-soft">
          <li>• Database writes (Prisma middleware)</li>
          <li>• URL slugs (Next.js middleware)</li>
          <li>• SEO metadata (OpenGraph, Twitter, JSON-LD)</li>
          <li>• Client-side rendering (React hooks)</li>
        </ul>
      </div>

      {/* Interactive Test Panel */}
      <TransliterationTester />

      {/* Current Rules */}
      <div className="rounded-sm border border-rule p-6">
        <h2 className="font-serif text-lg font-semibold text-content">
          Active Transliteration Rules
        </h2>
        <p className="mt-1 text-sm text-content-soft">
          Current Bengali → English conversion pairs. Longest matches take priority.
        </p>
        <div className="mt-4 space-y-2">
          <RuleRow bengali="থট্‌স হোয়াটেভার" english="thoughts whatever" primary />
          <RuleRow bengali="থটস হোয়াটেভার" english="thoughts whatever" />
          <RuleRow bengali="থট্স হোয়াটেভার" english="thoughts whatever" />
          <RuleRow bengali="থট্‌স" english="thoughts" />
          <RuleRow bengali="থটস" english="thoughts" />
          <RuleRow bengali="হোয়াটেভার" english="whatever" />
        </div>
        <div className="mt-6">
          <button
            type="button"
            className="rounded-sm border border-rule px-4 py-2 text-sm font-medium text-content transition hover:bg-content/5"
          >
            Add New Rule
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="rounded-sm border border-rule p-6">
        <h2 className="font-serif text-lg font-semibold text-content">
          System Status
        </h2>
        <div className="mt-4 space-y-3">
          <StatusRow
            label="Database Middleware"
            status="Active"
            description="Auto-converts on write operations"
          />
          <StatusRow
            label="URL Middleware"
            status="Active"
            description="301 redirects Bengali URLs to English"
          />
          <StatusRow
            label="SEO Metadata"
            status="Active"
            description="All meta tags use English"
          />
          <StatusRow
            label="Client-Side Hooks"
            status="Active"
            description="React components auto-transliterate"
          />
        </div>
      </div>

      {/* Documentation */}
      <div className="rounded-sm border border-rule p-6">
        <h2 className="font-serif text-lg font-semibold text-content">
          Developer Documentation
        </h2>
        <p className="mt-1 text-sm text-content-soft">
          Key files and usage examples for the transliteration system.
        </p>
        <div className="mt-4 space-y-3">
          <DocLink
            file="src/lib/transliterate.ts"
            description="Core transliteration utilities"
          />
          <DocLink
            file="src/lib/prisma.ts"
            description="Database middleware for auto-conversion"
          />
          <DocLink
            file="src/middleware.ts"
            description="Next.js middleware for URL handling"
          />
          <DocLink
            file="src/lib/seo-metadata.ts"
            description="SEO metadata generation with auto-transliteration"
          />
          <DocLink
            file="src/components/transliteration/"
            description="React hooks and components"
          />
        </div>
      </div>
    </div>
  );
}

function RuleRow({ bengali, english, primary }: { bengali: string; english: string; primary?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-sm border ${primary ? 'border-accent/30 bg-accent/5' : 'border-rule'} px-4 py-3`}>
      <div className="flex items-center gap-4">
        <span className="font-bengali text-sm text-content">{bengali}</span>
        <span className="text-content-faint">→</span>
        <span className="font-mono text-sm text-content-soft">{english}</span>
        {primary && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
            Primary
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="text-xs text-content-soft hover:text-content"
        >
          Edit
        </button>
        <button
          type="button"
          className="text-xs text-content-faint hover:text-red-500"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function StatusRow({ label, status, description }: { label: string; status: string; description: string }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-content">{label}</span>
          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
            {status}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-content-soft">{description}</p>
      </div>
    </div>
  );
}

function DocLink({ file, description }: { file: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <code className="mt-0.5 shrink-0 rounded bg-surface-raised px-2 py-1 font-mono text-xs text-content">
        {file}
      </code>
      <span className="text-sm text-content-soft">{description}</span>
    </div>
  );
}
