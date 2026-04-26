import { useEffect, useRef } from "react";
import type { IMapComponent } from "../../map/IMapComponent";
import type { LatLng, CollectionPoint } from "../../types/index";

interface MapContainerProps {
  adapter: IMapComponent;
  center: LatLng;
  zoom?: number;
  points?: CollectionPoint[];
  onMarkerClick?: (id: string) => void;
}

export function MapContainer({
  adapter,
  center,
  zoom = 13,
  points,
  onMarkerClick,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialise the map on mount and destroy on unmount
  useEffect(() => {
    if (!containerRef.current) return;

    adapter.init(containerRef.current, center, zoom);

    if (onMarkerClick) {
      adapter.onMarkerClick(onMarkerClick);
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

  return (
    <div
      ref={containerRef}
      className="w-full h-64 md:h-96"
      aria-label="Map showing recycling collection points"
      role="application"
    />
  );
}

export default MapContainer;
