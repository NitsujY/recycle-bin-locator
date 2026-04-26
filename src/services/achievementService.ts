import type {
  AchievementState,
  UserStats,
  EarnedBadge,
  VisitRecord,
} from "../types/index";
import { MaterialCategory, BADGE_DEFINITIONS } from "../types/index";

export const STORAGE_KEY = "rbl_achievements_v1";
export const SCHEMA_VERSION = 1;

/**
 * Returns a fresh empty AchievementState with all MaterialCategory counts
 * initialised to 0.
 */
export function initialState(): AchievementState {
  const categoriesRecycled = Object.values(MaterialCategory).reduce(
    (acc, cat) => {
      acc[cat] = 0;
      return acc;
    },
    {} as Record<MaterialCategory, number>
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    stats: {
      totalVisits: 0,
      uniquePointsVisited: [],
      categoriesRecycled,
    },
    earnedBadges: [],
    visitLog: [],
  };
}

/**
 * Validates and migrates raw localStorage data.
 * Returns initialState() if the data is missing, not an object, or has an
 * incompatible schemaVersion.
 */
export function migrateState(raw: unknown): AchievementState {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return initialState();
  }

  const state = raw as Record<string, unknown>;

  if (
    !("schemaVersion" in state) ||
    typeof state.schemaVersion !== "number" ||
    state.schemaVersion < 1
  ) {
    return initialState();
  }

  return raw as AchievementState;
}

/**
 * Reads from localStorage, parses JSON, and passes through migrateState().
 * Returns initialState() on any error.
 */
export function loadState(): AchievementState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return initialState();
    }
    const parsed: unknown = JSON.parse(raw);
    return migrateState(parsed);
  } catch {
    return initialState();
  }
}

/**
 * Writes state to localStorage.
 * On quota exceeded, logs a warning and continues in-memory (does not throw).
 */
export function saveState(state: AchievementState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      console.warn(
        "[AchievementService] localStorage quota exceeded — continuing in-memory.",
        err
      );
    } else {
      // Re-throw unexpected errors
      throw err;
    }
  }
}

/**
 * Logs a recycling visit, updates stats, evaluates badge conditions, saves
 * state, and returns any newly earned badges.
 */
export function logVisit(
  pointId: string,
  categories: MaterialCategory[]
): { newBadges: EarnedBadge[] } {
  const state = loadState();

  // Append VisitRecord
  const visitRecord: VisitRecord = {
    pointId,
    categories,
    visitedAt: new Date().toISOString(),
  };
  state.visitLog.push(visitRecord);

  // Update UserStats
  const stats: UserStats = state.stats;

  stats.totalVisits += 1;

  if (!stats.uniquePointsVisited.includes(pointId)) {
    stats.uniquePointsVisited.push(pointId);
  }

  for (const cat of categories) {
    stats.categoriesRecycled[cat] = (stats.categoriesRecycled[cat] ?? 0) + 1;
  }

  // Evaluate badge conditions
  const alreadyEarnedIds = new Set(state.earnedBadges.map((b) => b.badgeId));
  const newBadges: EarnedBadge[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (!alreadyEarnedIds.has(def.id) && def.condition(stats)) {
      const earned: EarnedBadge = {
        badgeId: def.id,
        earnedAt: new Date().toISOString(),
      };
      newBadges.push(earned);
      state.earnedBadges.push(earned);
    }
  }

  saveState(state);

  return { newBadges };
}

/**
 * Returns the current UserStats from localStorage.
 */
export function getStats(): UserStats {
  return loadState().stats;
}

/**
 * Returns the list of earned badges from localStorage.
 */
export function getEarnedBadges(): EarnedBadge[] {
  return loadState().earnedBadges;
}
