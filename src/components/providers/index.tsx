"use client";

import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./language-provider";
import { ReadingProvider } from "./reading-provider";
import { AudioProvider } from "./audio-provider";
import { BookmarksProvider } from "./bookmarks-provider";
import { LenisProvider } from "./lenis-provider";
import { MiniPlayer } from "@/components/audio/mini-player";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ReadingProvider>
        <BookmarksProvider>
          <AudioProvider>
            <LenisProvider>
              {children}
              <MiniPlayer />
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
            </LenisProvider>
          </AudioProvider>
        </BookmarksProvider>
      </ReadingProvider>
    </LanguageProvider>
  );
}
