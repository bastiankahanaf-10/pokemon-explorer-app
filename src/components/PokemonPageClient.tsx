"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PokemonGrid } from "@/components/PokemonGrid";
import { PokeBotModal } from "@/components/PokeBotModal";
import { SearchBar } from "@/components/SearchBar";
import { SortControl } from "@/components/SortControl";
import { TypeFilter } from "@/components/TypeFilter";
import { toggleFavoriteName, useFavoriteNames } from "@/lib/favorites";
import type { PokemonListItem } from "@/types/pokemon";

export function PokemonPageClient({
  initialPokemons,
  totalCount,
  types,
}: {
  initialPokemons: PokemonListItem[];
  totalCount: number;
  types: string[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "type">(
    "all",
  );
  const [activeType, setActiveType] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [loadedPokemons, setLoadedPokemons] = useState(initialPokemons);
  const [botLimit, setBotLimit] = useState<number | null>(null);
  const favorites = useFavoriteNames();
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filteredPokemons = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = loadedPokemons.filter((pokemon) => {
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
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "favorites") {
        const favoriteDelta =
          Number(favorites.includes(b.name)) -
          Number(favorites.includes(a.name));
        if (favoriteDelta !== 0) return favoriteDelta;
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
    loadedPokemons,
  ]);

  const handleToggleFavorite = (name: string) => {
    toggleFavoriteName(name, favorites);
  };

  const handlePokeBotAction = (action: string, payload: unknown) => {
    const args = payload as Record<string, string | number | undefined>;

    if (action === "filter_pokemon") {
      setBotLimit(typeof args.limit === "number" ? args.limit : null);
      setSortBy(typeof args.ranking === "string" ? args.ranking : "id");
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
      return;
    }

    if (action === "navigate_to_pokemon" && args.name) {
      router.push(`/pokemon/${args.name}`);
    }

    if (action === "navigate_to_generation" && args.generation) {
      router.push(`/generations/${args.generation}`);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (isLoading || loadedPokemons.length >= totalCount) return;
    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await fetch(`/api/pokemon?offset=${loadedPokemons.length}`);
      if (!response.ok) throw new Error("Failed to load Pokémon page");
      const page = (await response.json()) as {
        pokemons: PokemonListItem[];
        totalCount: number;
      };
      setLoadedPokemons((current) => [...current, ...page.pokemons]);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, loadedPokemons.length, totalCount]);

  const handleToggleFavorites = () => {
    const nextTab = activeTab === "favorites" ? "all" : "favorites";
    setActiveTab(nextTab);
    if (nextTab !== "favorites") {
      setActiveType("all");
    }
    setBotLimit(null);
    setSortBy("id");
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loadedPokemons.length >= totalCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isLoading) {
          handleLoadMore();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleLoadMore, isLoading, loadedPokemons.length, totalCount]);

  const hasMore = loadedPokemons.length < totalCount;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_40%),linear-gradient(180deg,#020817_0%,#0f172a_100%)] px-4 py-8 text-white sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">
                Pokédex
              </p>
              <h1
                className="text-4xl font-black tracking-tight sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Pokémon Explorer
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex w-fit items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100">
                Gen I–IX • {totalCount}
              </div>
              <Link
                href="/generations"
                className="inline-flex w-fit items-center rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-100"
              >
                All generations
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SearchBar value={search} onChange={setSearch} />
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
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
            <div
              ref={sentinelRef}
              className="flex min-h-12 flex-col items-center justify-center gap-2 py-4"
            >
              {isLoading ? (
                <div className="h-1.5 w-24 animate-pulse rounded-full bg-slate-300/80 dark:bg-slate-700" />
              ) : loadError ? (
                <button
                  type="button"
                  onClick={() => void handleLoadMore()}
                  className="text-sm text-cyan-200 hover:text-white"
                >
                  Couldn&apos;t load more Pokémon. Try again.
                </button>
              ) : (
                <div className="h-1.5 w-24 rounded-full bg-slate-300/80 dark:bg-slate-700" />
              )}
            </div>
          )}

        </section>
      </div>

      <PokeBotModal
        onAction={handlePokeBotAction}
        favoriteNames={favorites}
      />

      <BottomNav
        activeTab={activeTab}
        activeType={activeType}
        onChangeTab={setActiveTab}
        onChangeType={(nextType) => {
          setActiveType(nextType);
          setActiveTab("type");
        }}
        onToggleFavorites={handleToggleFavorites}
        types={types}
      />
    </main>
  );
}
