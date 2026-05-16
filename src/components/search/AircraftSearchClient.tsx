"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AircraftSearchControls } from "@/components/search/AircraftSearchControls";
import { AircraftSearchResults } from "@/components/search/AircraftSearchResults";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAircraftSearchOriginCountries,
  searchAircraft,
} from "@/lib/aircraft-search";
import type {
  AircraftSearchResultsPerPage,
  AircraftSearchStatusFilter,
} from "@/types/aircraft-search";
import type { AircraftState } from "@/types/aircraft";
import type { LiveFlightsApiResponse } from "@/types/live-flights";

type FetchSnapshotOptions = {
  initial: boolean;
};

function readApiErrorMessage(
  body: LiveFlightsApiResponse | null,
  fallback: string,
): string {
  if (body && body.success === false && typeof body.message === "string") {
    return body.message;
  }
  return fallback;
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

const FEET_TO_METRES = 0.3048;
const KNOTS_TO_METRES_PER_SECOND = 0.514_444;
const DEFAULT_RESULTS_PER_PAGE: AircraftSearchResultsPerPage = 20;

function parseFeetToMeters(value: string): number | null {
  const feet = parseOptionalNumber(value);
  return feet === null ? null : feet * FEET_TO_METRES;
}

function parseKnotsToMetersPerSecond(value: string): number | null {
  const knots = parseOptionalNumber(value);
  return knots === null ? null : knots * KNOTS_TO_METRES_PER_SECOND;
}

export function AircraftSearchClient() {
  const [aircraft, setAircraft] = useState<AircraftState[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [hasLoadedSnapshot, setHasLoadedSnapshot] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AircraftSearchStatusFilter>("all");
  const [originCountry, setOriginCountry] = useState("");
  const [minAltitudeFeet, setMinAltitudeFeet] = useState("");
  const [maxAltitudeFeet, setMaxAltitudeFeet] = useState("");
  const [minSpeedKnots, setMinSpeedKnots] = useState("");
  const [maxSpeedKnots, setMaxSpeedKnots] = useState("");
  const [resultsPerPage, setResultsPerPage] =
    useState<AircraftSearchResultsPerPage>(DEFAULT_RESULTS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(1);

  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);
  const initialFetchStartedRef = useRef(false);

  const fetchSnapshot = useCallback(async ({ initial }: FetchSnapshotOptions) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    if (initial) {
      setIsInitialLoading(true);
      setInitialError(null);
    } else {
      setIsRefreshing(true);
      setRefreshError(null);
    }

    try {
      const response = await fetch("/api/flights/live", {
        method: "GET",
        cache: "no-store",
      });

      let body: LiveFlightsApiResponse | null = null;
      try {
        body = (await response.json()) as LiveFlightsApiResponse;
      } catch {
        body = null;
      }

      if (!response.ok) {
        throw new Error(
          readApiErrorMessage(body, `Request failed (${response.status})`),
        );
      }

      if (!body || typeof body !== "object" || !("success" in body)) {
        throw new Error("Unexpected response from server.");
      }

      if (body.success === false) {
        throw new Error(body.message);
      }

      if (!Array.isArray(body.data)) {
        throw new Error("Unexpected aircraft data from server.");
      }

      if (!mountedRef.current) {
        return;
      }

      setAircraft(body.data);
      setUpdatedAt(body.updatedAt);
      setHasLoadedSnapshot(true);
      setInitialError(null);
      setRefreshError(null);
      setCurrentPage(1);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to load aircraft data.";

      if (hasLoadedSnapshot && !initial) {
        setRefreshError(message);
      } else {
        setInitialError(message);
      }
    } finally {
      inFlightRef.current = false;
      if (!mountedRef.current) {
        return;
      }
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [hasLoadedSnapshot]);

  useEffect(() => {
    mountedRef.current = true;

    if (!initialFetchStartedRef.current) {
      initialFetchStartedRef.current = true;
      void fetchSnapshot({ initial: true });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchSnapshot]);

  const countryOptions = useMemo(
    () => getAircraftSearchOriginCountries(aircraft),
    [aircraft],
  );

  const pageResult = useMemo(
    () =>
      searchAircraft(
        aircraft,
        {
          query,
          status,
          originCountry,
          minAltitudeMeters: parseFeetToMeters(minAltitudeFeet),
          maxAltitudeMeters: parseFeetToMeters(maxAltitudeFeet),
          minSpeedMetersPerSecond:
            parseKnotsToMetersPerSecond(minSpeedKnots),
          maxSpeedMetersPerSecond:
            parseKnotsToMetersPerSecond(maxSpeedKnots),
        },
        {
          page: currentPage,
          resultsPerPage,
        },
      ),
    [
      aircraft,
      currentPage,
      maxAltitudeFeet,
      maxSpeedKnots,
      minAltitudeFeet,
      minSpeedKnots,
      originCountry,
      query,
      resultsPerPage,
      status,
    ],
  );

  const handleRefresh = useCallback(() => {
    void fetchSnapshot({ initial: !hasLoadedSnapshot });
  }, [fetchSnapshot, hasLoadedSnapshot]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: AircraftSearchStatusFilter) => {
    setStatus(value);
    setCurrentPage(1);
  }, []);

  const handleOriginCountryChange = useCallback((value: string) => {
    setOriginCountry(value);
    setCurrentPage(1);
  }, []);

  const handleResultsPerPageChange = useCallback(
    (value: AircraftSearchResultsPerPage) => {
      setResultsPerPage(value);
      setCurrentPage(1);
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setQuery("");
    setStatus("all");
    setOriginCountry("");
    setMinAltitudeFeet("");
    setMaxAltitudeFeet("");
    setMinSpeedKnots("");
    setMaxSpeedKnots("");
    setResultsPerPage(DEFAULT_RESULTS_PER_PAGE);
    setCurrentPage(1);
  }, []);

  if (isInitialLoading && !hasLoadedSnapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading aircraft snapshot</CardTitle>
          <CardDescription>
            Fetching the current live aircraft list from AeroTrack.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full max-w-xl" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (initialError && !hasLoadedSnapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load aircraft</CardTitle>
          <CardDescription>{initialError}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isInitialLoading || isRefreshing}
          >
            {isInitialLoading || isRefreshing ? "Retrying..." : "Retry"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AircraftSearchControls
        query={query}
        status={status}
        originCountry={originCountry}
        originCountries={countryOptions}
        minAltitudeFeet={minAltitudeFeet}
        maxAltitudeFeet={maxAltitudeFeet}
        minSpeedKnots={minSpeedKnots}
        maxSpeedKnots={maxSpeedKnots}
        resultsPerPage={resultsPerPage}
        isRefreshing={isRefreshing}
        resultCount={pageResult.totalResults}
        snapshotCount={aircraft.length}
        updatedAt={updatedAt}
        onQueryChange={handleQueryChange}
        onStatusChange={handleStatusChange}
        onOriginCountryChange={handleOriginCountryChange}
        onMinAltitudeFeetChange={(value) => {
          setMinAltitudeFeet(value);
          resetPage();
        }}
        onMaxAltitudeFeetChange={(value) => {
          setMaxAltitudeFeet(value);
          resetPage();
        }}
        onMinSpeedKnotsChange={(value) => {
          setMinSpeedKnots(value);
          resetPage();
        }}
        onMaxSpeedKnotsChange={(value) => {
          setMaxSpeedKnots(value);
          resetPage();
        }}
        onResultsPerPageChange={handleResultsPerPageChange}
        onClearFilters={handleClearFilters}
        onRefresh={handleRefresh}
      />

      {refreshError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive" role="alert">
            Refresh failed: {refreshError}
          </CardContent>
        </Card>
      ) : null}

      <AircraftSearchResults
        aircraft={pageResult.items}
        pageResult={pageResult}
        onPreviousPage={() =>
          setCurrentPage((page) => Math.max(1, page - 1))
        }
        onNextPage={() =>
          setCurrentPage((page) => Math.min(pageResult.totalPages, page + 1))
        }
        emptyMessage={
          aircraft.length === 0
            ? "The current snapshot did not include any aircraft."
            : "No aircraft match the current search and filters."
        }
      />
    </div>
  );
}
