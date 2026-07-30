"use client";

import { useEffect, useState } from "react";

export function ReadingProgress({ onMilestone }: { onMilestone?: (percentage: number) => void }) {
  const [progress, setProgress] = useState(0);
  const [milestonesReached, setMilestonesReached] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const currentScroll = window.scrollY;
      const percentage = Math.min(100, Math.max(0, Math.round((currentScroll / totalHeight) * 100)));
      setProgress(percentage);

      // Check milestones
      [25, 50, 75, 100].forEach((m) => {
        if (percentage >= m && !milestonesReached.has(m)) {
          setMilestonesReached((prev) => new Set(prev).add(m));
          if (onMilestone) onMilestone(m);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [milestonesReached, onMilestone]);

  return (
    <div className="fixed top-0 left-0 right-0 h-1.5 bg-transparent z-50 no-print">
      <div
        className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
