import type { CollectionPoint, LatLng } from "../types/index";
import { MaterialCategory } from "../types/index";

const EARTH_RADIUS_METRES = 6_371_000;

/**
 * Computes the Haversine distance in metres between two lat/lng points.
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const deltaLat = toRad(b.lat - a.lat);
  const deltaLng = toRad(b.lng - a.lng);

  const sinHalfDeltaLat = Math.sin(deltaLat / 2);
  const sinHalfDeltaLng = Math.sin(deltaLng / 2);

  const aVal =
    sinHalfDeltaLat * sinHalfDeltaLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfDeltaLng * sinHalfDeltaLng;

  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));

  return EARTH_RADIUS_METRES * c;
}

/**
 * Returns a new array of CollectionPoints sorted by ascending haversine distance
 * from the given origin. Each returned point has `distanceMetres` set.
 * The input array is not mutated.
 */
export function sortByDistance(
  points: CollectionPoint[],
  origin: LatLng
): CollectionPoint[] {
  return points
    .map((point) => ({
      ...point,
      distanceMetres: haversineDistance(point.coordinates, origin),
    }))
    .sort((a, b) => (a.distanceMetres ?? 0) - (b.distanceMetres ?? 0));
}

/**
 * Filters CollectionPoints by the given set of MaterialCategories.
 * - If `categories` is empty, all points are returned unchanged.
 * - Otherwise, only points whose `acceptedCategories` contains at least one
 *   category from the set are returned.
 */
export function filterByCategories(
  points: CollectionPoint[],
  categories: Set<MaterialCategory>
): CollectionPoint[] {
  if (categories.size === 0) {
    return points;
  }

  return points.filter((point) =>
    point.acceptedCategories.some((cat) => {
      if (categories.has(cat)) {
        return true;
      }

      // Backward compatibility: older snapshots used "other" for metal bins.
      return cat === MaterialCategory.Other && categories.has(MaterialCategory.Metal);
    })
  );
}
