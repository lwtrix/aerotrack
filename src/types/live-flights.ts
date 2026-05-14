import type { AircraftState } from "@/types/aircraft";

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
  message: string;
};

export type LiveFlightsApiResponse =
  | LiveFlightsApiSuccess
  | LiveFlightsApiErrorBody;
