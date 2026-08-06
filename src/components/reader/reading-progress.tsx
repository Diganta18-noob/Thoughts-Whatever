"use client";

import { useEffect, useState } from "react";

export function ReadingProgress({ targetId }: { targetId?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const total = targetEl.scrollHeight;
        const current = Math.abs(rect.top);
        if (total > 0) {
          setProgress(Math.min(100, Math.max(0, (current / total) * 100)));
          return;
        }
      }

      const current = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0) {
        setProgress(Math.min(100, Math.max(0, (current / height) * 100)));
      }
    };


    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => window.removeEventListener("scroll", updateProgress);
  }, [targetId]);


  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent">
      <div
        className="h-full bg-accent transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
