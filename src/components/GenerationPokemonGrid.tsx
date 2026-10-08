"use client";

import { PokemonGrid } from "@/components/PokemonGrid";
import { toggleFavoriteName, useFavoriteNames } from "@/lib/favorites";
import { useCallback } from "react";
import type { PokemonListItem } from "@/types/pokemon";

export function GenerationPokemonGrid({
  pokemons,
}: {
  pokemons: PokemonListItem[];
}) {
  const favorites = useFavoriteNames();

  const handleToggleFavorite = useCallback(
    (name: string) => {
      toggleFavoriteName(name, favorites);
    },
    [favorites],
  );

  return (
    <PokemonGrid
      pokemons={pokemons}
      favorites={favorites}
      onToggleFavorite={handleToggleFavorite}
    />
  );
}
