import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatAltitude,
  formatBooleanStatus,
  formatCoordinates,
  formatCallsign,
  formatHeading,
  formatNullable,
  formatPositionSource,
  formatSpeed,
  formatSquawk,
  formatUnixTimestamp,
  formatVerticalRate,
} from "@/lib/formatting/aircraft";
import type { AircraftState } from "@/types/aircraft";

type AircraftStateDetailsProps = {
  state: AircraftState;
};

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm text-foreground sm:font-sans">{value}</dd>
    </div>
  );
}

export function AircraftStateDetails({ state }: AircraftStateDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">State vector</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          <Field label="ICAO24" value={state.icao24} />
          <Field label="Callsign" value={formatCallsign(state.callsign)} />
          <Field label="Origin country" value={state.originCountry} />
          <Field
            label="Latitude"
            value={formatNullable(state.latitude, (lat) => lat.toFixed(5))}
          />
          <Field
            label="Longitude"
            value={formatNullable(state.longitude, (lng) => lng.toFixed(5))}
          />
          <Field
            label="Coordinates"
            value={formatCoordinates(state.latitude, state.longitude)}
          />
          <Field
            label="Barometric altitude"
            value={formatAltitude(state.baroAltitude)}
          />
          <Field
            label="Geometric altitude"
            value={formatAltitude(state.geoAltitude)}
          />
          <Field label="Speed" value={formatSpeed(state.velocity)} />
          <Field label="Heading" value={formatHeading(state.trueTrack)} />
          <Field
            label="Vertical rate"
            value={formatVerticalRate(state.verticalRate)}
          />
          <Field label="Squawk" value={formatSquawk(state.squawk)} />
          <Field label="SPI" value={formatBooleanStatus(state.spi)} />
          <Field
            label="Position source"
            value={formatPositionSource(state.positionSource)}
          />
          <Field
            label="Last contact"
            value={formatUnixTimestamp(state.lastContact)}
          />
          <Field
            label="Last position update"
            value={formatUnixTimestamp(state.timePosition)}
          />
        </dl>
      </CardContent>
    </Card>
  );
}
