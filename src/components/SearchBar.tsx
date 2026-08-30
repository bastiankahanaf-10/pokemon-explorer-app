"use client";

import { Search } from "lucide-react";
import { useMemo } from "react";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const placeholder = useMemo(() => "Search Pokémon...", []);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="text"
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-3 pl-11 pr-4 text-base text-white shadow-inner shadow-slate-950/40 placeholder:text-slate-400 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
      />
    </div>
  );
}
