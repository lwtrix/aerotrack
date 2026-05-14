"use client";

import { useEffect, useState } from "react";

/** Statute miles shown around the user when geolocation is granted. */
export const USER_MAP_VIEW_RADIUS_MILES = 700;

/** Same radius expressed in metres (1 mi = 1609.344 m). */
export const USER_MAP_VIEW_RADIUS_METERS = 700 * 1609.344;

export type BrowserGeolocationStatus =
  | "pending"
  | "granted"
  | "denied"
  | "unavailable"
  | "timeout"
  | "error";

type UserPosition = { lat: number; lng: number };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 300_000,
};

function locationMessageForStatus(status: BrowserGeolocationStatus): string {
  switch (status) {
    case "pending":
      return "Requesting your location…";
    case "granted":
      return "Map centred on your location, showing roughly a 700-mile radius.";
    case "denied":
      return "Location permission denied. Using default map view.";
    case "unavailable":
      return "Location unavailable. Using default map view.";
    case "timeout":
      return "Location request timed out. Using default map view.";
    case "error":
      return "Could not detect your location. Using default map view.";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function useBrowserGeolocation() {
  const [status, setStatus] = useState<BrowserGeolocationStatus>("pending");
  const [position, setPosition] = useState<UserPosition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!navigator.geolocation) {
      const timeoutId = window.setTimeout(() => {
        setStatus("unavailable");
        setPosition(null);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setStatus("granted");
      },
      (err) => {
        setPosition(null);
        if (err.code === 1) {
          setStatus("denied");
        } else if (err.code === 2) {
          setStatus("unavailable");
        } else if (err.code === 3) {
          setStatus("timeout");
        } else {
          setStatus("error");
        }
      },
      GEO_OPTIONS,
    );
  }, []);

  const locationMessage = locationMessageForStatus(status);

  const userLocation = status === "granted" && position ? position : null;

  return {
    status,
    locationMessage,
    userLocation,
  };
}
