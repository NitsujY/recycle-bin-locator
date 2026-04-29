import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MaterialCategory } from "../../types/index";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CategoryIcon } from "../CategoryIcon/CategoryIcon";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface CategorySelectorProps {
  /** Called once after the grace period elapses with the complete selected set. */
  onFilterReady: (cats: Set<MaterialCategory>) => void;
  /** Debounce delay in milliseconds before firing onFilterReady. Defaults to 1 000 ms. */
  graceMs?: number;
  /** Whether to show the first-load onboarding quick-pick overlay. */
  showOnboarding?: boolean;
}

// All material category values in display order
const ALL_CATEGORIES: MaterialCategory[] = [
  MaterialCategory.Paper,
  MaterialCategory.Metal,
  MaterialCategory.Plastic,
  MaterialCategory.Glass,
  MaterialCategory.LightBulb,
  MaterialCategory.Battery,
  MaterialCategory.Other,
];

// Active highlight classes applied to selected items
const ACTIVE_BORDER = "border-green-600 bg-green-50";
const INACTIVE_BORDER = "border-gray-200 bg-white";

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Renders an icon grid for all MaterialCategory values.
 *
 * - Manages internal selection state as a Set<MaterialCategory>.
 * - Toggles categories on click.
 * - Debounces `onFilterReady` calls by `graceMs` ms, resetting the timer on
 *   each additional toggle within the grace period.
 */
export function CategorySelector({
  onFilterReady,
  graceMs = 0,
  showOnboarding = true,
}: CategorySelectorProps) {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<Set<MaterialCategory>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(showOnboarding);
  const [countdown, setCountdown] = useState(3);

  // Ref to hold the debounce timer so we can clear/reset it without causing
  // re-renders.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOnboardingOpen) return;

    if (countdown > 0) {
      const dismissTimer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(dismissTimer);
    } else {
      setIsOnboardingOpen(false);
    }
  }, [isOnboardingOpen, countdown]);

  const handleToggle = useCallback(
    (category: MaterialCategory) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(category)) {
          next.delete(category);
        } else {
          next.add(category);
        }

        // Clear any pending debounce timer and start a fresh one with the
        // latest selection state.
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          onFilterReady(new Set(next));
        }, graceMs);

        return next;
      });
    },
    [graceMs, onFilterReady]
  );

  return (
    <>
      <div className="w-full flex flex-row items-center justify-between gap-2 rounded-lg bg-transparent p-0">
        <div className="flex flex-1 flex-row flex-wrap items-center justify-start gap-1 sm:gap-2">
          {ALL_CATEGORIES.map((category) => {
            const isSelected = selected.has(category);
            const label = t(`category.${category}`);

            return (
              <button
                key={category}
                type="button"
                onClick={() => handleToggle(category)}
                aria-label={label}
                aria-pressed={isSelected}
                title={label}
                className={[
                  "rounded-full border p-1.5 transition",
                  "focus:outline-none focus:ring-2 focus:ring-green-400",
                  isSelected
                    ? ACTIVE_BORDER
                    : `${INACTIVE_BORDER} hover:bg-green-50`,
                ].join(" ")}
              >
                <CategoryIcon category={category} className="h-5 w-5" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 min-w-[2.5rem]"
        >
          <FunnelIcon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">
            {t("category.quick_filter", "Filter")}
          </span>
          {selected.size > 0 && <span>({selected.size})</span>}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[1400] flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("category.selector_label", "Material categories")}
            className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {t("category.selector_label", "Material categories")}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label={t("common.close", "Close")}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div role="group" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {ALL_CATEGORIES.map((category) => {
                const isSelected = selected.has(category);
                const label = t(`category.${category}`);

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleToggle(category)}
                    aria-pressed={isSelected}
                    className={[
                      "flex flex-col items-center gap-1 rounded-lg p-2 border",
                      "cursor-pointer select-none transition-all duration-150",
                      "hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400",
                      isSelected ? ACTIVE_BORDER : INACTIVE_BORDER,
                    ].join(" ")}
                  >
                    <CategoryIcon category={category} className="h-8 w-8" />
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {t("common.done", "Done")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isOnboardingOpen && (
        <div className="fixed inset-0 z-[1450] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("category.onboarding_title", "Quick material filter")}
            className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {t("category.onboarding_title", "Quick material filter")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t(
                    "category.onboarding_prompt",
                    "Choose what you are recycling now. Press Esc to close."
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 min-w-[2rem] flex justify-center"
                aria-label={t("common.close", "Close")}
              >
                {countdown > 0 ? (
                  <span className="text-xs font-semibold px-1 py-0.5">{countdown}s</span>
                ) : (
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-3">
              {[MaterialCategory.Paper, MaterialCategory.Metal, MaterialCategory.Plastic].map((category) => {
                const isSelected = selected.has(category);
                const label = t(`category.${category}`);

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleToggle(category)}
                    title={label}
                    className={[
                      "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium",
                      isSelected
                        ? ACTIVE_BORDER
                        : `${INACTIVE_BORDER} hover:bg-green-50`,
                    ].join(" ")}
                  >
                    <CategoryIcon category={category} className="h-6 w-6" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[MaterialCategory.Glass, MaterialCategory.LightBulb, MaterialCategory.Battery, MaterialCategory.Other].map((category) => {
                const isSelected = selected.has(category);
                const label = t(`category.${category}`);

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleToggle(category)}
                    title={label}
                    className={[
                      "flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs",
                      isSelected
                        ? ACTIVE_BORDER
                        : `${INACTIVE_BORDER} hover:bg-green-50`,
                    ].join(" ")}
                  >
                    <CategoryIcon category={category} className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CategorySelector;
