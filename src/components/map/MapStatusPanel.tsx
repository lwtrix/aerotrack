"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LiveFlightsStatus } from "@/hooks/useLiveFlights";
import { MAX_VISIBLE_AIRCRAFT_MARKERS_ON_MAP } from "@/types/live-flights";

type MapStatusPanelProps = {
  status: LiveFlightsStatus;
  isLoading: boolean;
  errorMessage: string | null;
  count: number;
  updatedAt: string | null;
  onRetry: () => void;
  locationMessage: string;
};

export function MapStatusPanel({
  status,
  isLoading,
  errorMessage,
  count,
  updatedAt,
  onRetry,
  locationMessage,
}: MapStatusPanelProps) {
  const capped = count > MAX_VISIBLE_AIRCRAFT_MARKERS_ON_MAP;
  const visible = Math.min(count, MAX_VISIBLE_AIRCRAFT_MARKERS_ON_MAP);

  return (
    <Card size="sm">
      <CardHeader className="border-b pb-3">
        <CardTitle>Live positions</CardTitle>
        <CardDescription>
          Data from AeroTrack. Refreshes every 30 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "loading" && isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3 max-w-sm" />
            <Skeleton className="h-4 w-1/2 max-w-xs" />
          </div>
        ) : null}

        {status === "error" ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              {errorMessage ?? "Something went wrong."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}

        {status === "empty" ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>No aircraft with positions are available right now.</p>
            {updatedAt ? (
              <p className="text-xs">
                Last check:{" "}
                <time dateTime={updatedAt}>
                  {new Date(updatedAt).toLocaleString()}
                </time>
              </p>
            ) : null}
          </div>
        ) : null}

        {status === "success" ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{count}</span>{" "}
              aircraft
              {capped ? (
                <>
                  {" "}
                  (showing <span className="font-medium text-foreground">{visible}</span>{" "}
                  on the map)
                </>
              ) : null}
            </p>
            {updatedAt ? (
              <p className="text-xs">
                Last update:{" "}
                <time dateTime={updatedAt}>
                  {new Date(updatedAt).toLocaleString()}
                </time>
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          {locationMessage}
        </p>
      </CardContent>
    </Card>
  );
}
