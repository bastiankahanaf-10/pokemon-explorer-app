export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

export function getTypeBadgeClass(type: string) {
  const colorMap: Record<string, string> = {
    normal: "bg-stone-400/20 text-stone-200 ring-stone-400/40",
    fire: "bg-orange-500/20 text-orange-200 ring-orange-400/40",
    water: "bg-sky-500/20 text-sky-200 ring-sky-400/40",
    electric: "bg-yellow-400/20 text-yellow-100 ring-yellow-300/40",
    grass: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40",
    ice: "bg-cyan-300/20 text-cyan-100 ring-cyan-300/40",
    fighting: "bg-red-600/20 text-red-100 ring-red-400/40",
    poison: "bg-violet-500/20 text-violet-200 ring-violet-400/40",
    ground: "bg-amber-600/20 text-amber-100 ring-amber-500/40",
    flying: "bg-indigo-400/20 text-indigo-100 ring-indigo-400/40",
    psychic: "bg-pink-500/20 text-pink-100 ring-pink-400/40",
    bug: "bg-lime-500/20 text-lime-100 ring-lime-400/40",
    rock: "bg-yellow-700/20 text-yellow-100 ring-yellow-600/40",
    ghost: "bg-violet-700/20 text-violet-200 ring-violet-500/40",
    dragon: "bg-indigo-600/20 text-indigo-100 ring-indigo-500/40",
    dark: "bg-slate-700/20 text-slate-100 ring-slate-500/40",
    steel: "bg-slate-400/20 text-slate-100 ring-slate-400/40",
    fairy: "bg-pink-300/20 text-pink-100 ring-pink-300/40",
    default: "bg-slate-500/15 text-slate-100 ring-slate-400/40",
  };

  return colorMap[type.toLowerCase()] ?? colorMap.default;
}
