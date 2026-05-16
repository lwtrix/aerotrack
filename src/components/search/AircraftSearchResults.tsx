"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAircraftAltitudeSummary,
  formatCallsign,
  formatHeading,
  formatSpeed,
  formatUnixTimestamp,
} from "@/lib/formatting/aircraft";
import type { AircraftState } from "@/types/aircraft";
import type { AircraftSearchPageResult } from "@/types/aircraft-search";

type AircraftSearchResultsProps = {
  aircraft: AircraftState[];
  pageResult: AircraftSearchPageResult<AircraftState>;
  emptyMessage: string;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

function StatusBadge({ aircraft }: { aircraft: AircraftState }) {
  return aircraft.onGround ? (
    <Badge variant="outline">On ground</Badge>
  ) : (
    <Badge variant="secondary">Airborne</Badge>
  );
}

export function AircraftSearchResults({
  aircraft,
  pageResult,
  emptyMessage,
  onPreviousPage,
  onNextPage,
}: AircraftSearchResultsProps) {
  if (aircraft.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No aircraft found</CardTitle>
          <CardDescription>{emptyMessage}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Search results</CardTitle>
            <CardDescription aria-live="polite">
              Showing {pageResult.startIndex}-{pageResult.endIndex} of{" "}
              {pageResult.totalResults} results
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
              disabled={pageResult.page <= 1}
            >
              Previous
            </Button>
            <span aria-live="polite">
              Page {pageResult.page} of {pageResult.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={pageResult.page >= pageResult.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Callsign</TableHead>
              <TableHead>ICAO24</TableHead>
              <TableHead>Origin country</TableHead>
              <TableHead>Altitude</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Heading</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last contact</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aircraft.map((item) => {
              const href = `/aircraft/${item.icao24.toLowerCase()}`;

              return (
                <TableRow key={item.icao24}>
                  <TableCell className="font-medium">
                    {formatCallsign(item.callsign)}
                  </TableCell>
                  <TableCell className="font-mono text-xs uppercase">
                    {item.icao24}
                  </TableCell>
                  <TableCell>{item.originCountry}</TableCell>
                  <TableCell>{formatAircraftAltitudeSummary(item)}</TableCell>
                  <TableCell>{formatSpeed(item.velocity)}</TableCell>
                  <TableCell>{formatHeading(item.trueTrack)}</TableCell>
                  <TableCell>
                    <StatusBadge aircraft={item} />
                  </TableCell>
                  <TableCell>{formatUnixTimestamp(item.lastContact)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={href}>View details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <div className="flex flex-col gap-2 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite">
          Showing {pageResult.startIndex}-{pageResult.endIndex} of{" "}
          {pageResult.totalResults} results
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={pageResult.page <= 1}
          >
            Previous
          </Button>
          <span>
            Page {pageResult.page} of {pageResult.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={pageResult.page >= pageResult.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
