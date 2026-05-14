"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const LiveMapSection = dynamic(() => import("./LiveMapSection"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-[560px] w-full rounded-xl" />
    </div>
  ),
});

export function LiveMapLoader() {
  return <LiveMapSection />;
}
