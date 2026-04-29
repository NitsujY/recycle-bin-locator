import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

// Supported locales
export const SUPPORTED_LOCALES = ["en", "zh-HK"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Detects the user's preferred locale.
 *
 * Priority:
 * 1. `localStorage` key `rbl_locale` — if it holds a supported locale, use it.
 * 2. `navigator.language` / `navigator.languages[0]` — map zh-HK / zh-Hant prefixes
 *    to "zh-HK", everything else to "en".
 * 3. Fall back to "en".
 */
export function detectLocale(): SupportedLocale {
  // 1. Check persisted user preference
  try {
    const stored = localStorage.getItem("rbl_locale");
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as SupportedLocale;
    }
  } catch {
    // localStorage may be unavailable (e.g. private browsing restrictions)
  }

  // 2. Check browser locale
  const browserLocale =
    (typeof navigator !== "undefined" &&
      (navigator.language || navigator.languages?.[0])) ||
    "en";

  if (
    browserLocale.startsWith("zh-HK") ||
    browserLocale.startsWith("zh-Hant")
  ) {
    return "zh-HK";
  }

  // 3. Default to English
  return "en";
}

// Initialise i18next with the HTTP backend (loads from public/locales/)
i18next
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: detectLocale(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/translation.json`,
    },
  });

export default i18next;
