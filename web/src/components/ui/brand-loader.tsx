"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface BrandLoaderProps {
  /**
   * Layout mode:
   * - "fullscreen": Fullscreen fixed overlay or full-page container (ideal for loading.tsx)
   * - "contained": Centered container within an existing section or card
   * - "compact": Small inline or card-level loader
   */
  variant?: "fullscreen" | "contained" | "compact";
  /** Custom status or loading message */
  message?: string;
  /** Subtitle text under the message */
  submessage?: string;
  /** Additional custom class names */
  className?: string;
  /** Show the luxury glowing orbit rings */
  showRings?: boolean;
}

export function BrandLoader({
  variant = "fullscreen",
  message = "Loading Everloft experience...",
  submessage,
  className,
  showRings = true,
}: BrandLoaderProps) {
  const [imgError, setImgError] = useState(false);

  const isCompact = variant === "compact";
  const isFullscreen = variant === "fullscreen";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={cn(
        "flex flex-col items-center justify-center select-none transition-all duration-300",
        isFullscreen && "min-h-[70vh] w-full py-16 px-4",
        variant === "contained" && "min-h-[360px] w-full py-12 px-4",
        isCompact && "py-6 px-4",
        className
      )}
    >
      {/* Central Animated Emblem */}
      <div className={cn("relative flex items-center justify-center", isCompact ? "h-16 w-16" : "h-28 w-28")}>
        {/* Soft Radial Ambient Glow */}
        <div
          className={cn(
            "absolute inset-0 -m-6 rounded-full bg-gradient-to-tr from-gold/30 via-gold/15 to-transparent blur-xl pointer-events-none animate-gold-pulse"
          )}
        />

        {showRings && (
          <>
            {/* Outer Slow Orbit Ring */}
            <div
              className={cn(
                "absolute inset-0 rounded-full border border-gold/30 border-t-gold border-r-transparent animate-spin-slow pointer-events-none",
                isCompact ? "-m-1.5" : "-m-3"
              )}
            />

            {/* Inner Counter-Rotating Dashed Orbit Ring */}
            <div
              className={cn(
                "absolute inset-0 rounded-full border border-dashed border-gold/40 border-b-gold border-l-transparent animate-spin-reverse pointer-events-none",
                isCompact ? "-m-0.5" : "-m-1.5"
              )}
            />
          </>
        )}

        {/* Center Logo Shield / Container */}
        <div
          className={cn(
            "relative z-10 flex items-center justify-center rounded-2xl border border-gold/30 bg-card/95 shadow-xl shadow-gold/10 backdrop-blur-md transition-transform duration-300",
            isCompact ? "h-12 w-12 rounded-xl p-2" : "h-20 w-20 p-3.5"
          )}
        >
          {!imgError ? (
            <Image
              src="/images/everloft-logo-mark.png"
              alt="Everloft"
              width={isCompact ? 36 : 60}
              height={isCompact ? 36 : 60}
              className="h-auto w-auto object-contain drop-shadow-sm transition-transform duration-500 hover:scale-105"
              onError={() => setImgError(true)}
              priority
            />
          ) : (
            <svg
              viewBox="0 0 32 32"
              className={cn("shrink-0", isCompact ? "h-7 w-7" : "h-11 w-11")}
              aria-hidden
            >
              <rect x="1" y="1" width="30" height="30" rx="8" className="fill-primary" />
              <path d="M16 7L23.5 13.2V24H19.6V17.4H12.4V24H8.5V13.2L16 7Z" className="fill-gold" />
            </svg>
          )}

          {/* Shimmer Light Bar across logo */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 dark:via-gold/20 to-transparent animate-shimmer-sweep" />
          </div>
        </div>
      </div>

      {/* Brand Wordmark & Animated Message */}
      {!isCompact && (
        <div className="mt-7 flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-bold tracking-[0.25em] uppercase text-gold">
              EVERLOFT
            </span>
            <span className="inline-block h-1 w-1 rounded-full bg-gold/60" />
            <span className="font-sans text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">
              Hospitality
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold tracking-tight text-foreground/90">
            {message}
          </p>

          {submessage && (
            <p className="mt-1 text-xs text-muted-foreground max-w-xs text-balance">
              {submessage}
            </p>
          )}

          {/* Gold Shimmer Progress Track */}
          <div className="relative mt-4 h-1 w-36 overflow-hidden rounded-full bg-border">
            <div className="absolute top-0 bottom-0 left-0 w-20 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent animate-shimmer-sweep" />
          </div>
        </div>
      )}

      {/* Screen reader only announcement */}
      <span className="sr-only">Loading, please wait...</span>
    </div>
  );
}
