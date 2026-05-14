import type { AircraftState } from "@/types/aircraft";
import type { OpenSkyFailureCode } from "@/services/opensky-errors";

/** Cap for how many aircraft markers we render on the live map (Milestone 2). */
export const MAX_VISIBLE_AIRCRAFT_MARKERS_ON_MAP = 500;

export type LiveFlightsApiSuccess = {
  success: true;
  count: number;
  updatedAt: string;
  data: AircraftState[];
};

export type LiveFlightsApiErrorBody = {
  success: false;
  code: OpenSkyFailureCode;
  message: string;
  retryAfterSeconds: number;
  data: [];
};

export type LiveFlightsApiResponse =
  | LiveFlightsApiSuccess
  | LiveFlightsApiErrorBody;
