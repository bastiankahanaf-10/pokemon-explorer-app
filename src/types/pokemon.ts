export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  order: number;
  image: string;
  types: string[];
  abilities: string[];
  stats: Array<{
    name: string;
    value: number;
  }>;
}

export interface PokemonListItem {
  id: number;
  name: string;
  image: string;
  types: string[];
  baseStatTotal: number;
}
