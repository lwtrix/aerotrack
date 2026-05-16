import { AircraftSearchClient } from "@/components/search/AircraftSearchClient";

export default function SearchPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Search Aircraft
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Search the current aircraft snapshot by callsign, ICAO24 address, or
            origin country. Results are filtered locally so typing does not
            trigger additional live data requests.
          </p>
        </div>

        <AircraftSearchClient />
      </div>
    </main>
  );
}