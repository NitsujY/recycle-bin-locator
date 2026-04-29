import type { CollectionPoint, DatasetManifest } from "../types/index";

export interface DatasetResult {
  points: CollectionPoint[];
  generatedAt: string;
  sourceIds: string[];
  totalPoints: number;
}

/**
 * URL of the normalised dataset JSON file in the data repository.
 * Configurable to allow pointing at a different host (e.g. GitHub Pages vs Raw).
 *
 * For local development: use the local public folder copy.
 * For production: set to the GitHub raw URL of your data repository, e.g.:
 *   "https://raw.githubusercontent.com/YOUR_USERNAME/recycle-bin-locator-data/main/data/collection_points.json"
 *
 * Requirements: 6.1, 6.2
 */
export const DATA_REPO_URL = `${import.meta.env.BASE_URL}collection_points.json`;
export const RESOLVED_DATA_REPO_URL =
  import.meta.env.VITE_DATA_REPO_URL ?? DATA_REPO_URL;

/**
 * Cache time-to-live in milliseconds (default: 1 hour).
 *
 * Requirements: 6.3
 */
export const CACHE_TTL_MS = 3_600_000;

/**
 * localStorage key used to store the cached dataset.
 *
 * Requirements: 6.3
 */
export const CACHE_KEY = "rbl_dataset_cache";

/** Shape of the value stored in localStorage under CACHE_KEY. */
interface CacheEntry {
  points: CollectionPoint[];
  generatedAt: string;
  sourceIds: string[];
  totalPoints: number;
  cachedAt: number;
}

/**
 * Safely reads the cache entry from localStorage.
 * Returns null if localStorage is unavailable or the entry is missing/malformed.
 */
function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (
      !Array.isArray(parsed.points) ||
      typeof parsed.cachedAt !== "number" ||
      typeof parsed.generatedAt !== "string" ||
      !Array.isArray(parsed.sourceIds)
    ) {
      // Invalidate stale cache entries from older app versions
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    // localStorage blocked (e.g. private browsing with strict settings) or JSON parse error
    return null;
  }
}

/**
 * Safely writes a cache entry to localStorage.
 * Silently ignores errors (e.g. quota exceeded, storage blocked).
 */
function writeCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Quota exceeded or storage blocked — continue without caching
  }
}

/**
 * Fetches the collection points dataset from the data repository.
 *
 * Behaviour:
 * 1. If a fresh cache entry exists (within CACHE_TTL_MS), return it immediately.
 * 2. Otherwise, fetch from DATA_REPO_URL, parse the DatasetManifest, cache the
 *    result, and return the points array.
 * 3. On network failure, fall back to a stale cache entry if one exists.
 * 4. On network failure with no cache at all, throw an error whose message
 *    matches the i18n key `error.data.unavailable`.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export async function fetchDataset(): Promise<DatasetResult> {
  // Step 1: Check for a fresh cache hit
  const cached = readCache();
  if (cached !== null && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { points: cached.points, generatedAt: cached.generatedAt, sourceIds: cached.sourceIds, totalPoints: cached.totalPoints };
  }

  // Step 2: Attempt a network fetch
  try {
    const response = await fetch(RESOLVED_DATA_REPO_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const manifest = (await response.json()) as DatasetManifest;
    const points = manifest.points;

    // Step 3: Store fresh data in cache
    writeCache({ points, generatedAt: manifest.generatedAt, sourceIds: manifest.sourceIds, totalPoints: manifest.totalPoints, cachedAt: Date.now() });

    return { points, generatedAt: manifest.generatedAt, sourceIds: manifest.sourceIds, totalPoints: manifest.totalPoints };
  } catch (networkError) {
    // Step 4a: Network failure — fall back to stale cache if available
    if (cached !== null) {
      return { points: cached.points, generatedAt: cached.generatedAt, sourceIds: cached.sourceIds, totalPoints: cached.totalPoints };
    }

    // Step 4b: No cache at all — surface a user-facing error
    throw new Error("error.data.unavailable");
  }
}
