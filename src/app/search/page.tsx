export default function SearchPage() {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight">
            Search Aircraft
          </h1>
          <p className="mt-2 text-muted-foreground">
            Search by callsign, ICAO24, airline, airport, or route.
          </p>
        </div>
      </main>
    );
  }