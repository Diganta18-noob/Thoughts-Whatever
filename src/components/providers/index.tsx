"use client";

import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./language-provider";
import { ReadingProvider } from "./reading-provider";
import { AudioProvider } from "./audio-provider";
import { BookmarksProvider } from "./bookmarks-provider";
import { ProgressProvider } from "./progress-provider";
import { MiniPlayer } from "@/components/audio/mini-player";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

import { PostHogProvider } from "./posthog-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
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
                  containerStyle={{
                    zIndex: 99999,
                  }}
                  toastOptions={{
                    duration: 4500,
                    style: {
                      background: "rgb(var(--surface-raised))",
                      color: "rgb(var(--content))",
                      border: "1px solid rgb(var(--rule))",
                      borderRadius: "6px",
                      fontFamily: "var(--font-latin-sans), var(--font-bengali-sans), sans-serif",
                      fontSize: "0.8125rem",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
                      padding: "10px 14px",
                    },
                    success: {
                      iconTheme: {
                        primary: "#10b981",
                        secondary: "#ffffff",
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: "#f43f5e",
                        secondary: "#ffffff",
                      },
                    },
                  }}
                />
              </AudioProvider>
            </ProgressProvider>
          </BookmarksProvider>
        </ReadingProvider>
      </LanguageProvider>
    </PostHogProvider>
  );
}

