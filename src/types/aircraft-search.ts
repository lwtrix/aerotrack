export type AircraftSearchStatusFilter = "all" | "airborne" | "on_ground";

export type AircraftSearchResultsPerPage = 20 | 50 | 100;

export type AircraftSearchFilters = {
  query: string;
  status: AircraftSearchStatusFilter;
  originCountry: string;
  minAltitudeMeters: number | null;
  maxAltitudeMeters: number | null;
  minSpeedMetersPerSecond: number | null;
  maxSpeedMetersPerSecond: number | null;
};

export type AircraftSearchPagination = {
  page: number;
  resultsPerPage: AircraftSearchResultsPerPage;
};

export type AircraftSearchPageResult<T> = {
  items: T[];
  totalResults: number;
  totalPages: number;
  page: number;
  resultsPerPage: AircraftSearchResultsPerPage;
  startIndex: number;
  endIndex: number;
};
