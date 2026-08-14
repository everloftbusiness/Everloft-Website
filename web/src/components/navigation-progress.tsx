"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress whenever route path or searchParams change
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept client-side link clicks to start progress bar instantly
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = (event.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, downloads, hash links, mailto/tel, modifier clicks, or targets
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        target.hasAttribute("download") ||
        target.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      // Check if same origin and different URL
      try {
        const targetUrl = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (
          targetUrl.origin === currentUrl.origin &&
          (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
        ) {
          startTransition(() => {
            setIsLoading(true);
            setProgress(25);
          });
        }
      } catch {
        // invalid URL, ignore
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  // Smooth fake progress progression while loading
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const remaining = 90 - prev;
        return prev + Math.max(1, Math.floor(remaining * 0.15));
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 right-0 z-[99999] h-[3px] overflow-hidden bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-gold/60 via-gold to-gold-soft shadow-[0_0_14px_rgba(212,175,55,0.85)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: "width, opacity",
          transitionDuration: progress === 100 ? "300ms" : "200ms",
        }}
      />
    </div>
  );
}
