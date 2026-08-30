import { PokemonPageClient } from "@/components/PokemonPageClient";
import { getPokemonList, getPokemonTypes } from "@/lib/pokeapi";

export default async function HomePage() {
  const [pokemons, types] = await Promise.all([
    getPokemonList(151),
    getPokemonTypes(),
  ]);

  return <PokemonPageClient initialPokemons={pokemons} types={types} />;
}
