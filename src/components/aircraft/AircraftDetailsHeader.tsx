import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCallsign, UNAVAILABLE } from "@/lib/formatting/aircraft";
import type { AircraftState } from "@/types/aircraft";

type AircraftDetailsHeaderProps = {
  state: AircraftState;
};

export function AircraftDetailsHeader({ state }: AircraftDetailsHeaderProps) {
  const callsignLabel = formatCallsign(state.callsign);
  const title =
    callsignLabel === UNAVAILABLE ? state.icao24.toUpperCase() : callsignLabel;
  const mode = state.onGround ? "On ground" : "Airborne";

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {title}
          </CardTitle>
          <Badge variant={state.onGround ? "secondary" : "default"}>
            {mode}
          </Badge>
        </div>
        <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>
            <span className="text-muted-foreground">ICAO24</span>{" "}
            <span className="font-mono text-foreground">{state.icao24}</span>
          </span>
          <span>
            <span className="text-muted-foreground">Origin country</span>{" "}
            <span className="text-foreground">{state.originCountry}</span>
          </span>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
