"use client";

import { useCallback, useEffect, useState } from "react";
import type { AircraftState } from "@/types/aircraft";
import type { LiveFlightsApiResponse } from "@/types/live-flights";

export type LiveFlightsStatus = "loading" | "error" | "empty" | "success";

const REFRESH_INTERVAL_MS = 30_000;

type FetchOptions = {
  silent: boolean;
};

function resolveStatus(
  aircraft: AircraftState[],
): "empty" | "success" {
  return aircraft.length === 0 ? "empty" : "success";
}

export function useLiveFlights() {
  const [aircraft, setAircraft] = useState<AircraftState[]>([]);
  const [count, setCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<LiveFlightsStatus>("loading");

  const fetchLive = useCallback(async (options: FetchOptions) => {
    const { silent } = options;

    if (!silent) {
      setIsLoading(true);
      setStatus("loading");
      setErrorMessage(null);
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
        const message =
          body && "message" in body && typeof body.message === "string"
            ? body.message
            : `Request failed (${response.status})`;
        setErrorMessage(message);
        setStatus("error");
        setAircraft([]);
        setCount(0);
        setUpdatedAt(null);
        return;
      }

      if (!body || typeof body !== "object" || !("success" in body)) {
        setErrorMessage("Unexpected response from server.");
        setStatus("error");
        setAircraft([]);
        setCount(0);
        setUpdatedAt(null);
        return;
      }

      if (body.success === false) {
        setErrorMessage(body.message);
        setStatus("error");
        setAircraft([]);
        setCount(0);
        setUpdatedAt(null);
        return;
      }

      if (!Array.isArray(body.data)) {
        setErrorMessage("Unexpected response from server.");
        setStatus("error");
        setAircraft([]);
        setCount(0);
        setUpdatedAt(null);
        return;
      }

      const nextAircraft = body.data;
      const nextCount = body.count;
      const nextUpdatedAt = body.updatedAt;

      setAircraft(nextAircraft);
      setCount(nextCount);
      setUpdatedAt(nextUpdatedAt);
      setErrorMessage(null);
      setStatus(resolveStatus(nextAircraft));
    } catch {
      setErrorMessage("Network error while loading live flights.");
      setStatus("error");
      setAircraft([]);
      setCount(0);
      setUpdatedAt(null);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const initialTimeoutId = window.setTimeout(() => {
      void fetchLive({ silent: false });
    }, 0);

    const intervalId = window.setInterval(() => {
      void fetchLive({ silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchLive]);

  const refetch = useCallback(() => {
    void fetchLive({ silent: false });
  }, [fetchLive]);

  return {
    aircraft,
    count,
    updatedAt,
    isLoading,
    errorMessage,
    status,
    refetch,
  };
}
