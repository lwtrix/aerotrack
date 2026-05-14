type AircraftDetailsPageProps = {
    params: Promise<{
      icao24: string;
    }>;
  };
  
  export default async function AircraftDetailsPage({
    params,
  }: AircraftDetailsPageProps) {
    const { icao24 } = await params;
  
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Aircraft
          </p>
  
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {icao24}
          </h1>
  
          <p className="mt-2 text-muted-foreground">
            Aircraft details will appear here.
          </p>
        </div>
      </main>
    );
  }