"use client";

import { LanguageProvider } from "./language-provider";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}
