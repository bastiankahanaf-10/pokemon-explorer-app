"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { PokemonListItem } from "@/types/pokemon";

export function PokemonCard({
  pokemon,
  isFavorite,
  onToggleFavorite,
}: {
  pokemon: PokemonListItem;
  isFavorite: boolean;
  onToggleFavorite: (name: string) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="group relative touch-manipulation"
    >
      <div className="absolute inset-0 -z-10 hidden rounded-[1.9rem] bg-cyan-400/12 opacity-0 transition duration-300 md:block md:blur-2xl md:group-hover:opacity-100" />

      <div className="relative overflow-hidden rounded-[1.7rem] border border-zinc-800 bg-slate-900/85 p-4 ring-1 ring-white/5 shadow-none md:border-white/10 md:bg-slate-900/75 md:shadow-[0_18px_50px_rgba(2,6,23,0.45)] md:backdrop-blur-sm">
        <button
          type="button"
          aria-label={
            isFavorite
              ? `Remove ${pokemon.name} from favorites`
              : `Add ${pokemon.name} to favorites`
          }
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(pokemon.name);
          }}
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-slate-200 transition hover:scale-105 hover:border-pink-400/60 hover:text-pink-300"
        >
          <Heart
            className="h-4 w-4"
            fill={isFavorite ? "currentColor" : "none"}
            strokeWidth={2}
          />
        </button>

        <Link
          href={`/pokemon/${pokemon.name}`}
          className="relative block touch-manipulation active:scale-[0.99] active:bg-slate-800/80"
        >
          <div className="absolute inset-0 rounded-[1.4rem] bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

          <div className="relative flex flex-col items-center gap-3 text-center">
            <div className="mt-2 flex h-32 w-32 items-center justify-center rounded-full border border-cyan-400/10 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.2),rgba(15,23,42,0.75)_55%)] shadow-[inset_0_0_30px_rgba(34,211,238,0.12)]">
              <img
                src={pokemon.image}
                alt={pokemon.name}
                className="h-28 w-28 object-contain drop-shadow-[0_14px_22px_rgba(34,211,238,0.28)]"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
                # {String(pokemon.id).padStart(3, "0")}
              </p>
              <h3 className="text-xl font-semibold capitalize text-white">
                {pokemon.name}
              </h3>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {pokemon.types.map((type) => (
                <Badge key={`${pokemon.id}-${type}`} label={type} />
              ))}
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
