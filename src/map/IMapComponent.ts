import type { LatLng, CollectionPoint } from "../types/index";

export interface IMapComponent {
  init(container: HTMLElement, center: LatLng, zoom: number): void;
  setLanguage(locale: string): void;
  setMarkers(points: CollectionPoint[]): void;
  panTo(latlng: LatLng, zoom?: number): void;
  fitRange(origin: LatLng, radiusMetres: number): void;
  getCenter(): LatLng | null;
  highlightMarker(id: string): void;
  openPopup(id: string): void;
  clearMarkers(): void;
  onMarkerClick(handler: (id: string) => void): void;
  onZoomChange(handler: (distanceMetres: number) => void): void;
  onViewportIdle(handler: (center: LatLng) => void): void;
  invalidateSize(): void;
  destroy(): void;
}
