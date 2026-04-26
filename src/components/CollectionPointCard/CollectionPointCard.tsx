import { useTranslation } from "react-i18next";
import type { CollectionPoint } from "../../types/index";
import { CategoryIcon } from "../CategoryIcon/CategoryIcon";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface CollectionPointCardProps {
  point: CollectionPoint;
  isSelected?: boolean;
  onLogVisit: (point: CollectionPoint) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats a distance in metres into a human-readable badge string.
 *
 * - < 1 000 m  → "{n} m"
 * - ≥ 1 000 m  → "{n.n} km" (1 decimal place)
 */
function formatDistance(metres: number): string {
  if (metres < 1000) {
    return `${Math.round(metres)} m`;
  }
  return `${(metres / 1000).toFixed(1)} km`;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Displays a summary card for a single collection point.
 *
 * - Shows the localised name (Traditional Chinese when locale is "zh-HK" and
 *   `nameZhHK` is available, otherwise falls back to `name`).
 * - Renders a distance badge when `distanceMetres` is defined.
 * - Renders one icon per accepted material category with an accessible label.
 * - Shows opening hours free-text when `openingHours.raw` is present.
 * - Provides a "Log Visit" button that calls `onLogVisit(point)`.
 * - Applies a green highlight ring when `isSelected` is true.
 */
export function CollectionPointCard({
  point,
  isSelected = false,
  onLogVisit,
}: CollectionPointCardProps) {
  const { t, i18n } = useTranslation();

  // Resolve display name: prefer Traditional Chinese when locale matches and
  // the field is available.
  const displayName =
    i18n.language === "zh-HK" && point.nameZhHK ? point.nameZhHK : point.name;

  return (
    <article
      className={[
        "rounded-xl border bg-white p-4 shadow-sm transition-all duration-150",
        isSelected
          ? "ring-2 ring-green-500 border-green-500"
          : "border-gray-200 hover:border-green-300",
      ].join(" ")}
      aria-current={isSelected ? "true" : undefined}
    >
      {/* ── Header row: name + distance badge ── */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">
          {displayName}
        </h3>

        {point.distanceMetres !== undefined && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            {formatDistance(point.distanceMetres)}
          </span>
        )}
      </div>

      {/* ── Accepted category icons ── */}
      {point.acceptedCategories.length > 0 && (
        <div
          className="mt-2 flex flex-wrap gap-1"
          aria-label={t("category.accepted_label", "Accepted categories")}
        >
          {point.acceptedCategories.map((cat) => (
            <span key={cat} aria-label={t(`category.${cat}`)}>
              <CategoryIcon category={cat} className="h-6 w-6" />
            </span>
          ))}
        </div>
      )}

      {/* ── Opening hours ── */}
      {point.openingHours?.raw && (
        <p className="mt-2 text-xs text-gray-500">{point.openingHours.raw}</p>
      )}

      {/* ── Log Visit button ── */}
      <button
        type="button"
        onClick={() => onLogVisit(point)}
        className={[
          "mt-3 w-full rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white",
          "hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400",
          "transition-colors duration-150",
        ].join(" ")}
      >
        {t("log_visit")}
      </button>
    </article>
  );
}

export default CollectionPointCard;
