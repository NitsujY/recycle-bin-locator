import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES } from "../../i18n/index";
import type { SupportedLocale } from "../../i18n/index";
import i18n from "../../i18n/index";

// ─── Locale display labels ────────────────────────────────────────────────────

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "EN",
  "zh-HK": "繁中",
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Language toggle control.
 *
 * Renders a button for each supported locale. Clicking a button:
 * 1. Calls `i18n.changeLanguage(locale)` to switch the active language.
 * 2. Persists the choice to `localStorage` under the key `rbl_locale`.
 *
 * The currently active locale button is highlighted with a distinct style.
 */
export function LanguageToggle() {
  const { t } = useTranslation();

  const activeLocale = i18n.language as SupportedLocale;

  const handleChange = (locale: SupportedLocale) => {
    i18n.changeLanguage(locale);
    try {
      localStorage.setItem("rbl_locale", locale);
    } catch {
      // localStorage may be unavailable in some environments (e.g. private browsing)
    }
  };

  return (
    <div
      role="group"
      aria-label={t("language", "Language")}
      className="flex items-center gap-1"
    >
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = activeLocale === locale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => handleChange(locale)}
            aria-pressed={isActive}
            aria-label={LOCALE_LABELS[locale]}
            className={[
              "rounded px-2 py-1 text-sm font-medium transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-green-400",
              isActive
                ? "bg-green-600 text-white"
                : "bg-transparent text-gray-600 hover:bg-gray-100",
            ].join(" ")}
          >
            {LOCALE_LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageToggle;
