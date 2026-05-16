"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AircraftSearchResultsPerPage,
  AircraftSearchStatusFilter,
} from "@/types/aircraft-search";

type AircraftSearchControlsProps = {
  query: string;
  status: AircraftSearchStatusFilter;
  originCountry: string;
  originCountries: string[];
  minAltitudeFeet: string;
  maxAltitudeFeet: string;
  minSpeedKnots: string;
  maxSpeedKnots: string;
  resultsPerPage: AircraftSearchResultsPerPage;
  isRefreshing: boolean;
  resultCount: number;
  snapshotCount: number;
  updatedAt: string | null;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: AircraftSearchStatusFilter) => void;
  onOriginCountryChange: (value: string) => void;
  onMinAltitudeFeetChange: (value: string) => void;
  onMaxAltitudeFeetChange: (value: string) => void;
  onMinSpeedKnotsChange: (value: string) => void;
  onMaxSpeedKnotsChange: (value: string) => void;
  onResultsPerPageChange: (value: AircraftSearchResultsPerPage) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
};

const STATUS_OPTIONS: {
  value: AircraftSearchStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "airborne", label: "Airborne" },
  { value: "on_ground", label: "On ground" },
];

const RESULTS_PER_PAGE_OPTIONS: AircraftSearchResultsPerPage[] = [20, 50, 100];

function parseResultsPerPage(value: string): AircraftSearchResultsPerPage {
  const parsed = Number(value);
  return RESULTS_PER_PAGE_OPTIONS.includes(
    parsed as AircraftSearchResultsPerPage,
  )
    ? (parsed as AircraftSearchResultsPerPage)
    : 20;
}

export function AircraftSearchControls({
  query,
  status,
  originCountry,
  originCountries,
  minAltitudeFeet,
  maxAltitudeFeet,
  minSpeedKnots,
  maxSpeedKnots,
  resultsPerPage,
  isRefreshing,
  resultCount,
  snapshotCount,
  updatedAt,
  onQueryChange,
  onStatusChange,
  onOriginCountryChange,
  onMinAltitudeFeetChange,
  onMaxAltitudeFeetChange,
  onMinSpeedKnotsChange,
  onMaxSpeedKnotsChange,
  onResultsPerPageChange,
  onClearFilters,
  onRefresh,
}: AircraftSearchControlsProps) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Aircraft snapshot</CardTitle>
            <CardDescription>
              Search callsigns and ICAO24 addresses in the latest loaded
              snapshot. Typing does not refetch live data.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-2">
            <label htmlFor="aircraft-search-query" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="aircraft-search-query"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by callsign or ICAO24..."
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Aircraft status">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={status === option.value ? "default" : "outline"}
                aria-pressed={status === option.value}
                onClick={() => onStatusChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <details className="rounded-lg border border-border bg-muted/20 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Advanced filters
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <label
                htmlFor="aircraft-origin-country"
                className="text-sm font-medium"
              >
                Origin / registration country
              </label>
              <select
                id="aircraft-origin-country"
                value={originCountry}
                onChange={(event) => onOriginCountryChange(event.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">All countries</option>
                {originCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="aircraft-min-altitude"
                className="text-sm font-medium"
              >
                Min altitude (ft)
              </label>
              <Input
                id="aircraft-min-altitude"
                type="number"
                inputMode="numeric"
                min="0"
                value={minAltitudeFeet}
                onChange={(event) =>
                  onMinAltitudeFeetChange(event.target.value)
                }
                placeholder="Any"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="aircraft-max-altitude"
                className="text-sm font-medium"
              >
                Max altitude (ft)
              </label>
              <Input
                id="aircraft-max-altitude"
                type="number"
                inputMode="numeric"
                min="0"
                value={maxAltitudeFeet}
                onChange={(event) =>
                  onMaxAltitudeFeetChange(event.target.value)
                }
                placeholder="Any"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="aircraft-min-speed"
                className="text-sm font-medium"
              >
                Min speed (kt)
              </label>
              <Input
                id="aircraft-min-speed"
                type="number"
                inputMode="numeric"
                min="0"
                value={minSpeedKnots}
                onChange={(event) => onMinSpeedKnotsChange(event.target.value)}
                placeholder="Any"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="aircraft-max-speed"
                className="text-sm font-medium"
              >
                Max speed (kt)
              </label>
              <Input
                id="aircraft-max-speed"
                type="number"
                inputMode="numeric"
                min="0"
                value={maxSpeedKnots}
                onChange={(event) => onMaxSpeedKnotsChange(event.target.value)}
                placeholder="Any"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="aircraft-results-per-page"
                className="text-sm font-medium"
              >
                Results per page
              </label>
              <select
                id="aircraft-results-per-page"
                value={resultsPerPage}
                onChange={(event) =>
                  onResultsPerPageChange(parseResultsPerPage(event.target.value))
                }
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {RESULTS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Button type="button" variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          </div>
        </details>

        <div
          className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
          aria-live="polite"
        >
          <p>
            <span className="font-medium text-foreground">{resultCount}</span>{" "}
            results from{" "}
            <span className="font-medium text-foreground">{snapshotCount}</span>{" "}
            aircraft in the snapshot.
          </p>
          {updatedAt ? (
            <p className="text-xs">
              Snapshot loaded:{" "}
              <time dateTime={updatedAt}>{new Date(updatedAt).toLocaleString()}</time>
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
