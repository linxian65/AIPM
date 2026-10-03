export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Hero } from "@/components/landing/Hero";
import { PresetGrid } from "@/components/landing/PresetGrid";
import { PresetGridSkeleton } from "@/components/landing/PresetGridSkeleton";

export default function Home() {
  return (
    <main>
      <Hero />
      <section className="container py-16">
        <h2 className="mb-6 text-2xl font-semibold">预置案例</h2>
        <Suspense fallback={<PresetGridSkeleton />}>
          <PresetGrid />
        </Suspense>
      </section>
    </main>
  );
}