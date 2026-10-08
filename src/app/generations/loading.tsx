import { PokemonGridSkeleton } from "@/components/PokemonGrid";

export default function GenerationsLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_40%),linear-gradient(180deg,#020817_0%,#0f172a_100%)] px-4 py-8 text-white sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 h-10 w-40 animate-pulse rounded-full bg-slate-800" />
        <div className="mb-8 h-40 animate-pulse rounded-[2rem] border border-white/10 bg-slate-900/70" />
        <PokemonGridSkeleton />
      </div>
    </main>
  );
}
