import { AircraftState } from "@/types/aircraft";

type OpenSkyResponse = {
  time: number;
  states: unknown[][] | null;
};

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

  if (!data.states) {
    return [];
  }

  return data.states
    .map(normalizeStateVector)
    .filter(
      (aircraft) =>
        aircraft.latitude !== null &&
        aircraft.longitude !== null
    );
}