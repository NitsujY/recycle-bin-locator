import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getEarnedBadges, getStats } from "../../services/achievementService";
import { BADGE_DEFINITIONS, MaterialCategory } from "../../types/index";
import type { EarnedBadge, UserStats } from "../../types/index";
import { CategoryIcon } from "../CategoryIcon/CategoryIcon";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface AchievementPanelProps {
  /** Increment to trigger a re-read from achievementService. */
  refreshKey?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats an ISO 8601 timestamp into a locale-aware short date string.
 */
function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Displays the user's earned achievement badges and cumulative recycling stats.
 *
 * - Reads earned badges via `getEarnedBadges()` and stats via `getStats()`.
 * - Re-reads whenever the `refreshKey` prop changes.
 * - Badge section: icon, localised label, and earned date for each badge.
 * - Stats section: total visits, unique points visited, categories recycled
 *   (only categories with count > 0 are listed).
 */
export function AchievementPanel({ refreshKey }: AchievementPanelProps) {
  const { t } = useTranslation();

  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [stats, setStats] = useState<UserStats>(() => getStats());

  // Re-read from service whenever refreshKey changes (or on first mount).
  useEffect(() => {
    setEarnedBadges(getEarnedBadges());
    setStats(getStats());
  }, [refreshKey]);

  // Build a lookup map from badgeId → BadgeDefinition for O(1) access.
  const badgeDefMap = new Map(BADGE_DEFINITIONS.map((def) => [def.id, def]));

  // Determine which categories have been recycled at least once.
  const recycledCategories = (
    Object.entries(stats.categoriesRecycled) as [MaterialCategory, number][]
  ).filter(([, count]) => count > 0);

  return (
    <section
      aria-labelledby="achievement-panel-heading"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      {/* ── Section heading ── */}
      <h2
        id="achievement-panel-heading"
        className="text-base font-semibold text-gray-900"
      >
        {t("achievements")}
      </h2>

      {/* ── Badges ── */}
      <div className="mt-4">
        {earnedBadges.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t("achievements.no_badges", "No badges earned yet. Start recycling!")}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-4" aria-label={t("achievements")}>
            {earnedBadges.map((badge) => {
              const def = badgeDefMap.get(badge.badgeId);
              if (!def) return null;

              return (
                <li
                  key={badge.badgeId}
                  className="flex flex-col items-center gap-1 text-center"
                >
                  {/* Badge icon */}
                  <img
                    src={def.iconPath}
                    aria-label={t(def.labelKey)}
                    alt=""
                    className="h-12 w-12"
                  />
                  {/* Badge label */}
                  <span className="text-xs font-medium text-gray-700">
                    {t(def.labelKey)}
                  </span>
                  {/* Earned timestamp */}
                  <span className="text-xs text-gray-400">
                    {formatDate(badge.earnedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="mt-6 space-y-2">
        {/* Total visits */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t("stats.total_visits")}</span>
          <span className="font-semibold text-gray-900">
            {stats.totalVisits}
          </span>
        </div>

        {/* Unique points visited */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t("stats.unique_points")}</span>
          <span className="font-semibold text-gray-900">
            {stats.uniquePointsVisited.length}
          </span>
        </div>

        {/* Categories recycled */}
        <div className="text-sm">
          <span className="text-gray-600">{t("stats.categories_recycled")}</span>
          {recycledCategories.length === 0 ? (
            <span className="ml-2 font-semibold text-gray-900">—</span>
          ) : (
            <ul className="mt-1 flex flex-wrap gap-2">
              {recycledCategories.map(([cat, count]) => (
                <li
                  key={cat}
                  className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5"
                >
                  <span aria-label={t(`category.${cat}`)}>
                    <CategoryIcon category={cat} className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-green-800">
                    {t(`category.${cat}`)}
                  </span>
                  <span className="text-xs text-green-600">×{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default AchievementPanel;
