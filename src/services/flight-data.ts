import { isMockFlightDataMode } from "@/config/env";
import type { AircraftState } from "@/types/aircraft";
import {
  getAircraftStateByIcao24,
  getLiveAircraftStates,
} from "@/services/opensky";
import {
  getSimulatedAircraftStateByIcao24,
  getSimulatedLiveAircraftStates,
} from "@/services/mock-flight-simulator";

/**
 * Live aircraft list: OpenSky in "live" mode, deterministic simulator in "mock" mode.
 */
export async function getLiveAircraftStatesForCurrentMode(): Promise<
  AircraftState[]
> {
  if (isMockFlightDataMode()) {
    return Promise.resolve(getSimulatedLiveAircraftStates());
  }
  return getLiveAircraftStates();
}

/**
 * Single-aircraft state: same mode switch as the live list.
 */
export async function getAircraftStateByIcao24ForCurrentMode(
  icao24: string,
): Promise<AircraftState | null> {
  if (isMockFlightDataMode()) {
    return Promise.resolve(getSimulatedAircraftStateByIcao24(icao24));
  }
  return getAircraftStateByIcao24(icao24);
}
