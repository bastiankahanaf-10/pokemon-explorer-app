"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { getFavoriteNames, toggleFavoriteName } from "@/lib/favorites";

export function PokemonDetailClient({
  name,
  image,
  id,
  types,
  children,
}: {
  name: string;
  image: string;
  id: number;
  types: string[];
  children: React.ReactNode;
}) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getFavoriteNames());
  }, []);

  const isFavorite = favorites.includes(name);

  const handleToggleFavorite = () => {
    setFavorites((current) => toggleFavoriteName(name, current));
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
    >
      <div className="flex items-center justify-end p-4 md:p-6">
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-pink-400/60 hover:text-pink-200"
        >
          <Heart
            className="h-4 w-4"
            fill={isFavorite ? "currentColor" : "none"}
            strokeWidth={2}
          />
          {isFavorite ? "Favorited" : "Add to Favorites"}
        </button>
      </div>

      <div className="grid gap-8 p-6 pt-0 md:grid-cols-2 md:p-10 md:pt-0">
        <div className="flex items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950/50 p-6">
          <img
            src={image}
            alt={name}
            className="h-72 w-72 object-contain drop-shadow-[0_20px_40px_rgba(34,211,238,0.35)]"
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              #{String(id).padStart(3, "0")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black capitalize tracking-tight">
                {name}
              </h1>
              <span className="rounded-full border border-pink-400/30 bg-pink-400/10 px-2 py-1 text-xs text-pink-100">
                {isFavorite ? "Liked" : "Not liked"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium capitalize text-slate-100 ring-1 ring-inset ring-slate-700"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          {children}
        </div>
      </div>
    </motion.article>
  );
}
