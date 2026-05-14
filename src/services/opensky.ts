import type { AircraftState } from "@/types/aircraft";
import {
  OpenSkyRequestError,
  clampOpenSkyRetryAfterSeconds,
  defaultRetrySecondsForCode,
  isOpenSkyRequestError,
  parseOpenSkyRetryAfterSecondsFromResponse,
} from "@/services/opensky-errors";

type OpenSkyResponse = {
  time: number;
  states: unknown[][] | null;
};

const ICAO24_HEX = /^[0-9a-f]{6}$/i;
const OPEN_SKY_FETCH_TIMEOUT_MS = 15_000;

function normalizeStateVector(state: unknown[]): AircraftState {
  return {
    icao24: String(state[0]),
    callsign: state[1] ? String(state[1]).trim() : null,
    originCountry: String(state[2]),
    timePosition: typeof state[3] === "number" ? state[3] : null,
    lastContact: Number(state[4]),
    longitude: typeof state[5] === "number" ? state[5] : null,
    latitude: typeof state[6] === "number" ? state[6] : null,
    baroAltitude: typeof state[7] === "number" ? state[7] : null,
    onGround: Boolean(state[8]),
    velocity: typeof state[9] === "number" ? state[9] : null,
    trueTrack: typeof state[10] === "number" ? state[10] : null,
    verticalRate: typeof state[11] === "number" ? state[11] : null,
    geoAltitude: typeof state[13] === "number" ? state[13] : null,
    squawk: state[14] ? String(state[14]) : null,
    spi: Boolean(state[15]),
    positionSource: typeof state[16] === "number" ? state[16] : 0,
  };
}

function normalizeAllStates(data: OpenSkyResponse): AircraftState[] {
  if (!data.states) {
    return [];
  }
  return data.states.map(normalizeStateVector);
}

function mergeRetryWithHeader(
  code: Parameters<typeof defaultRetrySecondsForCode>[0],
  response: Response,
): number {
  const fromHeader = parseOpenSkyRetryAfterSecondsFromResponse(response);
  return clampOpenSkyRetryAfterSeconds(
    fromHeader ?? defaultRetrySecondsForCode(code),
  );
}

function openSkyErrorFromHttpResponse(response: Response): OpenSkyRequestError {
  const status = response.status;
  const httpStatus = status;

  if (status === 429) {
    return new OpenSkyRequestError("OpenSky rate limit.", "rate_limited", {
      httpStatus,
      retryAfterSeconds: mergeRetryWithHeader("rate_limited", response),
    });
  }
  if (status === 401 || status === 403) {
    return new OpenSkyRequestError("OpenSky access denied.", "forbidden", {
      httpStatus,
      retryAfterSeconds: mergeRetryWithHeader("forbidden", response),
    });
  }
  if (status === 400) {
    return new OpenSkyRequestError("OpenSky rejected the request.", "bad_request", {
      httpStatus,
      retryAfterSeconds: mergeRetryWithHeader("bad_request", response),
    });
  }
  if (status >= 500 && status <= 599) {
    return new OpenSkyRequestError(
      "OpenSky server error.",
      "upstream_unavailable",
      {
        httpStatus,
        retryAfterSeconds: mergeRetryWithHeader("upstream_unavailable", response),
      },
    );
  }

  return new OpenSkyRequestError(
    "Unexpected OpenSky response.",
    "upstream_unavailable",
    {
      httpStatus,
      retryAfterSeconds: mergeRetryWithHeader("upstream_unavailable", response),
    },
  );
}

function mapUnknownFetchError(error: unknown): OpenSkyRequestError {
  if (isOpenSkyRequestError(error)) {
    return error;
  }
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return new OpenSkyRequestError("OpenSky request timed out.", "timeout", {
      retryAfterSeconds: defaultRetrySecondsForCode("timeout"),
    });
  }
  return new OpenSkyRequestError(
    "Unable to reach OpenSky.",
    "network_error",
    {
      retryAfterSeconds: defaultRetrySecondsForCode("network_error"),
    },
  );
}

async function fetchOpenSkyJson(
  url: string,
  init: { next?: { revalidate?: number }; cache?: RequestCache },
): Promise<OpenSkyResponse> {
  try {
    const signal = AbortSignal.timeout(OPEN_SKY_FETCH_TIMEOUT_MS);
    const response = await fetch(url, {
      ...init,
      signal,
    });

    if (!response.ok) {
      throw openSkyErrorFromHttpResponse(response);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new OpenSkyRequestError(
        "Invalid JSON from OpenSky.",
        "upstream_unavailable",
        {
          httpStatus: response.status,
          retryAfterSeconds: mergeRetryWithHeader(
            "upstream_unavailable",
            response,
          ),
        },
      );
    }

    if (!data || typeof data !== "object") {
      throw new OpenSkyRequestError(
        "Unexpected OpenSky payload.",
        "upstream_unavailable",
        {
          httpStatus: response.status,
          retryAfterSeconds: mergeRetryWithHeader(
            "upstream_unavailable",
            response,
          ),
        },
      );
    }

    return data as OpenSkyResponse;
  } catch (error) {
    throw mapUnknownFetchError(error);
  }
}

export function normaliseIcao24Param(icao24: string): string | null {
  const trimmed = icao24.trim().toLowerCase();
  if (!ICAO24_HEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export async function getLiveAircraftStates(): Promise<AircraftState[]> {
  const data = await fetchOpenSkyJson(
    "https://opensky-network.org/api/states/all",
    {
      next: {
        revalidate: 30,
      },
    },
  );

  return normalizeAllStates(data).filter(
    (aircraft) =>
      aircraft.latitude !== null && aircraft.longitude !== null,
  );
}

/**
 * Fetches the latest state vector for one aircraft from OpenSky.
 * Returns null when OpenSky has no matching state rows.
 * Throws OpenSkyRequestError on HTTP/network failures.
 */
export async function getAircraftStateByIcao24(
  icao24: string,
): Promise<AircraftState | null> {
  const normalized = normaliseIcao24Param(icao24);
  if (!normalized) {
    return null;
  }

  const url = new URL("https://opensky-network.org/api/states/all");
  url.searchParams.set("icao24", normalized);

  const data = await fetchOpenSkyJson(url.toString(), {
    cache: "no-store",
  });

  const states = normalizeAllStates(data);
  if (states.length === 0) {
    return null;
  }

  return states[0] ?? null;
}
