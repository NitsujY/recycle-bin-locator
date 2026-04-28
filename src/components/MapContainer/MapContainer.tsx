import { useEffect, useRef } from "react";
import type { IMapComponent } from "../../map/IMapComponent";
import type { LatLng, CollectionPoint } from "../../types/index";

interface MapContainerProps {
  adapter: IMapComponent;
  center: LatLng;
  zoom?: number;
  points?: CollectionPoint[];
  onMarkerClick?: (id: string) => void;
  onZoomChange?: (distanceMetres: number) => void;
  onViewportIdle?: (center: LatLng) => void;
  isExpanded?: boolean;
}

export function MapContainer({
  adapter,
  center,
  zoom = 13,
  points,
  onMarkerClick,
  onZoomChange,
  onViewportIdle,
  isExpanded = false,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialise the map on mount and destroy on unmount
  useEffect(() => {
    if (!containerRef.current) return;

    adapter.init(containerRef.current, center, zoom);

    if (onMarkerClick) {
      adapter.onMarkerClick(onMarkerClick);
    }
    if (onZoomChange) {
      adapter.onZoomChange(onZoomChange);
    }
    if (onViewportIdle) {
      adapter.onViewportIdle(onViewportIdle);
    }

    return () => {
      adapter.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers whenever the points prop changes
  useEffect(() => {
    if (points !== undefined) {
      adapter.setMarkers(points);
    }
  }, [adapter, points]);

  useEffect(() => {
    adapter.invalidateSize();
    const t1 = requestAnimationFrame(() => adapter.invalidateSize());
    const t2 = requestAnimationFrame(() => adapter.invalidateSize());
    return () => {
      cancelAnimationFrame(t1);
      cancelAnimationFrame(t2);
    };
  }, [adapter, isExpanded]);

  return (
    <div
      ref={containerRef}
      className={isExpanded ? "w-full flex-1 min-h-[60vh]" : "w-full h-80 md:h-[50vh] min-h-[320px]"}
      aria-label="Map showing recycling collection points"
      role="application"
    />
  );
}

export default MapContainer;
