export type FlightDataMode = "mock" | "live";

function normaliseFlightDataMode(
  raw: string | undefined,
): FlightDataMode {
  const v = raw?.trim().toLowerCase();
  if (v === "mock") {
    return "mock";
  }
  return "live";
}

/**
 * Flight data source for server-side routes. Defaults to "live" when unset or invalid.
 */
export function getFlightDataMode(): FlightDataMode {
  return normaliseFlightDataMode(process.env.AEROTRACK_DATA_MODE);
}

export function isMockFlightDataMode(): boolean {
  return getFlightDataMode() === "mock";
}
