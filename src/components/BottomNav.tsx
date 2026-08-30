"use client";

import { Heart, Home, Zap } from "lucide-react";

export function BottomNav({
  activeType,
  onChangeType,
  onToggleFavorites,
}: {
  activeType: string;
  onChangeType: (value: string) => void;
  onToggleFavorites: () => void;
}) {
  const items = [
    { label: "Home", value: "all", icon: Home },
    { label: "Type", value: "filter", icon: Zap },
    { label: "Favorites", value: "favorites", icon: Heart },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-md items-center justify-around rounded-full border border-white/10 bg-slate-900/80 p-2 shadow-[0_16px_44px_rgba(2,6,23,0.6)] backdrop-blur-xl md:hidden">
      {items.map(({ label, value, icon: Icon }) => {
        const isActive =
          (value === "all" && activeType === "all") ||
          (value === "favorites" && activeType === "favorites") ||
          (value === "filter" &&
            activeType !== "all" &&
            activeType !== "favorites");

        const handleClick = () => {
          if (value === "favorites") {
            onToggleFavorites();
            return;
          }

          if (value === "filter") {
            onChangeType("fire");
            return;
          }

          onChangeType("all");
        };

        return (
          <button
            key={label}
            type="button"
            onClick={handleClick}
            className={`flex flex-col items-center justify-center gap-1 rounded-full px-3 py-2 text-[11px] transition ${
              isActive ? "bg-cyan-500/15 text-cyan-100" : "text-slate-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
