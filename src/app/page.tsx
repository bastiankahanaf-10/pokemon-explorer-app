import { PokemonPageClient } from "@/components/PokemonPageClient";
import { getPokemonPageAcrossGenerations, getPokemonTypes } from "@/lib/pokeapi";

export default async function HomePage() {
  const [{ pokemons, totalCount }, types] = await Promise.all([
    getPokemonPageAcrossGenerations(0, 24),
    getPokemonTypes(),
  ]);

  return (
    <PokemonPageClient
      initialPokemons={pokemons}
      totalCount={totalCount}
      types={types}
    />
  );
}
