"use client";

import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./language-provider";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "rgb(var(--surface-raised))",
            color: "rgb(var(--content))",
            border: "1px solid rgb(var(--rule))",
            borderRadius: "2px",
            fontFamily: "var(--font-bengali-sans), sans-serif",
            fontSize: "0.875rem",
          },
        }}
      />
    </LanguageProvider>
  );
}
