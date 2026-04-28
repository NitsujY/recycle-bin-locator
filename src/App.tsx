import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAppStore } from './store/index';
import { requestPosition } from './services/geolocation';
import { fetchDataset } from './services/dataRepository';
import { geocode } from './services/geocoding';
import { filterByCategories, sortByDistance } from './services/filterService';
import { LeafletMapAdapter } from './map/LeafletMapAdapter';
import type { IMapComponent } from './map/IMapComponent';
import { MotivationBanner } from './components/MotivationBanner/MotivationBanner';
import { LanguageToggle } from './components/LanguageToggle/LanguageToggle';
import { SearchBar } from './components/SearchBar/SearchBar';
import { CategorySelector } from './components/CategorySelector/CategorySelector';
import { DistanceFilter } from './components/DistanceFilter/DistanceFilter';
import { CollectionPointList } from './components/CollectionPointList/CollectionPointList';
import { MapContainer } from './components/MapContainer/MapContainer';
// Side-effect import to initialise i18next
import './i18n/index';
import type { MaterialCategory } from './types/index';

const DEFAULT_MAP_CENTER = { lat: 22.3193, lng: 114.1694 };

function App() {
  const { t, i18n } = useTranslation();
  const store = useAppStore();
  const mapAdapterRef = useRef<IMapComponent>(new LeafletMapAdapter());
  const [distanceRangeMetres, setDistanceRangeMetres] = useState(100);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);

  useEffect(() => {
    mapAdapterRef.current.setLanguage(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', isMapExpanded);
    return () => document.body.classList.remove('overflow-hidden');
  }, [isMapExpanded]);

  useEffect(() => {
    if (store.allPoints.length === 0) return;

    const categoryFiltered = filterByCategories(
      store.allPoints,
      store.selectedCategories,
    );

    const origin = store.userLocation ?? DEFAULT_MAP_CENTER;
    const sorted = sortByDistance(categoryFiltered, origin);
    const nextPoints = sorted.filter(
      (point) => (point.distanceMetres ?? Number.POSITIVE_INFINITY) <= distanceRangeMetres,
    );

    store.setFilteredPoints(nextPoints);
    mapAdapterRef.current.setMarkers(nextPoints);

    if (store.selectedPointId) {
      mapAdapterRef.current.highlightMarker(store.selectedPointId);
    }
  }, [
    distanceRangeMetres,
    distanceRangeMetres,
    store.allPoints,
    store.selectedCategories,
    store.selectedPointId,
    store.userLocation,
    store.setFilteredPoints,
  ]);

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
          store.setIsLoadingData(false);
          mapAdapterRef.current.fitRange(location, distanceRangeMetres);
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
            store.setIsLoadingData(false);
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
    },
    [store.setCategories],
  );

  // ── Search flow (task 10.4) ───────────────────────────────────────────────
  const handleSearch = useCallback(
    (query: string) => {
      store.setSearchError(null);
      
      // Auto expand drawer on successful search initiation
      if (query.trim().length > 0) {
        setIsListExpanded(true);
      }

      geocode(query)
        .then((location) => {
          store.setLocation(location);
          mapAdapterRef.current.panTo(location, 16);
          mapAdapterRef.current.fitRange(location, distanceRangeMetres);
        })
        .catch(() => {
          store.setSearchError(t('error.geocoding.notfound'));
        });
    },
    [store.setLocation, store.setSearchError, t, distanceRangeMetres],
  );

  // ── Map ↔ list synchronisation (task 10.5) ────────────────────────────────
  const handleSelectPoint = useCallback(
    (id: string) => {
      store.setSelectedPoint(id);
      const point = store.filteredPoints.find((p) => p.id === id);
      if (point) {
        mapAdapterRef.current.panTo(point.coordinates, 18);
        mapAdapterRef.current.highlightMarker(id);
        mapAdapterRef.current.openPopup(id);
        
        // Auto close the drawer on mobile when an item is selected so they can see the map detail
        if (window.innerWidth < 1024) {
          setIsListExpanded(false);
        }
      }
    },
    [store.filteredPoints],
  );

  const handleMarkerClick = useCallback((id: string) => {
    store.setSelectedPoint(id);
    mapAdapterRef.current.highlightMarker(id);
    mapAdapterRef.current.openPopup(id);
    // Scroll the matching card into view using a data attribute
    const el = document.querySelector(`[data-point-id="${id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [store.setSelectedPoint]);

  const handleViewportIdle = useCallback((center: { lat: number; lng: number }) => {
    store.setLocation(center);
  }, [store.setLocation]);

  const handleZoomChange = useCallback((distanceMetres: number) => {
    // Auto-update the distance range based on zoom level
    // Only update if the zoom-based distance is significantly different
    const minDistance = 500;
    const maxDistance = 50000;
    const clampedDistance = Math.max(minDistance, Math.min(maxDistance, distanceMetres));
    setDistanceRangeMetres(clampedDistance);
  }, []);
const handleDistanceChange = useCallback((val: number) => {
    setDistanceRangeMetres(val);
    const origin = store.userLocation ?? DEFAULT_MAP_CENTER;
    mapAdapterRef.current.fitRange(origin, val);
  }, [store.userLocation]);

  
  // Default map center (Hong Kong)
  const mapCenter = store.userLocation ?? DEFAULT_MAP_CENTER;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Motivation Banner */}
      <MotivationBanner />

      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-green-700">{t('app.title')}</h1>
        <LanguageToggle />
      </header>

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

          <section
            className={isMapExpanded
              ? "fixed inset-0 z-[900] flex flex-col bg-gray-100 p-2 sm:p-4"
              : "rounded-xl border border-gray-200 bg-white p-2 shadow-sm flex-1 flex flex-col"}
          >
            <div className="mb-2 flex flex-col gap-2">
              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => setIsListExpanded(true)}
                  className="shrink-0 flex items-center justify-center rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
                  aria-label={t("map.show_list", "Show locations list")}
                >
                  <ListBulletIcon className="h-5 w-5" />
                  <span className="hidden sm:inline ml-2 text-sm font-medium">{t("map.show_list", "Locations")}</span>
                </button>
                <div className="flex-1">
                  <SearchBar
                    onSearch={handleSearch}
                    error={store.searchError ?? undefined}
                  />
                </div>
              </div>
              <div className="flex w-full">
                <CategorySelector onFilterReady={handleFilterReady} />
              </div>
            </div>

            <div className={`relative ${isMapExpanded ? "flex-1 flex flex-col w-full h-full" : "h-80 md:h-[60vh] min-h-[400px]"}`}>
              <MapContainer
                adapter={mapAdapterRef.current}
                center={mapCenter}
                points={store.filteredPoints}
                onMarkerClick={handleMarkerClick}
                onZoomChange={handleZoomChange}
                onViewportIdle={handleViewportIdle}
                isExpanded={true} // MapContainer should always fill its relative wrapper now
              />
              
              {/* Distance Filter on Map Overlay */}
              <div className="absolute bottom-4 left-2 z-[400]">
                <DistanceFilter
                  value={distanceRangeMetres}
                  onChange={handleDistanceChange}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsMapExpanded((prev) => !prev)}
                title={isMapExpanded ? t('map.exit_fullscreen', 'Exit full view') : t('map.enter_fullscreen', 'Full view')}
                className="absolute top-2 right-2 z-[400] flex items-center justify-center rounded bg-white p-2 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {isMapExpanded ? (
                  <ArrowsPointingInIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
                )}
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Slide-out Panel for Location List */}
      <div 
        className={`fixed inset-y-0 left-0 z-[1000] w-80 max-w-full bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isListExpanded ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">{t("app.title", "Recycle Bin Locator")}</h2>
            <button 
              onClick={() => setIsListExpanded(false)} 
              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CollectionPointList
              points={store.filteredPoints}
              selectedId={store.selectedPointId ?? undefined}
              onSelect={(id) => {
                handleSelectPoint(id);
                if (window.innerWidth < 768) {
                    setIsListExpanded(false);
                }
              }}
              isLoading={store.isLoadingData}
            />
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {isListExpanded && (
        <div 
          className="fixed inset-0 z-[950] bg-black/30 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsListExpanded(false)} 
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default App;
