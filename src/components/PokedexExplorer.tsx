"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PokemonGrid } from "@/components/PokemonGrid";
import { PokeBotModal } from "@/components/PokeBotModal";
import { SearchBar } from "@/components/SearchBar";
import { SortControl } from "@/components/SortControl";
import { TypeFilter } from "@/components/TypeFilter";
import { getFavoriteNames, toggleFavoriteName } from "@/lib/favorites";
import type { PokemonListItem } from "@/types/pokemon";

export function PokedexExplorer({
  initialPokemons,
  types,
}: {
  initialPokemons: PokemonListItem[];
  types: string[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "type">(
    "all",
  );
  const [activeType, setActiveType] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [visibleCount, setVisibleCount] = useState(24);
  const [botLimit, setBotLimit] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>(getFavoriteNames);

  const visiblePokemons = useMemo(
    () => initialPokemons.slice(0, visibleCount),
    [initialPokemons, visibleCount],
  );

  const filteredPokemons = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = visiblePokemons.filter((pokemon) => {
      const matchesSearch =
        query.length === 0 || pokemon.name.toLowerCase().includes(query);
      const matchesFavorites =
        activeTab !== "favorites" || favorites.includes(pokemon.name);
      const matchesType =
        activeTab === "all" ||
        activeTab === "favorites" ||
        pokemon.types.includes(activeType);

      return matchesSearch && matchesFavorites && matchesType;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "base_stat_total") {
        return b.baseStatTotal - a.baseStatTotal;
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "favorites") {
        const favDiff =
          Number(favorites.includes(b.name)) -
          Number(favorites.includes(a.name));
        if (favDiff !== 0) return favDiff;
      }

      return a.id - b.id;
    });

    return botLimit ? sorted.slice(0, botLimit) : sorted;
  }, [
    activeTab,
    activeType,
    botLimit,
    favorites,
    search,
    sortBy,
    visiblePokemons,
  ]);

  const handleToggleFavorite = (name: string) => {
    setFavorites((current) => toggleFavoriteName(name, current));
  };

  const handlePokeBotAction = (action: string, payload: unknown) => {
    const args = payload as Record<string, string | number | undefined>;

    if (action === "filter_pokemon") {
      setBotLimit(typeof args.limit === "number" ? args.limit : null);
      setSortBy(typeof args.ranking === "string" ? args.ranking : "id");
      if (args.limit) {
        setVisibleCount(initialPokemons.length);
      }
      if (typeof args.type === "string" && args.type) {
        setActiveType(args.type);
        setActiveTab("type");
      }

      if (typeof args.search === "string" && args.search) {
        setSearch(args.search);
        setActiveTab("all");
      }

      if (!args.type && !args.search) {
        setActiveType("all");
        setActiveTab("all");
      }

      return;
    }

    if (action === "open_favorites") {
      setActiveTab("favorites");
      setFavorites(getFavoriteNames());
      return;
    }

    if (action === "navigate_to_pokemon" && args.name) {
      router.push(`/pokemon/${args.name}`);
    }
  };

  const hasMore = visibleCount < initialPokemons.length;

  return (
    <main
      style={{ willChange: "transform" }}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_40%),linear-gradient(180deg,#020817_0%,#0f172a_100%)] px-4 py-10 text-white sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">
              Pokédex
            </p>
            <h1
              className="text-4xl font-black tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pokémon Explorer
            </h1>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SearchBar value={search} onChange={setSearch} />
            <div className="flex flex-wrap items-center gap-2">
              <PokeBotModal onAction={handlePokeBotAction} />
              <TypeFilter
                types={types}
                activeType={activeType}
                onChange={(nextType) => {
                  setActiveType(nextType);
                  setActiveTab("type");
                }}
              />
              <SortControl value={sortBy} onChange={setSortBy} />
            </div>
          </div>
        </header>

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
            <span>
              Showing{" "}
              <strong className="text-white">{filteredPokemons.length}</strong>{" "}
              Pokémon
            </span>
            {activeTab !== "all" && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Filter: {activeTab === "favorites" ? "Favorites" : activeType}
              </span>
            )}
          </div>

          <PokemonGrid
            pokemons={filteredPokemons}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((current) =>
                    Math.min(current + 24, initialPokemons.length),
                  )
                }
                className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20"
              >
                Load More
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
