import type { PokemonDetail, PokemonListItem } from "@/types/pokemon";

const API_BASE = "https://pokeapi.co/api/v2";

const fallbackPokemon: PokemonListItem[] = Array.from(
  { length: 24 },
  (_, index) => {
    const id = index + 1;
    return {
      id,
      name: `pokemon-${id}`,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      types: [index % 2 === 0 ? "grass" : "fire"],
    };
  },
);

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getPokemonTypes(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/type?limit=20`, {
      cache: "force-cache",
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Pokémon types");
    }

    const data = (await response.json()) as {
      results: Array<{ name: string }>;
    };
    return data.results.map((item) => item.name);
  } catch {
    return [
      "normal",
      "fire",
      "water",
      "grass",
      "electric",
      "psychic",
      "flying",
      "rock",
    ];
  }
}

export async function getPokemonByName(
  name: string,
): Promise<PokemonDetail | null> {
  try {
    const response = await fetch(`${API_BASE}/pokemon/${name.toLowerCase()}`, {
      cache: "force-cache",
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      id: number;
      name: string;
      height: number;
      weight: number;
      order: number;
      types: Array<{ type: { name: string } }>;
      abilities: Array<{ ability: { name: string } }>;
      stats: Array<{ base_stat: number; stat: { name: string } }>;
    };

    return {
      id: data.id,
      name: data.name,
      height: data.height,
      weight: data.weight,
      order: data.order,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`,
      types: data.types.map((item) => item.type.name),
      abilities: data.abilities.map((item) => toTitleCase(item.ability.name)),
      stats: data.stats.map((item) => ({
        name: toTitleCase(item.stat.name),
        value: item.base_stat,
      })),
    };
  } catch {
    return null;
  }
}

export async function fetchPokemonPage(
  offset = 0,
  limit = 151,
): Promise<PokemonListItem[]> {
  try {
    const response = await fetch(
      `${API_BASE}/pokemon?limit=${limit}&offset=${offset}`,
      {
        cache: "force-cache",
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Pokémon page");
    }

    const data = (await response.json()) as {
      results: Array<{ name: string }>;
    };

    const details = await Promise.all(
      data.results.map(async (pokemon) => {
        const detail = await getPokemonByName(pokemon.name);

        if (!detail) {
          return {
            id: 0,
            name: pokemon.name,
            image: "",
            types: ["normal"],
          };
        }

        return {
          id: detail.id,
          name: detail.name,
          image: detail.image,
          types: detail.types,
        };
      }),
    );

    return details.filter((pokemon) => pokemon.id > 0);
  } catch {
    return fallbackPokemon.slice(offset, offset + limit);
  }
}

export async function getPokemonList(
  limit = 151,
  offset = 0,
): Promise<PokemonListItem[]> {
  return fetchPokemonPage(offset, limit);
}
