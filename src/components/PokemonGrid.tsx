"use client";

import { motion } from "framer-motion";
import { PokemonCard } from "@/components/PokemonCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PokemonListItem } from "@/types/pokemon";

export function PokemonGrid({
  pokemons,
  favorites,
  onToggleFavorite,
}: {
  pokemons: PokemonListItem[];
  favorites: string[];
  onToggleFavorite: (name: string) => void;
}) {
  if (pokemons.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-12 text-center text-slate-300">
        No Pokémon found matching your search.
      </div>
    );
  }

  return (
    <div className="grid-scroll-shell overscroll-contain touch-pan-y">
      <div className="pokemon-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pokemons.map((pokemon) => (
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
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

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
