import type { Metadata } from "next";
import Link from "next/link";

import { AircraftDetailsHeader } from "@/components/aircraft/AircraftDetailsHeader";
import { AircraftDetailsMessage } from "@/components/aircraft/AircraftDetailsMessage";
import { AircraftPositionMap } from "@/components/aircraft/AircraftPositionMap";
import { AircraftProfileCard } from "@/components/aircraft/AircraftProfileCard";
import { AircraftStateDetails } from "@/components/aircraft/AircraftStateDetails";
import { Button } from "@/components/ui/button";
import { getAircraftProfileByIcao24 } from "@/services/aircraft-profile";
import { isOpenSkyRequestError } from "@/services/opensky-errors";
import {
  getAircraftStateByIcao24,
  normaliseIcao24Param,
} from "@/services/opensky";
import type { AircraftState } from "@/types/aircraft";

type AircraftDetailsPageProps = {
  params: Promise<{
    icao24: string;
  }>;
};

export async function generateMetadata({
  params,
}: AircraftDetailsPageProps): Promise<Metadata> {
  const { icao24 } = await params;
  const normalized = normaliseIcao24Param(icao24);

  if (!normalized) {
    return { title: "Invalid aircraft | AeroTrack" };
  }

  return {
    title: `Aircraft ${normalized.toUpperCase()} | AeroTrack`,
    description:
      "Live aircraft state from OpenSky. Schedules, gates, and itinerary details are not available from this data source.",
  };
}

export default async function AircraftDetailsPage({
  params,
}: AircraftDetailsPageProps) {
  const { icao24 } = await params;
  const normalized = normaliseIcao24Param(icao24);

  if (!normalized) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <AircraftDetailsMessage variant="invalid" />
        </div>
      </main>
    );
  }

  const profile = await getAircraftProfileByIcao24(normalized);

  let liveError = false;
  let state: AircraftState | null = null;

  try {
    state = await getAircraftStateByIcao24(normalized);
  } catch (error) {
    liveError = true;
    if (!isOpenSkyRequestError(error)) {
      console.error("Unexpected aircraft details fetch error:", error);
    }
  }

  const position =
    state &&
    state.latitude !== null &&
    state.longitude !== null &&
    Number.isFinite(state.latitude) &&
    Number.isFinite(state.longitude)
      ? { lat: state.latitude, lng: state.longitude }
      : null;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Aircraft
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/map">Back to live map</Link>
          </Button>
        </div>

        <AircraftProfileCard profile={profile} />

        {liveError ? (
          <AircraftDetailsMessage variant="error" />
        ) : state === null ? (
          <AircraftDetailsMessage
            variant="not_visible"
            icao24={normalized}
          />
        ) : (
          <>
            <AircraftDetailsHeader state={state} />

            {position ? (
              <section className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Live position (OpenSky)
                </h2>
                <AircraftPositionMap
                  latitude={position.lat}
                  longitude={position.lng}
                />
              </section>
            ) : null}

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Live state (OpenSky)
              </h2>
              <AircraftStateDetails state={state} />
            </section>

            <p className="max-w-3xl text-xs text-muted-foreground">
              Live position and kinematics reflect the latest state vector
              returned by OpenSky. They do not include commercial schedules,
              gates, terminals, or passenger information.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
