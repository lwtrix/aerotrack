import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AircraftDetailsMessageVariant = "invalid" | "not_visible" | "error";

type AircraftDetailsMessageProps = {
  variant: AircraftDetailsMessageVariant;
  icao24?: string;
};

const copy: Record<
  AircraftDetailsMessageVariant,
  { title: string; description: string }
> = {
  invalid: {
    title: "Invalid aircraft address",
    description:
      "The ICAO24 value in the URL is not a valid 6-character hexadecimal aircraft address.",
  },
  not_visible: {
    title: "Aircraft not in live data",
    description:
      "OpenSky does not currently report a state vector for this aircraft. It may be on the ground without ADS-B, outside coverage, or temporarily not broadcasting.",
  },
  error: {
    title: "Unable to load aircraft",
    description:
      "We could not retrieve live state from OpenSky. Please try again in a moment.",
  },
};

export function AircraftDetailsMessage({
  variant,
  icao24,
}: AircraftDetailsMessageProps) {
  const { title, description } = copy[variant];

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {icao24 && variant === "not_visible" ? (
          <p className="pt-1 font-mono text-sm text-muted-foreground">
            ICAO24: {icao24}
          </p>
        ) : null}
      </CardHeader>
      <CardFooter className="border-t bg-muted/40">
        <Button asChild variant="outline" size="sm">
          <Link href="/map">Back to live map</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
