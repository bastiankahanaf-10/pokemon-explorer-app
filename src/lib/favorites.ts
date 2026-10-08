import { useSyncExternalStore } from "react";

export const FAVORITES_KEY = "pokemon-app-favorites";
const SERVER_FAVORITES: string[] = [];

let cachedRaw: string | null | undefined;
let cachedFavorites: string[] = SERVER_FAVORITES;
const listeners = new Set<() => void>();

function getFavoritesSnapshot(): string[] {
  if (typeof window === "undefined") {
    return SERVER_FAVORITES;
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cachedFavorites = Array.isArray(parsed)
        ? parsed.filter((name): name is string => typeof name === "string")
        : [];
    }
  } catch {
    cachedRaw = undefined;
    cachedFavorites = SERVER_FAVORITES;
  }

  return cachedFavorites;
}

function subscribeToFavorites(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

export function useFavoriteNames(): string[] {
  return useSyncExternalStore(
    subscribeToFavorites,
    getFavoritesSnapshot,
    () => SERVER_FAVORITES,
  );
}

export function getFavoriteNames(): string[] {
  return getFavoritesSnapshot();
}

export function saveFavoriteNames(names: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = JSON.stringify(names);
  window.localStorage.setItem(FAVORITES_KEY, raw);
  cachedRaw = raw;
  cachedFavorites = names;
  listeners.forEach((listener) => listener());
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
