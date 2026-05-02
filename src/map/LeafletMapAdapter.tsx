import L from 'leaflet';
import 'leaflet.markercluster';
import type { IMapComponent } from './IMapComponent';
import type { CollectionPoint, LatLng } from '../types/index';
import { LocationType } from '../types/index';

import { renderToString } from 'react-dom/server';
import { CategoryIcon } from '../components/CategoryIcon/CategoryIcon';
import type { MaterialCategory } from '../types/index';

// Fix Leaflet default marker icon paths broken by Vite's asset bundling
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
});

// Per-location-type marker icons — official HK WRA recycling point icons (1–7).
// 1=bins, 2=public, 3=ngo, 4=spot, 5=street corner/station, 6=private, 7=smart
function makeIcon(filename: string): L.Icon {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return L.icon({
    iconUrl: `${base}/icons/${filename}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

const LOCATION_TYPE_ICONS: Record<string, L.Icon> = {
  [LocationType.Bin]:     makeIcon('recycling_point_1.png'),
  [LocationType.Public]:  makeIcon('recycling_point_2.png'),
  [LocationType.Ngo]:     makeIcon('recycling_point_3.png'),
  [LocationType.Spot]:    makeIcon('recycling_point_4.png'),
  [LocationType.Shop]:    makeIcon('recycling_point_5.png'),
  [LocationType.Station]: makeIcon('recycling_point_5.png'),
  [LocationType.Private]: makeIcon('recycling_point_6.png'),
  [LocationType.Smart]:   makeIcon('recycling_point_7.png'),
};
const DEFAULT_MARKER_ICON = makeIcon('recycling_point_2.png');

/**
 * Phase 1 map adapter — wraps Leaflet.js and implements IMapComponent.
 * All Leaflet imports are confined to this file; MapContainer only sees IMapComponent.
 *
 * Requirements: 13.1, 13.2, 13.4, 13.5
 */
export class LeafletMapAdapter implements IMapComponent {
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private clusterGroup: L.MarkerClusterGroup | null = null;
  private clickHandler: ((id: string) => void) | null = null;
  private viewportIdleHandler: ((center: LatLng) => void) | null = null;
  private zoomChangeHandler: ((distanceMetres: number) => void) | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private locale = 'en';
  private latestPoints: CollectionPoint[] = [];
  private openPopupId: string | null = null;
  private handleResize = () => {
    this.map?.invalidateSize();
  };

  /**
   * Initialise the Leaflet map inside `container`, centred on `center` at `zoom`.
   * Adds the OpenStreetMap tile layer with the required attribution.
   */
  init(container: HTMLElement, center: LatLng, zoom: number): void {
    this.map = L.map(container);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // Create cluster group with custom styling
    this.clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 60,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 36 : count < 100 ? 44 : 52;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            border-radius:50%;
            background:rgba(34,197,94,0.85);
            border:3px solid #16a34a;
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-weight:700;font-size:${size < 44 ? 13 : 15}px;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);">
            ${count}
          </div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });
    this.clusterGroup.addTo(this.map);

    this.map.setView([center.lat, center.lng], zoom);
    // Leaflet needs a size recalculation when container dimensions settle.
    setTimeout(() => this.map?.invalidateSize(), 0);
    window.addEventListener('resize', this.handleResize);

    this.map.on('moveend', () => {
      if (!this.map || !this.viewportIdleHandler) return;
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }
      this.idleTimer = setTimeout(() => {
        if (!this.map || !this.viewportIdleHandler) return;
        const centerNow = this.map.getCenter();
        this.viewportIdleHandler({ lat: centerNow.lat, lng: centerNow.lng });
      }, 1000);
    });

    // Zoom change listener for distance-based filtering — fires once after
    // the zoom animation settles (zoomend) to avoid flooding during animation.
    this.map.on('zoomend', () => {
      if (!this.map || !this.zoomChangeHandler) return;
      const zoomLevel = this.map.getZoom();
      // ~50 000 000 / 2^zoom gives a sensible radius in metres for HK latitude:
      // zoom 10 → ~48 km, zoom 12 → ~12 km, zoom 14 → ~3 km, zoom 16 → ~760 m
      const distance = Math.round(50000000 / Math.pow(2, zoomLevel));
      this.zoomChangeHandler(distance);
    });
  }

  setLanguage(locale: string): void {
    this.locale = locale;
    if (this.latestPoints.length > 0) {
      this.setMarkers(this.latestPoints);
    }
  }

  /**
   * Replace all current markers with new ones derived from `points`.
   * Each marker fires the registered click handler with the point's id.
   */
  setMarkers(points: CollectionPoint[]): void {
    if (!this.map) return;
    this.latestPoints = points;

    this.clearMarkers();

    for (const point of points) {
      const icon = (point.locationType && LOCATION_TYPE_ICONS[point.locationType])
        ?? DEFAULT_MARKER_ICON;
      const marker = L.marker([point.coordinates.lat, point.coordinates.lng], { icon });
      const markerLabel = this.locale === 'zh-HK' && point.nameZhHK ? point.nameZhHK : point.name;
      const categoriesHtml = point.acceptedCategories
        .map((cat) => {
          return renderToString(
            <div style={{ display: 'inline-block', padding: '2px', background: '#f3f4f6', borderRadius: '4px', margin: '2px 2px 0 0' }} title={cat}>
              <CategoryIcon category={cat as MaterialCategory} className="w-5 h-5" />
            </div>
          );
        })
        .join('');
      const hoursRaw = point.openingHours?.raw;
      const hoursLabel = this.locale === 'zh-HK' ? '⏰ 開放時間' : '⏰ Opening Hours';
      const hoursHtml = hoursRaw
        ? `<details style="margin-top:6px;padding-top:6px;border-top:1px solid #e5e7eb;text-align:left;">
            <summary style="cursor:pointer;font-size:11px;font-weight:600;color:#16a34a;list-style:none;display:flex;align-items:center;gap:4px;user-select:none;">
              <span style="font-size:10px;">▶</span>${hoursLabel}
            </summary>
            <p style="margin:5px 0 0;font-size:11px;color:#374151;white-space:pre-wrap;word-break:break-word;max-width:260px;">${hoursRaw.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </details>`
        : '';
      const tooltipHtml = `
        <div style="text-align:center;min-width:140px;max-width:280px;">
          <strong style="display:block;margin-bottom:4px;white-space:normal;">${markerLabel}</strong>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;">
            ${categoriesHtml}
          </div>
          ${hoursHtml}
        </div>
      `;

      marker.bindPopup(tooltipHtml, {
        offset: [0, -10],
        maxWidth: 300,
      });

      marker.on('click', (e) => {
        // Stop map click from firing first (which would close the popup before the new one opens)
        L.DomEvent.stopPropagation(e);
        // Immediately open this popup (close previous if different) before notifying app
        if (this.openPopupId !== point.id) {
          if (this.openPopupId !== null) {
            const prev = this.markers.get(this.openPopupId);
            if (prev) prev.closePopup();
          }
          marker.openPopup();
          this.openPopupId = point.id;
        }
        if (this.clickHandler) {
          this.clickHandler(point.id);
        }
      });

      this.markers.set(point.id, marker);
    }

    // Add all markers to cluster group in one batch for performance
    if (this.clusterGroup) {
      this.clusterGroup.addLayers(Array.from(this.markers.values()));
    }
  }

  /**
   * Pan the map to `latlng`. Optionally set the zoom level.
   */
  panTo(latlng: LatLng, zoom?: number): void {
    if (!this.map) return;

    this.map.panTo([latlng.lat, latlng.lng]);

    if (zoom !== undefined) {
      this.map.setZoom(zoom);
    }
  }

  fitRange(origin: LatLng, radiusMetres: number): void {
    if (!this.map) return;
    const center = L.latLng(origin.lat, origin.lng);
    // toBounds creates a square bounds of the given size in meters.
    // So size should be diameter (radius * 2)
    const bounds = center.toBounds(radiusMetres * 2);
    this.map.fitBounds(bounds, { padding: [20, 20] });
  }

  getCenter(): LatLng | null {
    if (!this.map) return null;
    const center = this.map.getCenter();
    return { lat: center.lat, lng: center.lng };
  }

  /**
   * Toggle the `marker-highlighted` CSS class on marker icon elements.
   * The target marker gains the class; all others lose it.
   */
  highlightMarker(id: string): void {
    if (!this.map) return;

    for (const [markerId, marker] of this.markers) {
      const el = marker.getElement();
      if (!el) continue;

      if (markerId === id) {
        el.classList.add('marker-highlighted');
      } else {
        el.classList.remove('marker-highlighted');
      }
    }
  }

  openPopup(id: string): void {
    if (!this.map) return;
    if (this.openPopupId === id) return; // already open, nothing to do
    if (this.openPopupId !== null) {
      const prev = this.markers.get(this.openPopupId);
      if (prev) prev.closePopup();
    }
    const marker = this.markers.get(id);
    if (marker) {
      marker.openPopup();
      this.openPopupId = id;
    }
  }

  /**
   * Remove all markers from the map and clear the internal markers map.
   */
  clearMarkers(): void {
    if (!this.map) return;

    if (this.clusterGroup) {
      this.clusterGroup.clearLayers();
    }

    this.markers.clear();
    this.openPopupId = null;
  }

  /**
   * Register a handler that is called with the clicked marker's point id.
   * Must be called before `setMarkers` to take effect on existing markers.
   */
  onMarkerClick(handler: (id: string) => void): void {
    this.clickHandler = handler;
  }

  onViewportIdle(handler: (center: LatLng) => void): void {
    this.viewportIdleHandler = handler;
  }

  onZoomChange(handler: (distanceMetres: number) => void): void {
    this.zoomChangeHandler = handler;
  }

  invalidateSize(): void {
    this.map?.invalidateSize();
    requestAnimationFrame(() => this.map?.invalidateSize());
  }

  /**
   * Tear down the Leaflet map instance and release resources.
   */
  destroy(): void {
    if (!this.map) return;

    window.removeEventListener('resize', this.handleResize);
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.clusterGroup) {
      this.clusterGroup.clearLayers();
      this.clusterGroup = null;
    }
    this.map.remove();
    this.map = null;
    this.markers.clear();
    this.viewportIdleHandler = null;
  }
}
