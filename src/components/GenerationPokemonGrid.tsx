"use client";

import { PokemonGrid } from "@/components/PokemonGrid";
import { toggleFavoriteName, useFavoriteNames } from "@/lib/favorites";
import type { PokemonListItem } from "@/types/pokemon";

export function GenerationPokemonGrid({
  pokemons,
}: {
  pokemons: PokemonListItem[];
}) {
  const favorites = useFavoriteNames();

  const handleToggleFavorite = (name: string) => {
    toggleFavoriteName(name, favorites);
  };

  return (
    <PokemonGrid
      pokemons={pokemons}
      favorites={favorites}
      onToggleFavorite={handleToggleFavorite}
    />
  );
}
