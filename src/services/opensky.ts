import type { AircraftState } from "@/types/aircraft";

type OpenSkyResponse = {
  time: number;
  states: unknown[][] | null;
};

const ICAO24_HEX = /^[0-9a-f]{6}$/i;

function normalizeStateVector(state: unknown[]): AircraftState {
  return {
    icao24: String(state[0]),
    callsign: state[1] ? String(state[1]).trim() : null,
    originCountry: String(state[2]),
    timePosition: typeof state[3] === "number" ? state[3] : null,
    lastContact: Number(state[4]),
    longitude: typeof state[5] === "number" ? state[5] : null,
    latitude: typeof state[6] === "number" ? state[6] : null,
    baroAltitude: typeof state[7] === "number" ? state[7] : null,
    onGround: Boolean(state[8]),
    velocity: typeof state[9] === "number" ? state[9] : null,
    trueTrack: typeof state[10] === "number" ? state[10] : null,
    verticalRate: typeof state[11] === "number" ? state[11] : null,
    geoAltitude: typeof state[13] === "number" ? state[13] : null,
    squawk: state[14] ? String(state[14]) : null,
    spi: Boolean(state[15]),
    positionSource: typeof state[16] === "number" ? state[16] : 0,
  };
}

function normalizeAllStates(data: OpenSkyResponse): AircraftState[] {
  if (!data.states) {
    return [];
  }
  return data.states.map(normalizeStateVector);
}

export function normaliseIcao24Param(icao24: string): string | null {
  const trimmed = icao24.trim().toLowerCase();
  if (!ICAO24_HEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export async function getLiveAircraftStates(): Promise<AircraftState[]> {
  const response = await fetch("https://opensky-network.org/api/states/all", {
    next: {
      revalidate: 30,
    },
  });

  if (!response.ok) {
    throw new Error(`OpenSky API error: ${response.status}`);
  }

  const data = (await response.json()) as OpenSkyResponse;

  return normalizeAllStates(data).filter(
    (aircraft) =>
      aircraft.latitude !== null && aircraft.longitude !== null,
  );
}

/**
 * Fetches the latest state vector for one aircraft from OpenSky.
 * Returns null when OpenSky has no matching state rows.
 * Throws on HTTP/network failures (upstream errors).
 */
export async function getAircraftStateByIcao24(
  icao24: string,
): Promise<AircraftState | null> {
  const normalized = normaliseIcao24Param(icao24);
  if (!normalized) {
    return null;
  }

  const url = new URL("https://opensky-network.org/api/states/all");
  url.searchParams.set("icao24", normalized);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OpenSky API error: ${response.status}`);
  }

  const data = (await response.json()) as OpenSkyResponse;
  const states = normalizeAllStates(data);
  if (states.length === 0) {
    return null;
  }

  return states[0] ?? null;
}
