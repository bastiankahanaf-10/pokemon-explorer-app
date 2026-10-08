import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerationPokemonGrid } from "@/components/GenerationPokemonGrid";
import { getGenerationById, getPokemonByGeneration } from "@/lib/pokeapi";

function formatGenerationTitle(name: string) {
  const numeral = name.split("-").at(-1)?.toUpperCase();
  return numeral ? `Generation ${numeral}` : name;
}

export default async function GenerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  if (!/^[1-9]$/.test(idParam)) {
    notFound();
  }

  const generation = await getGenerationById(Number(idParam));
  if (!generation) {
    notFound();
  }

  const pokemons = await getPokemonByGeneration(generation);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_40%),linear-gradient(180deg,#020817_0%,#0f172a_100%)] px-4 py-8 text-white sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/generations"
            className="inline-flex rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-100"
          >
            ← All generations
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-100"
          >
            Pokédex home
          </Link>
        </div>

        <header className="mb-8 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
            {generation.main_region.name} region
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            {formatGenerationTitle(generation.name)}
          </h1>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            {pokemons.length} Pokémon in this generation
          </p>
        </header>

        <GenerationPokemonGrid pokemons={pokemons} />
      </div>
    </main>
  );
}
