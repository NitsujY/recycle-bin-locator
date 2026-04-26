import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface SearchBarProps {
  /** Called with the trimmed query string when the form is submitted. */
  onSearch: (query: string) => void;
  /** Error message displayed below the input when geocoding fails. */
  error?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Text input form for address / place-name search.
 *
 * - Submitting the form (Enter key or button click) calls `onSearch` with the
 *   trimmed input value and prevents the default browser form submission.
 * - When the `error` prop is provided it is rendered below the input in red.
 */
export function SearchBar({ onSearch, error }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        role="search"
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          className={[
            "flex-1 rounded-lg border px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-green-400",
            error ? "border-red-500" : "border-gray-300",
          ].join(" ")}
        />
        <button
          type="submit"
          aria-label={t("search.submit_label", "Search")}
          className={[
            "rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white",
            "hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400",
            "transition-colors duration-150",
          ].join(" ")}
        >
          {t("search.submit_label", "Search")}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default SearchBar;
