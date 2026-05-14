"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

import type { AircraftState } from "@/types/aircraft";
import { MAX_VISIBLE_AIRCRAFT_MARKERS_ON_MAP } from "@/types/live-flights";

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 3;

const METERS_TO_FEET = 3.280_839_895;
const MS_TO_KNOTS = 1.943_844_494;

function formatAltitude(aircraft: AircraftState): string {
  const meters = aircraft.baroAltitude ?? aircraft.geoAltitude;
  if (meters === null) return "—";
  const feet = Math.round(meters * METERS_TO_FEET);
  const source =
    aircraft.baroAltitude !== null
      ? "barometric"
      : aircraft.geoAltitude !== null
        ? "geometric"
        : "unknown";
  return `${feet.toLocaleString()} ft (${Math.round(meters)} m, ${source})`;
}

function formatSpeed(velocityMs: number | null): string {
  if (velocityMs === null) return "—";
  const knots = velocityMs * MS_TO_KNOTS;
  return `${Math.round(knots)} kt`;
}

function formatHeading(trueTrack: number | null): string {
  if (trueTrack === null) return "—";
  return `${Math.round(trueTrack)}°`;
}

function AircraftPopupContent({ aircraft }: { aircraft: AircraftState }) {
  const callsign = aircraft.callsign?.trim() || "—";
  const onGround = aircraft.onGround ? "Yes" : "No";

  return (
    <div className="min-w-[220px] text-xs leading-snug">
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-muted-foreground">
        <dt>Callsign</dt>
        <dd className="text-foreground">{callsign}</dd>
        <dt>ICAO24</dt>
        <dd className="text-foreground">{aircraft.icao24}</dd>
        <dt>Country</dt>
        <dd className="text-foreground">{aircraft.originCountry}</dd>
        <dt>Altitude</dt>
        <dd className="text-foreground">{formatAltitude(aircraft)}</dd>
        <dt>Speed</dt>
        <dd className="text-foreground">{formatSpeed(aircraft.velocity)}</dd>
        <dt>Heading</dt>
        <dd className="text-foreground">{formatHeading(aircraft.trueTrack)}</dd>
        <dt>On ground</dt>
        <dd className="text-foreground">{onGround}</dd>
      </dl>
    </div>
  );
}

type LiveFlightsMapProps = {
  aircraft: AircraftState[];
};

export function LiveFlightsMap({ aircraft }: LiveFlightsMapProps) {
  const visible = aircraft.slice(0, MAX_VISIBLE_AIRCRAFT_MARKERS_ON_MAP);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full z-0 [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {visible.map((ac) => {
        if (ac.latitude === null || ac.longitude === null) return null;
        return (
          <CircleMarker
            key={ac.icao24}
            center={[ac.latitude, ac.longitude]}
            radius={5}
            pathOptions={{
              color: "#1d4ed8",
              weight: 1,
              fillColor: "#3b82f6",
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <AircraftPopupContent aircraft={ac} />
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
