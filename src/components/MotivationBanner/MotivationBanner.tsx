import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n/index";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface MotivationBannerProps {
  /** Rotation interval in milliseconds. Defaults to 5 000 ms. */
  intervalMs?: number;
}

/**
 * Fetches motivational messages for the given locale.
 *
 * Loads `/locales/{locale}/motivation.txt`, splits on newlines, trims each
 * line, and filters out empty strings.
 */
export async function loadMessages(locale: string): Promise<string[]> {
  const url = `/locales/${locale}/motivation.txt`;
  const response = await fetch(url);
  const text = await response.text();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// ─── Component ───────────────────────────────────────────────────────────────

const SESSION_KEY = "rbl_banner_dismissed";

export function MotivationBanner({ intervalMs = 5000 }: MotivationBannerProps) {
  const { t } = useTranslation();

  // Dismissed state — initialised from sessionStorage so it survives re-renders
  // but resets when the browser tab/session ends.
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [messages, setMessages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Controls the CSS opacity transition: true = fully visible, false = fading out
  const [visible, setVisible] = useState(true);

  // Load messages whenever the active locale changes
  const locale = i18n.language;

  useEffect(() => {
    if (dismissed) return;

    let cancelled = false;

    loadMessages(locale)
      .then((msgs) => {
        if (!cancelled) {
          setMessages(msgs);
          setCurrentIndex(0);
          setVisible(true);
        }
      })
      .catch(() => {
        // If the file cannot be fetched, silently show nothing
        if (!cancelled) setMessages([]);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, dismissed]);

  // Rotation: fade out → advance index → fade in
  useEffect(() => {
    if (dismissed || messages.length === 0) return;

    const timer = setInterval(() => {
      // Start fade-out
      setVisible(false);

      // After the CSS transition completes (300 ms), advance the index and
      // fade back in.
      const fadeTimer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        setVisible(true);
      }, 300);

      return () => clearTimeout(fadeTimer);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [dismissed, messages, intervalMs]);

  const handleDismiss = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // sessionStorage may be unavailable in some environments
    }
    setDismissed(true);
  }, []);

  // Don't render if dismissed or no messages available
  if (dismissed || messages.length === 0) return null;

  return (
    <div
      role="banner"
      aria-live="polite"
      className="w-full bg-green-600 text-white px-4 py-2 flex items-center justify-between gap-4 min-h-[3.5rem]"
    >
      {/* Rotating message with CSS opacity transition */}
      <p
        className="flex-1 text-sm font-medium text-center transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {messages[currentIndex]}
      </p>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t("banner.dismiss")}
        className="shrink-0 text-xs font-semibold underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white rounded"
      >
        {t("banner.dismiss")}
      </button>
    </div>
  );
}

export default MotivationBanner;
