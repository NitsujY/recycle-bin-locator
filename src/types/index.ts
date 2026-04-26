// Core geographic type
export interface LatLng {
  lat: number;
  lng: number;
}

// Material category — const object + derived union type (enum-equivalent, erasable)
export const MaterialCategory = {
  Paper: "paper",
  Plastic: "plastic",
  Glass: "glass",
  LightBulb: "light_bulb",
  Battery: "battery",
  Other: "other",
} as const;

export type MaterialCategory =
  (typeof MaterialCategory)[keyof typeof MaterialCategory];

// Opening hours types
export interface DayHours {
  days: string[];  // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri"]
  open: string;    // e.g. "09:00"
  close: string;   // e.g. "18:00"
}

export interface OpeningHours {
  raw?: string;              // Free-text from source (e.g. "Mon–Fri 9am–6pm")
  structured?: DayHours[];   // Parsed structured form if available
}

// Collection point — the core domain object
export interface CollectionPoint {
  id: string;                        // Unique identifier (source-prefixed, e.g. "epd-12345")
  name: string;                      // Display name
  nameZhHK?: string;                 // Traditional Chinese name if available from source
  coordinates: LatLng;
  acceptedCategories: MaterialCategory[];
  openingHours?: OpeningHours;       // Absent if not provided by source
  sourceId: string;                  // e.g. "hk-epd"
  lastUpdated: string;               // ISO 8601 date string from pipeline run
  distanceMetres?: number;           // Computed client-side, not stored in JSON
}

// Dataset manifest — top-level structure of the data repository JSON file
export interface DatasetManifest {
  generatedAt: string;               // ISO 8601 pipeline run timestamp
  sourceIds: string[];               // Sources included in this run
  totalPoints: number;
  points: CollectionPoint[];
}

// Achievement system types

export interface UserStats {
  totalVisits: number;
  uniquePointsVisited: string[];                        // Array of CollectionPoint ids (deduplicated)
  categoriesRecycled: Record<MaterialCategory, number>; // Count per category
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;  // ISO 8601
}

export interface VisitRecord {
  pointId: string;
  categories: MaterialCategory[];
  visitedAt: string;  // ISO 8601
}

export interface AchievementState {
  schemaVersion: number;   // 1 — for future migrations
  stats: UserStats;
  earnedBadges: EarnedBadge[];
  visitLog: VisitRecord[];
}

export interface BadgeDefinition {
  id: string;
  labelKey: string;    // i18n key
  iconPath: string;
  condition: (stats: UserStats) => boolean;
}

// Badge milestone definitions — static configuration, not stored in localStorage
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_visit",
    labelKey: "badge.first_visit",
    iconPath: "/icons/badges/first_visit.svg",
    condition: (s) => s.totalVisits >= 1,
  },
  {
    id: "visits_10",
    labelKey: "badge.visits_10",
    iconPath: "/icons/badges/visits_10.svg",
    condition: (s) => s.totalVisits >= 10,
  },
  {
    id: "visits_50",
    labelKey: "badge.visits_50",
    iconPath: "/icons/badges/visits_50.svg",
    condition: (s) => s.totalVisits >= 50,
  },
  {
    id: "explorer_5",
    labelKey: "badge.explorer_5",
    iconPath: "/icons/badges/explorer_5.svg",
    condition: (s) => s.uniquePointsVisited.length >= 5,
  },
  {
    id: "explorer_20",
    labelKey: "badge.explorer_20",
    iconPath: "/icons/badges/explorer_20.svg",
    condition: (s) => s.uniquePointsVisited.length >= 20,
  },
  {
    id: "all_categories",
    labelKey: "badge.all_categories",
    iconPath: "/icons/badges/all_categories.svg",
    condition: (s) => Object.values(s.categoriesRecycled).every((n) => n > 0),
  },
];

// Error types

export interface GeolocationError {
  code: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT";
  message: string;
}

export interface GeocodingError {
  message: string;
}
