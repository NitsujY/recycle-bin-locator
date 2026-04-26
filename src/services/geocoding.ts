import type { LatLng, GeocodingError } from "../types/index";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "RecycleBinLocator/1.0 (https://github.com/recycle-bin-locator)";
const MIN_REQUEST_GAP_MS = 1000;

// ---------------------------------------------------------------------------
// Rate-limiting request queue
// ---------------------------------------------------------------------------
// Nominatim usage policy requires at least 1 second between consecutive
// requests. We enforce this with a simple promise chain: each new request
// is appended to the tail of the chain and waits for the previous one to
// finish (plus a 1 000 ms delay) before it fires.

let requestQueue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = requestQueue.then(() => task());
  // Advance the queue tail: wait for this task to settle, then pause 1 s
  // before allowing the next request to proceed.
  requestQueue = result
    .then(
      () => delay(MIN_REQUEST_GAP_MS),
      () => delay(MIN_REQUEST_GAP_MS),
    );
  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Nominatim response shape (only the fields we care about)
// ---------------------------------------------------------------------------
interface NominatimResult {
  lat: string;
  lon: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Geocode a free-text address or place name using the Nominatim REST API.
 *
 * Requests are queued so that at least 1 000 ms elapses between consecutive
 * calls, complying with the Nominatim usage policy.
 *
 * @param query - Address or place name to geocode.
 * @returns The coordinates of the first matching result.
 * @throws {GeocodingError} When no results are found or a network error occurs.
 */
export async function geocode(query: string): Promise<LatLng> {
  return enqueue(() => _geocode(query));
}

async function _geocode(query: string): Promise<LatLng> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    });
  } catch (networkError) {
    const err: GeocodingError = {
      message:
        networkError instanceof Error
          ? networkError.message
          : "Network error while contacting geocoding service.",
    };
    throw err;
  }

  if (!response.ok) {
    const err: GeocodingError = {
      message: `Geocoding service returned HTTP ${response.status}.`,
    };
    throw err;
  }

  let results: NominatimResult[];
  try {
    results = (await response.json()) as NominatimResult[];
  } catch {
    const err: GeocodingError = {
      message: "Geocoding service returned an unexpected response format.",
    };
    throw err;
  }

  if (!Array.isArray(results) || results.length === 0) {
    const err: GeocodingError = {
      message: "Address not found. Please try a different search term.",
    };
    throw err;
  }

  const first = results[0];
  return {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
  };
}
