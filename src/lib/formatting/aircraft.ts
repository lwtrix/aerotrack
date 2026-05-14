import type { AircraftState } from "@/types/aircraft";

const METERS_TO_FEET = 3.280_839_895;
const MS_TO_KNOTS = 1.943_844_494;
const MS_TO_FPM = 196.850_394; // metres per second → feet per minute

export const UNAVAILABLE = "Unavailable";

export function formatNullable<T>(
  value: T | null | undefined,
  format: (v: T) => string,
): string {
  if (value === null || value === undefined) {
    return UNAVAILABLE;
  }
  return format(value);
}

export function formatAltitude(meters: number | null): string {
  if (meters === null) return UNAVAILABLE;
  const feet = Math.round(meters * METERS_TO_FEET);
  return `${feet.toLocaleString()} ft (${Math.round(meters)} m)`;
}

/** Prefer barometric altitude, then geometric, for compact displays (e.g. map popup). */
export function formatAircraftAltitudeSummary(
  aircraft: Pick<AircraftState, "baroAltitude" | "geoAltitude">,
): string {
  const meters = aircraft.baroAltitude ?? aircraft.geoAltitude;
  if (meters === null) return UNAVAILABLE;
  const feet = Math.round(meters * METERS_TO_FEET);
  const source =
    aircraft.baroAltitude !== null
      ? "barometric"
      : aircraft.geoAltitude !== null
        ? "geometric"
        : "unknown";
  return `${feet.toLocaleString()} ft (${Math.round(meters)} m, ${source})`;
}

export function formatSpeed(velocityMs: number | null): string {
  if (velocityMs === null) return UNAVAILABLE;
  const knots = velocityMs * MS_TO_KNOTS;
  return `${Math.round(knots)} kt`;
}

export function formatHeading(trueTrack: number | null): string {
  if (trueTrack === null) return UNAVAILABLE;
  return `${Math.round(trueTrack)}°`;
}

export function formatVerticalRate(rateMs: number | null): string {
  if (rateMs === null) return UNAVAILABLE;
  const fpm = Math.round(rateMs * MS_TO_FPM);
  return `${fpm.toLocaleString()} ft/min (${rateMs.toFixed(1)} m/s)`;
}

export function formatUnixTimestamp(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return UNAVAILABLE;
  const ms = seconds * 1000;
  return new Date(ms).toLocaleString();
}

export function formatCoordinates(
  latitude: number | null,
  longitude: number | null,
): string {
  if (latitude === null || longitude === null) return UNAVAILABLE;
  return `${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`;
}

export function formatPositionSource(source: number): string {
  switch (source) {
    case 0:
      return "ADS-B";
    case 1:
      return "ASTERIX";
    case 2:
      return "MLAT";
    default:
      return `Unknown (${source})`;
  }
}

export function formatBooleanStatus(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return UNAVAILABLE;
  return value ? "Yes" : "No";
}

export function formatCallsign(callsign: string | null): string {
  if (!callsign) return UNAVAILABLE;
  const trimmed = callsign.trim();
  return trimmed.length > 0 ? trimmed : UNAVAILABLE;
}

export function formatSquawk(squawk: string | null): string {
  if (!squawk) return UNAVAILABLE;
  const trimmed = squawk.trim();
  return trimmed.length > 0 ? trimmed : UNAVAILABLE;
}
