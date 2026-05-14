"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { USER_MAP_VIEW_RADIUS_MILES } from "@/hooks/useBrowserGeolocation";
import {
  formatAircraftAltitudeSummary,
  formatBooleanStatus,
  formatCallsign,
  formatHeading,
  formatSpeed,
} from "@/lib/formatting/aircraft";
import type { AircraftState } from "@/types/aircraft";
import { MAX_VISIBLE_AIRCRAFT_MARKERS_ON_MAP } from "@/types/live-flights";

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 3;

function boundsForRadiusMiles(
  centerLat: number,
  centerLng: number,
  radiusMiles: number,
): L.LatLngBounds {
  const latitudeRadians = (centerLat * Math.PI) / 180;
  const cosLat = Math.max(Math.abs(Math.cos(latitudeRadians)), 0.08);
  const deltaLatDegrees = radiusMiles / 69;
  const deltaLngDegrees = radiusMiles / (69 * cosLat);
  const south = Math.max(-90, centerLat - deltaLatDegrees);
  const north = Math.min(90, centerLat + deltaLatDegrees);
  const west = centerLng - deltaLngDegrees;
  const east = centerLng + deltaLngDegrees;
  return L.latLngBounds(L.latLng(south, west), L.latLng(north, east));
}

function UserLocationFitOnce({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (hasFittedRef.current) return;
    hasFittedRef.current = true;

    const bounds = boundsForRadiusMiles(lat, lng, USER_MAP_VIEW_RADIUS_MILES);
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, lat, lng]);

  return null;
}

function AircraftPopupContent({ aircraft }: { aircraft: AircraftState }) {
  const callsign = formatCallsign(aircraft.callsign);
  const onGround = formatBooleanStatus(aircraft.onGround);
  const href = `/aircraft/${aircraft.icao24.toLowerCase()}`;

  return (
    <div className="min-w-[220px] space-y-2 text-xs leading-snug">
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-muted-foreground">
        <dt>Callsign</dt>
        <dd className="text-foreground">{callsign}</dd>
        <dt>ICAO24</dt>
        <dd className="text-foreground">{aircraft.icao24}</dd>
        <dt>Country</dt>
        <dd className="text-foreground">{aircraft.originCountry}</dd>
        <dt>Altitude</dt>
        <dd className="text-foreground">
          {formatAircraftAltitudeSummary(aircraft)}
        </dd>
        <dt>Speed</dt>
        <dd className="text-foreground">{formatSpeed(aircraft.velocity)}</dd>
        <dt>Heading</dt>
        <dd className="text-foreground">{formatHeading(aircraft.trueTrack)}</dd>
        <dt>On ground</dt>
        <dd className="text-foreground">{onGround}</dd>
      </dl>
      <Link
        href={href}
        className="inline-block text-primary underline-offset-4 hover:underline"
      >
        View aircraft details
      </Link>
    </div>
  );
}

type LiveFlightsMapProps = {
  aircraft: AircraftState[];
  userLocation: { lat: number; lng: number } | null;
};

export function LiveFlightsMap({ aircraft, userLocation }: LiveFlightsMapProps) {
  const visible = aircraft.slice(0, MAX_VISIBLE_AIRCRAFT_MARKERS_ON_MAP);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full z-0 [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full"
      scrollWheelZoom
    >
      {userLocation ? (
        <UserLocationFitOnce lat={userLocation.lat} lng={userLocation.lng} />
      ) : null}
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
