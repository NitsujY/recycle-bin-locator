import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from './store/index';
import { requestPosition } from './services/geolocation';
import { fetchDataset } from './services/dataRepository';
import { geocode } from './services/geocoding';
import { filterByCategories, sortByDistance } from './services/filterService';
import { logVisit } from './services/achievementService';
import { LeafletMapAdapter } from './map/LeafletMapAdapter';
import type { IMapComponent } from './map/IMapComponent';
import { MotivationBanner } from './components/MotivationBanner/MotivationBanner';
import { LanguageToggle } from './components/LanguageToggle/LanguageToggle';
import { SearchBar } from './components/SearchBar/SearchBar';
import { CategorySelector } from './components/CategorySelector/CategorySelector';
import { CollectionPointList } from './components/CollectionPointList/CollectionPointList';
import { MapContainer } from './components/MapContainer/MapContainer';
import { AchievementPanel } from './components/AchievementPanel/AchievementPanel';
// Side-effect import to initialise i18next
import './i18n/index';
import type { CollectionPoint, MaterialCategory, EarnedBadge } from './types/index';

function App() {
  const { t } = useTranslation();
  const store = useAppStore();
  const mapAdapterRef = useRef<IMapComponent>(new LeafletMapAdapter());
  const [achievementNotification, setAchievementNotification] = useState<EarnedBadge[]>([]);

  // ── Startup sequence (task 10.2) ──────────────────────────────────────────
  useEffect(() => {
    store.setIsLoadingLocation(true);

    requestPosition()
      .then((position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        store.setLocation(location);
        store.setIsLoadingLocation(false);

        // Fetch dataset and sort by distance
        store.setIsLoadingData(true);
        return fetchDataset().then((points) => {
          store.setAllPoints(points);
          const sorted = sortByDistance(points, location);
          store.setFilteredPoints(sorted);
          store.setIsLoadingData(false);
          mapAdapterRef.current.setMarkers(sorted);
        });
      })
      .catch((geoError) => {
        // Geolocation failed — show error, fetch data without sorting
        store.setIsLoadingLocation(false);
        if (geoError.code === 'PERMISSION_DENIED') {
          store.setLocationError(t('error.geolocation.denied'));
        } else {
          store.setLocationError(t('error.geolocation.timeout'));
        }

        store.setIsLoadingData(true);
        fetchDataset()
          .then((points) => {
            store.setAllPoints(points);
            store.setFilteredPoints(points);
            store.setIsLoadingData(false);
            mapAdapterRef.current.setMarkers(points);
          })
          .catch(() => {
            store.setDataError(t('error.data.unavailable'));
            store.setIsLoadingData(false);
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Category filter flow (task 10.3) ──────────────────────────────────────
  const handleFilterReady = useCallback(
    (cats: Set<MaterialCategory>) => {
      store.setCategories(cats);
      const filtered = filterByCategories(store.allPoints, cats);
      const sorted = store.userLocation
        ? sortByDistance(filtered, store.userLocation)
        : filtered;
      store.setFilteredPoints(sorted);
      mapAdapterRef.current.setMarkers(sorted);
    },
    [store],
  );

  // ── Search flow (task 10.4) ───────────────────────────────────────────────
  const handleSearch = useCallback(
    (query: string) => {
      store.setSearchError(null);
      geocode(query)
        .then((location) => {
          store.setLocation(location);
          const filtered = filterByCategories(
            store.allPoints,
            store.selectedCategories,
          );
          const sorted = sortByDistance(filtered, location);
          store.setFilteredPoints(sorted);
          mapAdapterRef.current.panTo(location);
          mapAdapterRef.current.setMarkers(sorted);
        })
        .catch(() => {
          store.setSearchError(t('error.geocoding.notfound'));
        });
    },
    [store.allPoints, store.selectedCategories],
  );

  // ── Map ↔ list synchronisation (task 10.5) ────────────────────────────────
  const handleSelectPoint = useCallback(
    (id: string) => {
      store.setSelectedPoint(id);
      const point = store.filteredPoints.find((p) => p.id === id);
      if (point) {
        mapAdapterRef.current.panTo(point.coordinates);
        mapAdapterRef.current.highlightMarker(id);
      }
    },
    [store.filteredPoints],
  );

  const handleMarkerClick = useCallback((id: string) => {
    store.setSelectedPoint(id);
    // Scroll the matching card into view using a data attribute
    const el = document.querySelector(`[data-point-id="${id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  // ── Achievement flow (task 10.6) ──────────────────────────────────────────
  const handleLogVisit = useCallback((point: CollectionPoint) => {
    const { newBadges } = logVisit(point.id, point.acceptedCategories);
    store.incrementAchievementRefreshKey();
    if (newBadges.length > 0) {
      setAchievementNotification(newBadges);
      setTimeout(() => setAchievementNotification([]), 4000);
    }
  }, []);

  // Default map center (Hong Kong)
  const mapCenter = store.userLocation ?? { lat: 22.3193, lng: 114.1694 };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Motivation Banner */}
      <MotivationBanner />

      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-green-700">{t('app.title')}</h1>
        <LanguageToggle />
      </header>

      {/* Achievement notification toast */}
      {achievementNotification.length > 0 && (
        <div className="fixed top-16 right-4 z-50 bg-green-600 text-white rounded-lg px-4 py-3 shadow-lg">
          {achievementNotification.map((badge) => (
            <p key={badge.badgeId}>
              {t('achievement.earned', { name: t(badge.badgeId) })}
            </p>
          ))}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 gap-4">
          {/* Location error */}
          {store.locationError && (
            <p className="text-sm text-amber-600 bg-amber-50 rounded p-2">
              {store.locationError}
            </p>
          )}

          {/* Data error */}
          {store.dataError && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">
              {store.dataError}
            </p>
          )}

          <section className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            <MapContainer
              adapter={mapAdapterRef.current}
              center={mapCenter}
              points={store.filteredPoints}
              onMarkerClick={handleMarkerClick}
            />

            <div className="absolute left-4 right-4 top-4 z-[500] flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="flex-1 rounded-lg bg-white/95 p-2 shadow">
                <SearchBar
                  onSearch={handleSearch}
                  error={store.searchError ?? undefined}
                />
              </div>
              <div className="self-start rounded-lg bg-white/95 p-2 shadow">
                <CategorySelector onFilterReady={handleFilterReady} />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <CollectionPointList
              points={store.filteredPoints}
              selectedId={store.selectedPointId ?? undefined}
              onSelect={handleSelectPoint}
              onLogVisit={handleLogVisit}
              isLoading={store.isLoadingData}
            />
            <AchievementPanel refreshKey={store.achievementRefreshKey} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
