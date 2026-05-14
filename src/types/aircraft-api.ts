import type { AircraftState } from "@/types/aircraft";

export type SingleAircraftErrorCode =
  | "invalid_icao24"
  | "not_visible"
  | "upstream_error";

export type SingleAircraftApiSuccess = {
  success: true;
  updatedAt: string;
  data: AircraftState;
};

export type SingleAircraftApiError = {
  success: false;
  code: SingleAircraftErrorCode;
  message: string;
  retryAfterSeconds?: number;
};

export type SingleAircraftApiResponse =
  | SingleAircraftApiSuccess
  | SingleAircraftApiError;
