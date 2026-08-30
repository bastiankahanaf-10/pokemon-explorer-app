"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PokemonGrid, PokemonGridSkeleton } from "@/components/PokemonGrid";
import { SearchBar } from "@/components/SearchBar";
import { SortControl } from "@/components/SortControl";
import { TypeFilter } from "@/components/TypeFilter";
import { getFavoriteNames, toggleFavoriteName } from "@/lib/favorites";
import type { PokemonListItem } from "@/types/pokemon";

export function PokemonPageClient({
  initialPokemons,
  types,
}: {
  initialPokemons: PokemonListItem[];
  types: string[];
}) {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [visibleCount, setVisibleCount] = useState(24);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFavorites(getFavoriteNames());
  }, []);

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
        activeType !== "favorites" || favorites.includes(pokemon.name);
      const matchesType =
        activeType === "all" ||
        activeType === "favorites" ||
        pokemon.types.includes(activeType);

      return matchesSearch && matchesFavorites && matchesType;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "favorites") {
        const favoriteDelta =
          Number(favorites.includes(b.name)) -
          Number(favorites.includes(a.name));
        if (favoriteDelta !== 0) return favoriteDelta;
      }
      return a.id - b.id;
    });
  }, [activeType, favorites, search, sortBy, visiblePokemons]);

  const handleToggleFavorite = (name: string) => {
    setFavorites((current) => toggleFavoriteName(name, current));
  };

  const handleLoadMore = () => {
    if (visibleCount >= initialPokemons.length) return;
    setIsLoading(true);
    window.setTimeout(() => {
      setVisibleCount((current) =>
        Math.min(current + 24, initialPokemons.length),
      );
      setIsLoading(false);
    }, 350);
  };

  const handleToggleFavorites = () => {
    setActiveType((current) => (current === "favorites" ? "all" : "favorites"));
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= initialPokemons.length) return;

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
  }, [initialPokemons.length, isLoading, visibleCount]);

  const hasMore = visibleCount < initialPokemons.length;

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

            <div className="inline-flex w-fit items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100">
              Gen I • 151
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SearchBar value={search} onChange={setSearch} />
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
                <TypeFilter
                  types={types}
                  activeType={activeType}
                  onChange={setActiveType}
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
            {activeType !== "all" && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Filter: {activeType}
              </span>
            )}
          </div>

          {isLoading ? (
            <PokemonGridSkeleton />
          ) : (
            <PokemonGrid
              pokemons={filteredPokemons}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex min-h-12 justify-center py-4"
            >
              <div className="h-1.5 w-24 rounded-full bg-slate-300/80 dark:bg-slate-700" />
            </div>
          )}

          {isLoading && <PokemonGridSkeleton />}
        </section>
      </div>

      <BottomNav
        activeType={activeType}
        onChangeType={setActiveType}
        onToggleFavorites={handleToggleFavorites}
        types={types}
      />
    </main>
  );
}
