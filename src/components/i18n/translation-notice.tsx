"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { useTranslatedText } from "./translation-store";

export function TranslationNotice() {
  const { isBn } = useLanguage();
  const pathname = usePathname();
  const [sourceTitle, setSourceTitle] = useState("");
  const ownTitle = useRef("");
  const translatedTitle = useTranslatedText(sourceTitle);
  useEffect(() => {
    const readTitle = () => { if (document.title !== ownTitle.current) setSourceTitle(document.title); };
    readTitle();
    const title = document.querySelector("title");
    if (!title) return;
    const observer = new MutationObserver(readTitle);
    observer.observe(title, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname]);
  useEffect(() => {
    if (!sourceTitle || pathname.startsWith("/admin")) return;
    ownTitle.current = isBn ? sourceTitle : translatedTitle;
    document.title = ownTitle.current;
  }, [isBn, sourceTitle, translatedTitle, pathname]);
  if (isBn || pathname.startsWith("/admin")) return null;
  return (
    <aside lang="en" className="border-b border-rule bg-surface-raised px-4 py-2 font-sans text-xs leading-relaxed text-content-soft" aria-label="Translation information">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
        <span>English includes automatic translations. Select Bengali to read the original. Some texts do not have an English version yet.</span>
      </div>
    </aside>
  );
}
