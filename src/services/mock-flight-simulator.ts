import { MOCK_AIRCRAFT_BASE } from "@/data/mock-aircraft-base";
import { normaliseIcao24Param } from "@/services/opensky";
import type { AircraftState } from "@/types/aircraft";

/** Wall-clock simulation step (seconds). Positions advance by `velocity * SIM_TICK_SEC` per step. */
const SIM_TICK_SEC = 5;
const EARTH_RADIUS_METRES = 6_371_000;
/** Scale wave phase so heading/altitude evolve at a similar rate to the old 30s tick. */
const WAVE_PHASE_PER_SIM_STEP = SIM_TICK_SEC / 30;

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function haversineMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const φ1 = lat1 * DEG2RAD;
  const φ2 = lat2 * DEG2RAD;
  const Δφ = (lat2 - lat1) * DEG2RAD;
  const Δλ = (lon2 - lon1) * DEG2RAD;
  const sΔφ = Math.sin(Δφ / 2);
  const sΔλ = Math.sin(Δλ / 2);
  const a =
    sΔφ * sΔφ + Math.cos(φ1) * Math.cos(φ2) * sΔλ * sΔλ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return EARTH_RADIUS_METRES * c;
}

/** Initial bearing from point 1 toward point 2 (degrees, 0–360). */
function bearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const φ1 = lat1 * DEG2RAD;
  const φ2 = lat2 * DEG2RAD;
  const Δλ = (lon2 - lon1) * DEG2RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * RAD2DEG) % 360 + 360) % 360;
}

/**
 * Spherical linear interpolation from (lat1,lon1) toward (lat2,lon2); fraction in [0, 1].
 */
function interpolateGreatCircle(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  fraction: number,
): { lat: number; lon: number } {
  const f = clamp(fraction, 0, 1);
  const φ1 = lat1 * DEG2RAD;
  const λ1 = lon1 * DEG2RAD;
  const φ2 = lat2 * DEG2RAD;
  const λ2 = lon2 * DEG2RAD;
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((φ2 - φ1) / 2) ** 2 +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
      ),
    );
  if (!Number.isFinite(d) || d < 1e-9) {
    return { lat: lat1, lon: lon1 };
  }
  const a = Math.sin((1 - f) * d) / Math.sin(d);
  const b = Math.sin(f * d) / Math.sin(d);
  const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
  const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
  const z = a * Math.sin(φ1) + b * Math.sin(φ2);
  const lat = Math.atan2(z, Math.hypot(x, y)) * RAD2DEG;
  const lon = Math.atan2(y, x) * RAD2DEG;
  return { lat, lon };
}

function tickStartSecFromNow(nowMs?: number): number {
  const nowSec = Math.floor((nowMs ?? Date.now()) / 1000);
  return Math.floor(nowSec / SIM_TICK_SEC) * SIM_TICK_SEC;
}

