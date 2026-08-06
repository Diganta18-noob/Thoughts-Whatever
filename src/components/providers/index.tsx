"use client";

import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./language-provider";
import { ReadingProvider } from "./reading-provider";
import { AudioProvider } from "./audio-provider";
import { BookmarksProvider } from "./bookmarks-provider";
import { ProgressProvider } from "./progress-provider";
import { MiniPlayer } from "@/components/audio/mini-player";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ReadingProvider>
        <BookmarksProvider>
          <ProgressProvider>
            <AudioProvider>
              <SmoothScroll />
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
            </AudioProvider>
          </ProgressProvider>
        </BookmarksProvider>
      </ReadingProvider>
    </LanguageProvider>
  );
}
