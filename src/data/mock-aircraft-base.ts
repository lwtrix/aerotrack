/**
 * Synthetic base records for the development flight simulator.
 * Not real aircraft; realistic-looking values only.
 */
export type MockAircraftBase = {
  icao24: string;
  callsign: string;
  originCountry: string;
  /** Route start (airborne) or parked position (ground). */
  routeStartLat: number;
  routeStartLon: number;
  /** Route end; equals start for ground aircraft. */
  routeEndLat: number;
  routeEndLon: number;
  /** Shifts each aircraft along its route in time (seconds). */
  routePhaseOffsetSeconds: number;
  baseBaroM: number;
  /** Nominal cruise / segment speed (m/s). */
  baseVelocityMs: number;
  /** True track when on ground (deg). */
  baseTrackDeg: number;
  baseVrateMs: number;
  squawk: string;
  positionSource: number;
  onGround: boolean;
};

const COUNTRIES = [
  "United Kingdom",
  "Germany",
  "France",
  "Netherlands",
  "Spain",
  "Italy",
  "Belgium",
  "Ireland",
  "Switzerland",
  "Austria",
  "Norway",
  "Denmark",
  "Sweden",
  "Poland",
  "Portugal",
];

const CALLSIGN_PREFIXES = [
  "BAW",
  "EZY",
  "RYR",
  "DLH",
  "AFR",
  "KLM",
  "IBE",
  "SAS",
  "TAP",
  "AUA",
  "FIN",
  "WZZ",
  "VLG",
  "EIN",
  "CFG",
];

/** Airfield-ish points (UK / NW Europe) for starts, ends, and parked aircraft. */
const WAYPOINTS: { lat: number; lon: number }[] = [
  { lat: 51.47, lon: -0.45 },
  { lat: 51.15, lon: -0.19 },
  { lat: 53.35, lon: -2.28 },
  { lat: 55.95, lon: -3.37 },
  { lat: 50.1, lon: -5.55 },
  { lat: 49.01, lon: 2.55 },
  { lat: 48.73, lon: 2.36 },
  { lat: 50.04, lon: 8.57 },
  { lat: 48.14, lon: 11.58 },
  { lat: 52.31, lon: 4.76 },
  { lat: 51.45, lon: 5.38 },
  { lat: 50.9, lon: 4.48 },
  { lat: 52.37, lon: 13.5 },
  { lat: 53.63, lon: 10.0 },
  { lat: 55.95, lon: 12.65 },
  { lat: 50.04, lon: 22.0 },
  { lat: 52.23, lon: 21.0 },
  { lat: 53.43, lon: -6.25 },
  { lat: 51.28, lon: 6.77 },
  { lat: 47.46, lon: -0.55 },
  { lat: 43.66, lon: 7.22 },
  { lat: 45.63, lon: 8.72 },
  { lat: 50.9, lon: -1.4 },
  { lat: 54.6, lon: -5.95 },
  { lat: 57.2, lon: -2.2 },
];

const GROUND_PARK: { lat: number; lon: number; hdg: number }[] = [
  { lat: 51.47, lon: -0.45, hdg: 270 },
  { lat: 49.01, lon: 2.55, hdg: 90 },
  { lat: 52.31, lon: 4.76, hdg: 45 },
  { lat: 50.04, lon: 8.57, hdg: 180 },
  { lat: 53.35, lon: -2.28, hdg: 230 },
  { lat: 48.73, lon: 2.36, hdg: 135 },
];

function buildMockAircraftBase(): MockAircraftBase[] {
  const list: MockAircraftBase[] = [];

  for (let i = 0; i < 50; i += 1) {
    const hex = ((0x406c00 + i * 0x791) & 0xffffff)
      .toString(16)
      .padStart(6, "0")
      .toLowerCase();
    const prefix = CALLSIGN_PREFIXES[i % CALLSIGN_PREFIXES.length];
    const callsign = `${prefix}${((i * 13) % 900) + 100}`;
    const country = COUNTRIES[i % COUNTRIES.length];
    const onGround = i % 9 === 0;
    const squawk = (1200 + ((i * 29) % 6776)).toString().padStart(4, "0");
    const positionSource = i % 3;
    const routePhaseOffsetSeconds = ((i * 127) % 2400) - 1200;

    if (onGround) {
      const park = GROUND_PARK[i % GROUND_PARK.length];
      list.push({
        icao24: hex,
        callsign,
        originCountry: country,
        routeStartLat: park.lat,
        routeStartLon: park.lon,
        routeEndLat: park.lat,
        routeEndLon: park.lon,
        routePhaseOffsetSeconds: 0,
        baseBaroM: 0,
        baseVelocityMs: 0,
        baseTrackDeg: park.hdg,
        baseVrateMs: 0,
        squawk,
        positionSource,
        onGround: true,
      });
      continue;
    }

    const a = WAYPOINTS[i % WAYPOINTS.length];
    const b = WAYPOINTS[(i + 7 + (i % 5)) % WAYPOINTS.length];
    const jitter = (k: number) => ((i * 17 + k * 23) % 200) / 2000 - 0.05;
    const sLat = a.lat + jitter(1);
    const sLon = a.lon + jitter(2);
    let eLat = b.lat + jitter(3);
    let eLon = b.lon + jitter(4);

    const minDelta = 0.55;
    if (Math.abs(eLat - sLat) + Math.abs(eLon - sLon) < minDelta) {
      eLat += 0.9 + (i % 4) * 0.15;
      eLon += 1.1 + (i % 3) * 0.12;
    }

    const speedTier = i % 7;
    let baseVelocityMs: number;
    if (speedTier <= 1) {
      baseVelocityMs = 72 + (i % 4) * 6;
    } else if (speedTier <= 4) {
      baseVelocityMs = 198 + (i % 5) * 7;
    } else {
      baseVelocityMs = 248 + (i % 3) * 8;
    }

    const baseBaroM = 7800 + (i % 8) * 420;
    const baseTrackDeg = (i * 47 + i * i) % 360;
    const baseVrateMs = -1.8 + (i % 5) * 0.55;

    list.push({
      icao24: hex,
      callsign,
      originCountry: country,
      routeStartLat: sLat,
      routeStartLon: sLon,
      routeEndLat: eLat,
      routeEndLon: eLon,
      routePhaseOffsetSeconds,
      baseBaroM,
      baseVelocityMs,
      baseTrackDeg,
      baseVrateMs,
      squawk,
      positionSource,
      onGround: false,
    });
  }

  return list;
}

export const MOCK_AIRCRAFT_BASE: MockAircraftBase[] = buildMockAircraftBase();
