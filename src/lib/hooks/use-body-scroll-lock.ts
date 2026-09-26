"use client";

import { useEffect } from "react";

/**
 * Freeze background scrolling while an overlay is open.
 *
 * Keeps a module-level count rather than assigning `overflow: hidden` directly,
 * because two overlays can be open at once — hitting ⌘K from inside the mobile
 * drawer does exactly that — and whichever one unmounted first would otherwise
 * hand scrolling back to a page the other is still covering.
 *
 * Lenis is disabled on /admin (see `components/motion/smooth-scroll.tsx`), so
 * the native overflow lock is sufficient here; there is no smooth-scroll
 * instance that also needs stopping.
 */

let lockCount = 0;
let restoreOverflow = "";
let restorePaddingRight = "";

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      const { body } = document;
      restoreOverflow = body.style.overflow;
      restorePaddingRight = body.style.paddingRight;

      // Hiding the scrollbar widens the viewport by its width. Pad the body by
      // the same amount so the sticky header and the page under the overlay do
      // not jump sideways as it opens.
      const gutter = window.innerWidth - document.documentElement.clientWidth;
      if (gutter > 0) body.style.paddingRight = `${gutter}px`;
      body.style.overflow = "hidden";
    }

    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = restoreOverflow;
        document.body.style.paddingRight = restorePaddingRight;
      }
    };
  }, [active]);
}
