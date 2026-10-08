"use client";

import { motion } from "framer-motion";
import { memo, useSyncExternalStore } from "react";
import { PokemonCard } from "@/components/PokemonCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PokemonListItem } from "@/types/pokemon";

function subscribeToHoverChanges(callback: () => void) {
  const mediaQuery = window.matchMedia("(hover: hover)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getCanHoverSnapshot() {
  return window.matchMedia("(hover: hover)").matches;
}

function getServerCanHoverSnapshot() {
  return false;
}

function PokemonGridComponent({
  pokemons,
  favorites,
  onToggleFavorite,
}: {
  pokemons: PokemonListItem[];
  favorites: string[];
  onToggleFavorite: (name: string) => void;
}) {
  const canHover = useSyncExternalStore(
    subscribeToHoverChanges,
    getCanHoverSnapshot,
    getServerCanHoverSnapshot,
  );

  if (pokemons.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-12 text-center text-slate-300">
        No Pokémon found matching your search.
      </div>
    );
  }

  return (
    <div className="grid-scroll-shell touch-pan-y">
      <div className="pokemon-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pokemons.map((pokemon, index) => (
          <motion.div
            key={pokemon.id}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="min-w-0"
          >
            <PokemonCard
              pokemon={pokemon}
              isFavorite={favorites.includes(pokemon.name)}
              onToggleFavorite={onToggleFavorite}
              canHover={canHover}
              loading={index < 4 ? "eager" : "lazy"}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const PokemonGrid = memo(PokemonGridComponent);

export function PokemonGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-4"
        >
          <Skeleton className="mx-auto h-32 w-32 rounded-full" />
          <Skeleton className="mx-auto h-4 w-20 rounded-full" />
          <Skeleton className="mx-auto h-6 w-24 rounded-full" />
          <div className="flex justify-center gap-2">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
