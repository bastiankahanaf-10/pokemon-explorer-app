"use client";

export function SortControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 shadow-lg shadow-slate-950/20">
      <span className="text-slate-300">Sort</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-full border border-white/10 bg-slate-950 px-2.5 py-1.5 text-sm text-white outline-none transition focus:border-cyan-400"
      >
        <option value="id">Pokédex No.</option>
        <option value="name">Name A–Z</option>
        <option value="favorites">Favorites first</option>
      </select>
    </label>
  );
}
