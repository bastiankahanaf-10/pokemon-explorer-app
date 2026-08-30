import Link from "next/link";
import { notFound } from "next/navigation";
import { PokemonDetailClient } from "@/components/PokemonDetailClient";
import { getPokemonByName } from "@/lib/pokeapi";

const getStatTone = (name: string) => {
  const normalized = name.toLowerCase();

  if (normalized.includes("hp")) return "from-rose-400 to-pink-500";
  if (normalized.includes("attack")) return "from-orange-400 to-amber-500";
  if (normalized.includes("defense")) return "from-emerald-400 to-teal-500";
  if (normalized.includes("special")) return "from-violet-400 to-indigo-500";
  if (normalized.includes("speed")) return "from-cyan-400 to-sky-500";

  return "from-cyan-400 to-blue-500";
};

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const pokemon = await getPokemonByName(name);

  if (!pokemon) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_40%),linear-gradient(180deg,#020817_0%,#0f172a_100%)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
        >
          ← Back to Pokédex
        </Link>

        <PokemonDetailClient
          name={pokemon.name}
          image={pokemon.image}
          id={pokemon.id}
          types={pokemon.types}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Height
              </p>
              <p className="mt-2 text-lg font-semibold">
                {pokemon.height / 10} m
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Weight
              </p>
              <p className="mt-2 text-lg font-semibold">
                {pokemon.weight / 10} kg
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Order
              </p>
              <p className="mt-2 text-lg font-semibold">#{pokemon.order}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <h2 className="mb-3 text-lg font-semibold">Abilities</h2>
              <ul className="space-y-2 text-slate-200">
                {pokemon.abilities.map((ability) => (
                  <li
                    key={ability}
                    className="rounded-xl bg-slate-800/80 px-3 py-2"
                  >
                    {ability}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <h2 className="mb-3 text-lg font-semibold">Base Stats</h2>
              <div className="space-y-3">
                {pokemon.stats.map((stat) => {
                  const percent = Math.min((stat.value / 255) * 100, 100);
                  const tone = getStatTone(stat.name);

                  return (
                    <div key={stat.name}>
                      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        <span>{stat.name}</span>
                        <span>{stat.value}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${tone} transition-[width] duration-500 ease-out`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </PokemonDetailClient>
      </div>
    </main>
  );
}
