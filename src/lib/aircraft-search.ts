import type {
  AircraftSearchFilters,
  AircraftSearchPageResult,
  AircraftSearchPagination,
} from "@/types/aircraft-search";
import type { AircraftState } from "@/types/aircraft";

function normaliseText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function getAircraftSearchAltitudeMeters(
  aircraft: Pick<AircraftState, "baroAltitude" | "geoAltitude">,
): number | null {
  return aircraft.baroAltitude ?? aircraft.geoAltitude;
}

export function getAircraftSearchOriginCountries(
  aircraft: AircraftState[],
): string[] {
  return Array.from(
    new Set(
      aircraft
        .map((item) => item.originCountry.trim())
        .filter((country) => country.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function matchesQuery(aircraft: AircraftState, query: string): boolean {
  const normalisedQuery = normaliseText(query);
  if (normalisedQuery.length === 0) {
    return true;
  }

  return [aircraft.icao24, aircraft.callsign].some((value) =>
    normaliseText(value).includes(normalisedQuery),
  );
}

function matchesStatus(
  aircraft: AircraftState,
  status: AircraftSearchFilters["status"],
): boolean {
  if (status === "airborne") {
    return !aircraft.onGround;
  }
  if (status === "on_ground") {
    return aircraft.onGround;
  }
  return true;
}

function matchesOriginCountry(
  aircraft: AircraftState,
  originCountry: string,
): boolean {
  const normalisedCountry = normaliseText(originCountry);
  if (normalisedCountry.length === 0) {
    return true;
  }
  return normaliseText(aircraft.originCountry) === normalisedCountry;
}

function matchesAltitude(
  aircraft: AircraftState,
  minAltitudeMeters: number | null,
  maxAltitudeMeters: number | null,
): boolean {
  if (minAltitudeMeters === null && maxAltitudeMeters === null) {
    return true;
  }

  const altitude = getAircraftSearchAltitudeMeters(aircraft);
  if (altitude === null) {
    return false;
  }

  if (minAltitudeMeters !== null && altitude < minAltitudeMeters) {
    return false;
  }
  if (maxAltitudeMeters !== null && altitude > maxAltitudeMeters) {
    return false;
  }
  return true;
}

function matchesSpeed(
  aircraft: AircraftState,
  minSpeedMetersPerSecond: number | null,
  maxSpeedMetersPerSecond: number | null,
): boolean {
  if (
    minSpeedMetersPerSecond === null &&
    maxSpeedMetersPerSecond === null
  ) {
    return true;
  }

  const speed = aircraft.velocity;
  if (speed === null) {
    return false;
  }

  if (
    minSpeedMetersPerSecond !== null &&
    speed < minSpeedMetersPerSecond
  ) {
    return false;
  }
  if (
    maxSpeedMetersPerSecond !== null &&
    speed > maxSpeedMetersPerSecond
  ) {
    return false;
  }
  return true;
}

function callsignSortValue(aircraft: AircraftState): string {
  const callsign = normaliseText(aircraft.callsign);
  return callsign.length > 0 ? callsign : "\uffff";
}

function stableAircraftSort(a: AircraftState, b: AircraftState): number {
  const callsignCompare = callsignSortValue(a).localeCompare(
    callsignSortValue(b),
  );
  if (callsignCompare !== 0) {
    return callsignCompare;
  }
  return a.icao24.localeCompare(b.icao24);
}

export function filterAircraft(
  aircraft: AircraftState[],
  filters: AircraftSearchFilters,
): AircraftState[] {
  return aircraft
    .filter(
      (item) =>
        matchesQuery(item, filters.query) &&
        matchesStatus(item, filters.status) &&
        matchesOriginCountry(item, filters.originCountry) &&
        matchesAltitude(
          item,
          filters.minAltitudeMeters,
          filters.maxAltitudeMeters,
        ) &&
        matchesSpeed(
          item,
          filters.minSpeedMetersPerSecond,
          filters.maxSpeedMetersPerSecond,
        ),
    )
    .slice()
    .sort(stableAircraftSort);
}

export function paginateAircraft(
  aircraft: AircraftState[],
  pagination: AircraftSearchPagination,
): AircraftSearchPageResult<AircraftState> {
  const totalResults = aircraft.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalResults / pagination.resultsPerPage),
  );
  const page = Math.min(Math.max(1, pagination.page), totalPages);
  const startOffset = (page - 1) * pagination.resultsPerPage;
  const endOffset = startOffset + pagination.resultsPerPage;
  const items = aircraft.slice(startOffset, endOffset);

  return {
    items,
    totalResults,
    totalPages,
    page,
    resultsPerPage: pagination.resultsPerPage,
    startIndex: totalResults === 0 ? 0 : startOffset + 1,
    endIndex: Math.min(endOffset, totalResults),
  };
}

export function searchAircraft(
  aircraft: AircraftState[],
  filters: AircraftSearchFilters,
  pagination: AircraftSearchPagination,
): AircraftSearchPageResult<AircraftState> {
  return paginateAircraft(filterAircraft(aircraft, filters), pagination);
}
