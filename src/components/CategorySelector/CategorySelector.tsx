import { useState, useRef, useCallback } from "react";
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
}

// All material category values in display order
const ALL_CATEGORIES = Object.values(MaterialCategory) as MaterialCategory[];

// Active highlight classes applied to selected category items
const ACTIVE_CLASS = "ring-2 ring-green-500 bg-green-50";

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
  graceMs = 1000,
}: CategorySelectorProps) {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<Set<MaterialCategory>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  // Ref to hold the debounce timer so we can clear/reset it without causing
  // re-renders.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        <FunnelIcon className="h-4 w-4" aria-hidden="true" />
        <span>
          {t("category.quick_filter", "Quick filter")}
          {selected.size > 0 ? ` (${selected.size})` : ""}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
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
                      "flex flex-col items-center gap-1 rounded-lg p-2 border border-gray-200",
                      "cursor-pointer select-none transition-all duration-150",
                      "hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400",
                      isSelected ? ACTIVE_CLASS : "bg-white",
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
    </>
  );
}

export default CategorySelector;
