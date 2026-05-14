"use client";

import { LiveFlightsMap } from "@/components/map/LiveFlightsMap";
import { MapStatusPanel } from "@/components/map/MapStatusPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrowserGeolocation } from "@/hooks/useBrowserGeolocation";
import { useLiveFlights } from "@/hooks/useLiveFlights";

export default function LiveMapSection() {
  const {
    aircraft,
    count,
    updatedAt,
    isLoading,
    errorMessage,
    status,
    refetch,
  } = useLiveFlights();

  const { locationMessage, userLocation } = useBrowserGeolocation();

  const showMap = status === "success" || status === "empty";

  return (
    <div className="flex flex-col gap-4">
      <MapStatusPanel
        status={status}
        isLoading={isLoading}
        errorMessage={errorMessage}
        count={count}
        updatedAt={updatedAt}
        onRetry={refetch}
        locationMessage={locationMessage}
      />

      <div className="h-[560px] w-full overflow-hidden rounded-xl ring-1 ring-foreground/10">
        {showMap ? (
          <LiveFlightsMap aircraft={aircraft} userLocation={userLocation} />
        ) : status === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            <p>The map loads once live flight data is available.</p>
            <p className="text-xs">Use Retry in the panel above after fixing the error.</p>
          </div>
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
      </div>
    </div>
  );
}
