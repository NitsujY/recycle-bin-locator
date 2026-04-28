import { useTranslation } from "react-i18next";
import type { CollectionPoint } from "../../types/index";
import { CollectionPointCard } from "../CollectionPointCard/CollectionPointCard";

// ─── Public API ──────────────────────────────────────────────────────────────

export interface CollectionPointListProps {
  points: CollectionPoint[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

/**
 * Animated grey placeholder that mimics the shape of a `CollectionPointCard`
 * while data is loading.
 */
function SkeletonCard() {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse"
      aria-hidden="true"
    >
      {/* Name + distance row */}
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-4 w-12 rounded-full bg-gray-200" />
      </div>

      {/* Category icons row */}
      <div className="mt-2 flex gap-1">
        <div className="h-6 w-6 rounded bg-gray-200" />
        <div className="h-6 w-6 rounded bg-gray-200" />
        <div className="h-6 w-6 rounded bg-gray-200" />
      </div>

      {/* Button placeholder */}
      <div className="mt-3 h-8 w-full rounded-lg bg-gray-200" />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Renders a scrollable, ranked list of `CollectionPointCard` components.
 *
 * - While `isLoading` is true, renders 5 skeleton loading cards.
 * - When not loading and `points` is empty, shows the
 *   `collection_point.no_results_nearby` i18n message.
 * - Otherwise renders one `CollectionPointCard` per point, forwarding
 *   `isSelected` and an `onClick` that calls `onSelect(point.id)`.
 */
export function CollectionPointList({
  points,
  selectedId,
  onSelect,
  isLoading = false,
}: CollectionPointListProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {/* ── Loading state: 5 skeleton cards ── */}
      {isLoading && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </>
      )}

      {/* ── Empty state ── */}
      {!isLoading && points.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">
          {t("collection_point.no_results_nearby")}
        </p>
      )}

      {/* ── Point list ── */}
      {!isLoading &&
        points.map((point) => (
          <div
            key={point.id}
            data-point-id={point.id}
            onClick={() => onSelect(point.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(point.id);
              }
            }}
            className={point.id === selectedId ? "cursor-pointer rounded-xl bg-green-50" : "cursor-pointer"}
          >
            <CollectionPointCard
              point={point}
              isSelected={point.id === selectedId}
            />
          </div>
        ))}
    </div>
  );
}

export default CollectionPointList;
