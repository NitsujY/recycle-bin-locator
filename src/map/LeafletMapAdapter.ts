import L from 'leaflet';
import type { IMapComponent } from './IMapComponent';
import type { CollectionPoint, LatLng } from '../types/index';

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
  }

  /**
   * Replace all current markers with new ones derived from `points`.
   * Each marker fires the registered click handler with the point's id.
   */
  setMarkers(points: CollectionPoint[]): void {
    if (!this.map) return;

    this.clearMarkers();

    for (const point of points) {
      const marker = L.marker([point.coordinates.lat, point.coordinates.lng]);

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

  /**
   * Tear down the Leaflet map instance and release resources.
   */
  destroy(): void {
    if (!this.map) return;

    window.removeEventListener('resize', this.handleResize);
    this.map.remove();
    this.map = null;
    this.markers.clear();
  }
}
