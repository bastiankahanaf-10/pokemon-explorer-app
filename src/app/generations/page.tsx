import Link from "next/link";
import { getGenerationById } from "@/lib/pokeapi";

const GENERATION_IDS = Array.from({ length: 9 }, (_, index) => index + 1);

function formatGenerationTitle(name: string) {
  const numeral = name.split("-").at(-1)?.toUpperCase();
  return numeral ? `Generation ${numeral}` : name;
}

export default async function GenerationsPage() {
  const generations = await Promise.all(
    GENERATION_IDS.map(async (id) => {
      const generation = await getGenerationById(id);
      if (!generation) {
        throw new Error(`Generation ${id} was not found in PokéAPI`);
      }
      return generation;
    }),
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_40%),linear-gradient(180deg,#020817_0%,#0f172a_100%)] px-4 py-8 text-white sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-flex rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-100"
        >
          ← Back to Pokédex
        </Link>

        <header className="mb-8 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
            Pokémon Explorer
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Generations
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Explore Pokémon by generation, from Kanto to Paldea.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generations.map((generation) => (
            <Link
              key={generation.id}
              href={`/generations/${generation.id}`}
              className="group rounded-3xl border border-white/10 bg-slate-900/70 p-5 transition duration-200 hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                    {generation.main_region.name} region
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {formatGenerationTitle(generation.name)}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
                  {generation.pokemon_species.length} Pokémon
                </span>
              </div>
              <p className="mt-5 text-sm font-medium text-cyan-100 transition group-hover:text-cyan-300">
                View generation <span aria-hidden="true">→</span>
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
