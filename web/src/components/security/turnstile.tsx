"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          action?: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export type TurnstileRef = {
  reset: () => void;
};

export type TurnstileProps = {
  action?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
};

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(function Turnstile(
  { action, onVerify, onExpire, onError, theme = "auto", className = "" },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string>("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useImperativeHandle(ref, () => ({
    reset: () => {
      setToken("");
      onVerify("");
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    if (!siteKey) {
      // In local dev without configured site key, provide a non-blocking dummy token
      const dummyDevToken = "dev-turnstile-bypass";
      setToken(dummyDevToken);
      onVerify(dummyDevToken);
      return;
    }

    let isMounted = true;

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey!,
          action,
          theme,
          callback: (receivedToken: string) => {
            if (!isMounted) return;
            setToken(receivedToken);
            onVerify(receivedToken);
          },
          "expired-callback": () => {
            if (!isMounted) return;
            setToken("");
            onVerify("");
            onExpire?.();
          },
          "error-callback": () => {
            if (!isMounted) return;
            setToken("");
            onVerify("");
            onError?.();
          },
        });
        widgetIdRef.current = id;
      } catch {
        // Suppress rendering error if unmounted during render
      }
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.getElementById("cf-turnstile-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", renderWidget);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors on unmount
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, action, theme, onVerify, onExpire, onError]);

  return (
    <div
      className={`my-3 min-h-[65px] flex items-center justify-start ${className}`}
      aria-label="Security check"
    >
      <div ref={containerRef} />
      <input type="hidden" name="cf-turnstile-response" value={token} />
    </div>
  );
});
