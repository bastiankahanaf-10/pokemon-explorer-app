import type {
  PokemonDetail,
  PokemonGeneration,
  PokemonListItem,
} from "@/types/pokemon";

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
      baseStatTotal: 0,
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
            baseStatTotal: 0,
          };
        }

        return {
          id: detail.id,
          name: detail.name,
          image: detail.image,
          types: detail.types,
          baseStatTotal: detail.stats.reduce(
            (total, stat) => total + stat.value,
            0,
          ),
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

export async function getGenerationById(
  id: number,
): Promise<PokemonGeneration | null> {
  if (!Number.isInteger(id) || id < 1 || id > 9) {
    return null;
  }

  const response = await fetch(`${API_BASE}/generation/${id}`, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon generation ${id}`);
  }

  return (await response.json()) as PokemonGeneration;
}

export async function getPokemonByGeneration(
  generation: PokemonGeneration,
): Promise<PokemonListItem[]> {
  const details = await Promise.all(
    generation.pokemon_species.map((species) => {
      const speciesId = Number(species.url.split("/").filter(Boolean).at(-1));
      if (!Number.isInteger(speciesId) || speciesId < 1) {
        throw new Error(`Invalid Pokémon species URL: ${species.url}`);
      }

      return getPokemonByName(String(speciesId));
    }),
  );

  return details.map((pokemon, index) => {
    if (!pokemon) {
      const species = generation.pokemon_species[index];
      throw new Error(
        `Failed to fetch Pokémon ${species?.name ?? "species"} in generation ${generation.id}`,
      );
    }

    return {
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.image,
      types: pokemon.types,
      baseStatTotal: pokemon.stats.reduce(
        (total, stat) => total + stat.value,
        0,
      ),
    };
  });
}

export async function getPokemonPageAcrossGenerations(
  offset = 0,
  limit = 24,
): Promise<{ pokemons: PokemonListItem[]; totalCount: number }> {
  const generationIds = Array.from({ length: 9 }, (_, index) => index + 1);
  const generations = await Promise.all(
    generationIds.map((id) => getGenerationById(id)),
  );
  const availableGenerations = generations.filter(
    (generation): generation is PokemonGeneration => generation !== null,
  );
  if (availableGenerations.length !== generationIds.length) {
    throw new Error("Failed to load all Pokémon generations");
  }
  const species = availableGenerations
    .flatMap((generation) => generation.pokemon_species)
    .map((entry) => ({
      id: Number(entry.url.split("/").filter(Boolean).at(-1)),
    }))
    .filter((entry) => Number.isInteger(entry.id) && entry.id > 0)
    .sort((a, b) => a.id - b.id);

  const page = species.slice(offset, offset + limit);
  const details = await Promise.all(
    page.map(async ({ id }) => {
      const pokemon = await getPokemonByName(String(id));
      if (!pokemon) return null;
      return {
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.image,
        types: pokemon.types,
        baseStatTotal: pokemon.stats.reduce((total, stat) => total + stat.value, 0),
      } satisfies PokemonListItem;
    }),
  );

  return {
    pokemons: details.filter((pokemon): pokemon is PokemonListItem => pokemon !== null),
    totalCount: species.length,
  };
}