function simulateOne(
  base: (typeof MOCK_AIRCRAFT_BASE)[number],
  idx: number,
  tickStartSec: number,
): AircraftState {
  if (base.onGround) {
    const lat = base.routeStartLat;
    const lon = base.routeStartLon;
    return {
      icao24: base.icao24,
      callsign: base.callsign.trim() || null,
      originCountry: base.originCountry,
      timePosition: tickStartSec,
      lastContact: tickStartSec,
      longitude: lon,
      latitude: lat,
      baroAltitude: 0,
      onGround: true,
      velocity: 0,
      trueTrack: base.baseTrackDeg,
      verticalRate: 0,
      geoAltitude: 0,
      squawk: base.squawk,
      spi: false,
      positionSource: base.positionSource,
    };
  }

  const tickStep = Math.round(tickStartSec / SIM_TICK_SEC);
  const wavePhase = tickStep * WAVE_PHASE_PER_SIM_STEP;

  const routeLen = Math.max(
    5_000,
    haversineMetres(
      base.routeStartLat,
      base.routeStartLon,
      base.routeEndLat,
      base.routeEndLon,
    ),
  );
  const pingPongMetres = 2 * routeLen;

  const stepMetres = base.baseVelocityMs * SIM_TICK_SEC;
  const phaseMetres = base.baseVelocityMs * base.routePhaseOffsetSeconds;
  let along =
    (tickStep * stepMetres + phaseMetres) % pingPongMetres;
  if (along < 0) {
    along += pingPongMetres;
  }

  let frac = 0;
  let legForward = true;
  if (along <= routeLen) {
    legForward = true;
    frac = along / routeLen;
  } else {
    legForward = false;
    frac = (along - routeLen) / routeLen;
  }

  const { lat, lon } = legForward
    ? interpolateGreatCircle(
        base.routeStartLat,
        base.routeStartLon,
        base.routeEndLat,
        base.routeEndLon,
        frac,
      )
    : interpolateGreatCircle(
        base.routeEndLat,
        base.routeEndLon,
        base.routeStartLat,
        base.routeStartLon,
        frac,
      );

  const brgAB = bearingDeg(
    base.routeStartLat,
    base.routeStartLon,
    base.routeEndLat,
    base.routeEndLon,
  );
  const headingJitterDeg =
    Math.sin(wavePhase * 0.018 + idx * 0.62) * 2.2 +
    Math.sin(wavePhase * 0.009 + idx * 0.31) * 1.1;
  const trueTrack = legForward
    ? (brgAB + headingJitterDeg + 360) % 360
    : (brgAB + 180 + headingJitterDeg + 360) % 360;

  const speedFactor =
    1 + Math.sin(wavePhase * 0.016 + idx * 0.81) * 0.04;
  const vMs = clamp(base.baseVelocityMs * speedFactor, 60, 300);

  const altPhase = wavePhase * 0.11 + idx * 0.93;
  const baro = clamp(
    base.baseBaroM +
      Math.sin(altPhase) * 520 +
      Math.sin(wavePhase * 0.045 + idx * 0.37) * 140,
    600,
    13_000,
  );
  const vrate =
    base.baseVrateMs +
    Math.sin(wavePhase * 0.032 + idx * 0.58) * 0.32 +
    Math.sin(wavePhase * 0.019 + idx * 0.21) * 0.18;

  const geo = baro + Math.sin(wavePhase * 0.021 + idx * 0.44) * 32;

  return {
    icao24: base.icao24,
    callsign: base.callsign.trim() || null,
    originCountry: base.originCountry,
    timePosition: tickStartSec,
    lastContact: tickStartSec,
    longitude: lon,
    latitude: lat,
    baroAltitude: baro,
    onGround: false,
    velocity: vMs,
    trueTrack,
    verticalRate: vrate,
    geoAltitude: geo,
    squawk: base.squawk,
    spi: false,
    positionSource: base.positionSource,
  };
}

/**
 * Deterministic simulated states for the current 5-second wall-clock tick.
 *
 * Movement check (manual): pick one `icao24`, call with `nowMs` and `nowMs + 5_000`,
 * haversine distance between positions should be ≈ `velocity * 5` metres (within ~20%
 * if heading/speed waves shift slightly).
 */
export function getSimulatedLiveAircraftStates(nowMs?: number): AircraftState[] {
  const tickStartSec = tickStartSecFromNow(nowMs);
  return MOCK_AIRCRAFT_BASE.map((b, idx) => simulateOne(b, idx, tickStartSec));
}

export function getSimulatedAircraftStateByIcao24(
  icao24: string,
  nowMs?: number,
): AircraftState | null {
  const normalized = normaliseIcao24Param(icao24);
  if (!normalized) {
    return null;
  }
  const base = MOCK_AIRCRAFT_BASE.find((b) => b.icao24 === normalized);
  if (!base) {
    return null;
  }
  const idx = MOCK_AIRCRAFT_BASE.indexOf(base);
  return simulateOne(base, idx, tickStartSecFromNow(nowMs));
}
