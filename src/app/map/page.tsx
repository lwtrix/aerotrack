import { LiveMapLoader } from "@/components/map/LiveMapLoader";

export default function MapPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Aircraft Map</h1>
          <p className="mt-2 text-muted-foreground">
            Near-real-time positions from AeroTrack (OpenSky-backed). The map
            refreshes every 30 seconds.
          </p>
        </div>

        <LiveMapLoader />
      </div>
    </main>
  );
}
