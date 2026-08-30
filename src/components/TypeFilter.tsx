"use client";

import { cn } from "@/lib/utils";

export function TypeFilter({
  types,
  activeType,
  onChange,
}: {
  types: string[];
  activeType: string;
  onChange: (type: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-sm transition",
          activeType === "all"
            ? "border-cyan-400 bg-cyan-400/20 text-cyan-100"
            : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20",
        )}
      >
        All
      </button>

      <button
        type="button"
        onClick={() => onChange("favorites")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-sm transition",
          activeType === "favorites"
            ? "border-pink-400 bg-pink-400/20 text-pink-100"
            : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20",
        )}
      >
        Favorites
      </button>

      {types.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm capitalize transition",
            activeType === type
              ? "border-cyan-400 bg-cyan-400/20 text-cyan-100"
              : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20",
          )}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
