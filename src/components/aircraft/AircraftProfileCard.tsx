import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AircraftProfile } from "@/types/aircraft-profile";

type AircraftProfileCardProps = {
  profile: AircraftProfile;
};

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr] sm:gap-3">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}

export function AircraftProfileCard({ profile }: AircraftProfileCardProps) {
  const { metadata, photo } = profile;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aircraft profile</CardTitle>
        <CardDescription>
          Static aircraft database information (HexDB) and community photos
          (Planespotters) when available. This is separate from live OpenSky
          position and state data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="space-y-3">
            {metadata ? (
              <div className="space-y-3 text-sm">
                <MetadataRow
                  label="Registration"
                  value={metadata.registration ?? "Unavailable"}
                />
                <MetadataRow
                  label="Manufacturer"
                  value={metadata.manufacturer ?? "Unavailable"}
                />
                <MetadataRow
                  label="Type code"
                  value={metadata.aircraftTypeCode ?? "Unavailable"}
                />
                <MetadataRow
                  label="Type / model"
                  value={metadata.aircraftTypeName ?? "Unavailable"}
                />
                <MetadataRow
                  label="Operator / owner"
                  value={metadata.operatorOrOwner ?? "Unavailable"}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No aircraft database profile was found for this ICAO24 address.
              </p>
            )}
          </div>

          <div className="space-y-2">
            {photo ? (
              <>
                <a
                  href={photo.photoPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg ring-1 ring-foreground/10"
                >
                  {/* Hotlinked Planespotters URL; intentionally not next/image. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={`Aircraft photo by ${photo.photographerCredit}`}
                    className="h-auto w-full object-cover"
                    loading="lazy"
                  />
                </a>
                <p className="text-xs text-muted-foreground">
                  <a
                    href={photo.photoPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Photo by {photo.photographerCredit} via Planespotters.net
                  </a>
                </p>
              </>
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                No public aircraft photo available.
              </div>
            )}
          </div>
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground">
          HexDB and Planespotters data are community-sourced and may be
          incomplete. AeroTrack does not store or modify third-party images.
        </p>
      </CardContent>
    </Card>
  );
}
