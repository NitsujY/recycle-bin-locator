import type { LatLng, CollectionPoint } from "../types/index";

export interface IMapComponent {
  init(container: HTMLElement, center: LatLng, zoom: number): void;
  setMarkers(points: CollectionPoint[]): void;
  panTo(latlng: LatLng, zoom?: number): void;
  highlightMarker(id: string): void;
  clearMarkers(): void;
  onMarkerClick(handler: (id: string) => void): void;
  destroy(): void;
}
