export const FAVORITES_KEY = "pokemon-app-favorites";

export function getFavoriteNames(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteNames(names: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(names));
}

export function toggleFavoriteName(name: string, current: string[]) {
  const exists = current.includes(name);

  const next = exists
    ? current.filter((item) => item !== name)
    : [...current, name];

  saveFavoriteNames(next);
  return next;
}

export function isFavoriteName(name: string, favorites: string[]) {
  return favorites.includes(name);
}
