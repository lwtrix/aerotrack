"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AircraftState } from "@/types/aircraft";
import type { LiveFlightsApiResponse } from "@/types/live-flights";

export type LiveFlightsStatus = "loading" | "error" | "empty" | "success";

const SUCCESS_POLL_MS = 30_000;
const MANUAL_RETRY_THROTTLE_MS = 5_000;
/** Longer gap for manual refresh while rate-limited to avoid hammering the API. */
const RATE_LIMIT_MANUAL_THROTTLE_MS = 20_000;
const ERROR_BACKOFF_MIN_MS = 120_000;
const ERROR_BACKOFF_MAX_MS = 86_400_000;

type FetchOptions = {
  silent: boolean;
};

function resolveStatus(aircraft: AircraftState[]): "empty" | "success" {
  return aircraft.length === 0 ? "empty" : "success";
}

function readErrorBackoffMs(body: LiveFlightsApiResponse | null): number {
  if (!body || body.success !== false) {
    return ERROR_BACKOFF_MIN_MS;
  }
  const sec =
    typeof body.retryAfterSeconds === "number" &&
    Number.isFinite(body.retryAfterSeconds)
      ? body.retryAfterSeconds
      : 120;
  const fromApi = sec * 1000;
  return Math.min(
    ERROR_BACKOFF_MAX_MS,
    Math.max(ERROR_BACKOFF_MIN_MS, fromApi),
  );
}

const REFRESH_INTERVAL_MIN_MS = 1_000;
const REFRESH_INTERVAL_MAX_MS = 60_000;

/** Success-path poll interval from API; invalid or missing uses 30s. */
function readSuccessRefreshIntervalMs(
  body: LiveFlightsApiResponse,
): number {
  if (body.success !== true) {
    return SUCCESS_POLL_MS;
  }
  const raw = body.refreshIntervalMs;
  if (
    typeof raw === "number" &&
    Number.isFinite(raw) &&
    raw >= REFRESH_INTERVAL_MIN_MS &&
    raw <= REFRESH_INTERVAL_MAX_MS
  ) {
    return raw;
  }
  return SUCCESS_POLL_MS;
}

export function useLiveFlights() {
  const [aircraft, setAircraft] = useState<AircraftState[]>([]);
  const [count, setCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<LiveFlightsStatus>("loading");

  const inFlightRef = useRef(false);
  const hadSuccessRef = useRef(false);
  const nextDelayMsRef = useRef(SUCCESS_POLL_MS);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const lastManualRetryMsRef = useRef(0);
  const lastErrorCodeRef = useRef<string | null>(null);
  const performFetchRef = useRef<(options: FetchOptions) => Promise<void>>(
    async () => {},
  );

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const scheduleNextPoll = useCallback(() => {
    clearPollTimer();
    if (!mountedRef.current) {
      return;
    }
    pollTimerRef.current = setTimeout(() => {
      void performFetchRef.current({ silent: true });
    }, nextDelayMsRef.current);
  }, [clearPollTimer]);

  const performFetch = useCallback(
    async (options: FetchOptions) => {
      const { silent } = options;

      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;

      try {
        if (!silent) {
          if (!mountedRef.current) {
            return;
          }
          setIsLoading(true);
          setStatus("loading");
          setErrorMessage(null);
        }

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
          if (!mountedRef.current) {
            return;
          }
          if (
            body &&
            "success" in body &&
            body.success === false &&
            "code" in body &&
            typeof body.code === "string"
          ) {
            lastErrorCodeRef.current = body.code;
          } else {
            lastErrorCodeRef.current = null;
          }
          setErrorMessage(message);
          setStatus("error");
          nextDelayMsRef.current = readErrorBackoffMs(body);
          if (!hadSuccessRef.current) {
            setAircraft([]);
            setCount(0);
            setUpdatedAt(null);
          }
          return;
        }

        if (!body || typeof body !== "object" || !("success" in body)) {
          if (!mountedRef.current) {
            return;
          }
          setErrorMessage("Unexpected response from server.");
          setStatus("error");
          nextDelayMsRef.current = ERROR_BACKOFF_MIN_MS;
          if (!hadSuccessRef.current) {
            setAircraft([]);
            setCount(0);
            setUpdatedAt(null);
          }
          return;
        }

        if (body.success === false) {
          if (!mountedRef.current) {
            return;
          }
          lastErrorCodeRef.current = body.code;
          setErrorMessage(body.message);
          setStatus("error");
          nextDelayMsRef.current = readErrorBackoffMs(body);
          if (!hadSuccessRef.current) {
            setAircraft([]);
            setCount(0);
            setUpdatedAt(null);
          }
          return;
        }

        if (!Array.isArray(body.data)) {
          if (!mountedRef.current) {
            return;
          }
          setErrorMessage("Unexpected response from server.");
          setStatus("error");
          nextDelayMsRef.current = ERROR_BACKOFF_MIN_MS;
          if (!hadSuccessRef.current) {
            setAircraft([]);
            setCount(0);
            setUpdatedAt(null);
          }
          return;
        }

        hadSuccessRef.current = true;
        lastErrorCodeRef.current = null;
        nextDelayMsRef.current = readSuccessRefreshIntervalMs(body);

        const nextAircraft = body.data;
        const nextCount = body.count;
        const nextUpdatedAt = body.updatedAt;

        if (!mountedRef.current) {
          return;
        }

        setAircraft(nextAircraft);
        setCount(nextCount);
        setUpdatedAt(nextUpdatedAt);
        setErrorMessage(null);
        setStatus(resolveStatus(nextAircraft));
      } catch {
        if (!mountedRef.current) {
          return;
        }
        setErrorMessage("Network error while loading live flights.");
        setStatus("error");
        nextDelayMsRef.current = ERROR_BACKOFF_MIN_MS;
        if (!hadSuccessRef.current) {
          setAircraft([]);
          setCount(0);
          setUpdatedAt(null);
        }
      } finally {
        inFlightRef.current = false;
        if (!silent && mountedRef.current) {
          setIsLoading(false);
        }
        if (mountedRef.current) {
          scheduleNextPoll();
        }
      }
    },
    [scheduleNextPoll],
  );

  useEffect(() => {
    performFetchRef.current = performFetch;
  }, [performFetch]);

  useEffect(() => {
    mountedRef.current = true;
    const initialTimeoutId = window.setTimeout(() => {
      void performFetch({ silent: false });
    }, 0);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initialTimeoutId);
      clearPollTimer();
    };
  }, [performFetch, clearPollTimer]);

  const refetch = useCallback(() => {
    const now = Date.now();
    const manualThrottle =
      lastErrorCodeRef.current === "rate_limited"
        ? RATE_LIMIT_MANUAL_THROTTLE_MS
        : MANUAL_RETRY_THROTTLE_MS;
    if (now - lastManualRetryMsRef.current < manualThrottle) {
      return;
    }
    if (inFlightRef.current) {
      return;
    }
    lastManualRetryMsRef.current = now;
    clearPollTimer();
    void performFetch({ silent: false });
  }, [performFetch, clearPollTimer]);

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
