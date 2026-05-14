"use client";

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";

type AircraftPositionMapProps = {
  latitude: number;
  longitude: number;
};

export function AircraftPositionMap({
  latitude,
  longitude,
}: AircraftPositionMapProps) {
  const center: [number, number] = [latitude, longitude];

  return (
    <div className="h-[240px] w-full overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <MapContainer
        center={center}
        zoom={8}
        className="h-full w-full z-0 [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full"
        scrollWheelZoom={false}
        dragging
        doubleClickZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={center}
          radius={8}
          pathOptions={{
            color: "#1d4ed8",
            weight: 1,
            fillColor: "#3b82f6",
            fillOpacity: 0.9,
          }}
        />
      </MapContainer>
    </div>
  );
}
