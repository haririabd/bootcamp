"use client";

import { useState, useEffect, useRef } from "react";

export function useBoardScroll<T extends HTMLElement>() {
  const scrollRef = useRef<T>(null);
  const [shadows, setShadows] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateShadows = () => {
      setShadows({
        left: el.scrollLeft > 0,
        // Math.ceil handles sub-pixel rendering differences
        right: Math.ceil(el.scrollLeft) < el.scrollWidth - el.clientWidth,
      });
    };

    updateShadows();
    el.addEventListener("scroll", updateShadows, { passive: true });

    const resizeObserver = new ResizeObserver(updateShadows);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateShadows);
      resizeObserver.disconnect();
    };
  }, []);

  return { scrollRef, shadows };
}
