import { NextResponse } from "next/server";

import type { OpenSkyFailureCode } from "@/services/opensky-errors";
import {
  isOpenSkyRequestError,
  OpenSkyRequestError,
} from "@/services/opensky-errors";
import { getLiveAircraftStates } from "@/services/opensky";
import type { LiveFlightsApiResponse } from "@/types/live-flights";

const LIVE_ERROR_MESSAGES: Record<OpenSkyFailureCode, string> = {
  rate_limited:
    "Live aircraft data is temporarily rate-limited. Please try again in a few minutes.",
  forbidden:
    "Live aircraft data cannot be retrieved right now (access was denied by the upstream service).",
  bad_request:
    "The live aircraft request could not be completed.",
  upstream_unavailable:
    "Live aircraft data is temporarily unavailable. Please try again shortly.",
  timeout: "The live aircraft request timed out. Please try again shortly.",
  network_error:
    "Could not reach the live aircraft service. Check your connection and try again.",
};

function devForcedOpenSkyError(
  request: Request,
): OpenSkyRequestError | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  const force = new URL(request.url).searchParams.get("force_error");
  if (!force) {
    return null;
  }

  if (force === "rate_limited") {
    return new OpenSkyRequestError("dev", "rate_limited", { httpStatus: 429 });
  }
  if (force === "forbidden") {
    return new OpenSkyRequestError("dev", "forbidden", { httpStatus: 403 });
  }
  if (force === "upstream_unavailable") {
    return new OpenSkyRequestError("dev", "upstream_unavailable", {
      httpStatus: 503,
    });
  }
  if (force === "timeout") {
    return new OpenSkyRequestError("dev", "timeout");
  }

  return null;
}

function liveFlightsErrorResponse(error: OpenSkyRequestError) {
  const status = error.code === "bad_request" ? 400 : 503;
  const body: LiveFlightsApiResponse = {
    success: false,
    code: error.code,
    message: LIVE_ERROR_MESSAGES[error.code] ?? LIVE_ERROR_MESSAGES.upstream_unavailable,
    retryAfterSeconds: error.retryAfterSeconds,
    data: [],
  };
  return NextResponse.json(body, { status });
}

export async function GET(request: Request) {
  const forced = devForcedOpenSkyError(request);
  if (forced) {
    return liveFlightsErrorResponse(forced);
  }

  try {
    const aircraft = await getLiveAircraftStates();

    return NextResponse.json({
      success: true,
      count: aircraft.length,
      updatedAt: new Date().toISOString(),
      data: aircraft,
    });
  } catch (error) {
    if (isOpenSkyRequestError(error)) {
      console.error("OpenSky live flights error:", error.code, error.httpStatus);
      return liveFlightsErrorResponse(error);
    }

    console.error("Failed to fetch live aircraft states:", error);

    const fallback = new OpenSkyRequestError(
      "Unknown OpenSky failure.",
      "upstream_unavailable",
      { retryAfterSeconds: 120 },
    );
    return liveFlightsErrorResponse(fallback);
  }
}
