"use client";

import { Heart, Home, X, Zap } from "lucide-react";
import { useState } from "react";

export function BottomNav({
  activeTab,
  activeType,
  onChangeTab,
  onChangeType,
  onToggleFavorites,
  types,
}: {
  activeTab: "all" | "favorites" | "type";
  activeType: string;
  onChangeTab: (value: "all" | "favorites" | "type") => void;
  onChangeType: (value: string) => void;
  onToggleFavorites: () => void;
  types: string[];
}) {
  const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);

  const items = [
    { label: "Home", value: "all", icon: Home },
    { label: "Type", value: "filter", icon: Zap },
    { label: "Favorites", value: "favorites", icon: Heart },
  ];

  const handleSelectType = (value: string) => {
    onChangeType(value);
    setIsTypeSheetOpen(false);
  };

  const handleAction = (value: string) => {
    if (value === "favorites") {
      onChangeTab("favorites");
      onToggleFavorites();
      return;
    }

    if (value === "filter") {
      onChangeTab("type");
      setIsTypeSheetOpen(true);
      return;
    }

    onChangeTab("all");
    onChangeType("all");
    setIsTypeSheetOpen(false);
  };

  return (
    <>
      <nav
        style={{ willChange: "transform" }}
        className="fixed inset-x-0 bottom-3 z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-md items-center justify-around rounded-full border border-white/10 bg-slate-900/80 p-2 shadow-[0_16px_44px_rgba(2,6,23,0.6)] backdrop-blur-md max-md:backdrop-blur-none max-md:bg-slate-950/95 md:hidden"
      >
        {items.map(({ label, value, icon: Icon }) => {
          const isActive =
            (value === "all" && activeTab === "all") ||
            (value === "favorites" && activeTab === "favorites") ||
            (value === "filter" && activeTab === "type");

          return (
            <button
              key={label}
              type="button"
              onClick={() => handleAction(value)}
              className={`flex min-h-[48px] min-w-[48px] cursor-pointer flex-1 touch-manipulation flex-col items-center justify-center gap-1 rounded-full px-3 py-2 text-[11px] transition-all duration-150 active:scale-95 active:opacity-80 active:bg-zinc-800/80 ${
                isActive ? "bg-cyan-500/15 text-cyan-100" : "text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {isTypeSheetOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm">
          <div className="absolute inset-x-0 bottom-0 rounded-t-[1.75rem] border-t border-white/10 bg-slate-950/95 p-4 shadow-[0_-20px_60px_rgba(15,23,42,0.8)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Filter by type
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Choose Pokémon type
                </h3>
              </div>

              <button
                type="button"
                aria-label="Close type filter"
                onClick={() => setIsTypeSheetOpen(false)}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-200 transition-all duration-150 active:scale-95 active:opacity-80 active:bg-zinc-800/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-2">
              <button
                type="button"
                onClick={() => handleSelectType("all")}
                className={`min-h-[48px] cursor-pointer rounded-full border px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-95 active:opacity-80 active:bg-zinc-800/80 ${
                  activeType === "all"
                    ? "border-cyan-400 bg-cyan-500/15 text-cyan-100"
                    : "border-white/10 bg-slate-900/80 text-slate-200"
                }`}
              >
                All Types
              </button>

              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSelectType(type)}
                  className={`min-h-[48px] cursor-pointer rounded-full border px-3 py-2 text-sm font-medium capitalize transition-all duration-150 active:scale-95 active:opacity-80 active:bg-zinc-800/80 ${
                    activeType === type
                      ? "border-cyan-400 bg-cyan-500/15 text-cyan-100"
                      : "border-white/10 bg-slate-900/80 text-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
