import { NextResponse } from "next/server";

import { getAircraftStateByIcao24, normaliseIcao24Param } from "@/services/opensky";
import type { SingleAircraftApiResponse } from "@/types/aircraft-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ icao24: string }> },
) {
  const { icao24 } = await context.params;
  const normalized = normaliseIcao24Param(icao24);

  if (!normalized) {
    return NextResponse.json<SingleAircraftApiResponse>(
      {
        success: false,
        code: "invalid_icao24",
        message: "Invalid ICAO24 aircraft address.",
      },
      { status: 400 },
    );
  }

  try {
    const state = await getAircraftStateByIcao24(normalized);

    if (!state) {
      return NextResponse.json<SingleAircraftApiResponse>(
        {
          success: false,
          code: "not_visible",
          message:
            "Aircraft is not currently visible in live OpenSky state data.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json<SingleAircraftApiResponse>(
      {
        success: true,
        updatedAt: new Date().toISOString(),
        data: state,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json<SingleAircraftApiResponse>(
      {
        success: false,
        code: "upstream_error",
        message: "Unable to retrieve aircraft state right now.",
      },
      { status: 502 },
    );
  }
}
