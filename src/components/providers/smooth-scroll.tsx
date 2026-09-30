"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.includes("/read") || pathname.includes("/listen")) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    const configure = () => {
      lenis?.destroy();
      lenis = undefined;
      if (preference.matches) return;
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.12,
        smoothWheel: true,
        syncTouch: false,
        allowNestedScroll: true,
        anchors: { offset: -88 },
        prevent: (node) =>
          node.getAttribute("role") === "dialog" ||
          node.tagName === "TEXTAREA" ||
          document.body.style.overflow === "hidden" ||
          document.body.hasAttribute("data-scroll-locked"),
      });
    };
    configure();
    preference.addEventListener("change", configure);
    return () => {
      preference.removeEventListener("change", configure);
      lenis?.destroy();
    };
  }, [pathname]);

  return null;
}
