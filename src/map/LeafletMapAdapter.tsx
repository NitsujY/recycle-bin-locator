import L from 'leaflet';
import type { IMapComponent } from './IMapComponent';
import type { CollectionPoint, LatLng } from '../types/index';

import { renderToString } from 'react-dom/server';
import { CategoryIcon } from '../components/CategoryIcon/CategoryIcon';
import type { MaterialCategory } from '../types/index';

/**
 * Phase 1 map adapter — wraps Leaflet.js and implements IMapComponent.
 * All Leaflet imports are confined to this file; MapContainer only sees IMapComponent.
 *
 * Requirements: 13.1, 13.2, 13.4, 13.5
 */
export class LeafletMapAdapter implements IMapComponent {
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private clickHandler: ((id: string) => void) | null = null;
  private viewportIdleHandler: ((center: LatLng) => void) | null = null;
  private zoomChangeHandler: ((distanceMetres: number) => void) | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private locale = 'en';
  private latestPoints: CollectionPoint[] = [];
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

    // Zoom change listener for distance-based filtering
    this.map.on('zoom', () => {
      if (!this.map || !this.zoomChangeHandler) return;
      const zoomLevel = this.map.getZoom();
      // Convert zoom level to approximate distance in metres
      // At zoom 10: ~50km, zoom 12: ~15km, zoom 14: ~5km, zoom 16: ~1.5km, zoom 18: ~500m, zoom 20: ~200m
      const distance = Math.round(40000000 / Math.pow(2, zoomLevel + 8));
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
      const marker = L.marker([point.coordinates.lat, point.coordinates.lng]);
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
      const tooltipHtml = `
        <div style="text-align: center; min-width: 120px;">
          <strong style="display:block; margin-bottom:4px; text-wrap: wrap;">${markerLabel}</strong>
          <div style="display:flex; flex-wrap:wrap; justify-content:center;">
            ${categoriesHtml}
          </div>
        </div>
      `;

      marker.bindPopup(tooltipHtml, {
        offset: [0, -10]
      });

      marker.on('click', () => {
        if (this.clickHandler) {
          this.clickHandler(point.id);
        }
      });

      marker.addTo(this.map);
      this.markers.set(point.id, marker);
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
    const marker = this.markers.get(id);
    if (marker) {
      marker.openPopup();
    }
  }

  /**
   * Remove all markers from the map and clear the internal markers map.
   */
  clearMarkers(): void {
    if (!this.map) return;

    for (const marker of this.markers.values()) {
      marker.remove();
    }

    this.markers.clear();
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
    this.map.remove();
    this.map = null;
    this.markers.clear();
    this.viewportIdleHandler = null;
  }
}
