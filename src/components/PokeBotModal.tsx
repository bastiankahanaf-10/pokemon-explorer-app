"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, LoaderCircle, Send, X } from "lucide-react";
import { useState } from "react";

const KNOWN_TYPES = new Set([
  "bug",
  "dark",
  "dragon",
  "electric",
  "fairy",
  "fighting",
  "fire",
  "flying",
  "ghost",
  "grass",
  "ground",
  "ice",
  "normal",
  "poison",
  "psychic",
  "rock",
  "steel",
  "water",
]);

function normalizePayloadForAction(action: string, payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const args = payload as Record<string, unknown>;

  if (action === "filter_pokemon") {
    const typeValue =
      typeof args.type === "string" ? args.type.trim().toLowerCase() : "";
    const searchValue =
      typeof args.search === "string" ? args.search.trim() : "";
    const limitValue =
      typeof args.limit === "number" && Number.isInteger(args.limit)
        ? args.limit
        : undefined;
    const rankingValue = typeof args.ranking === "string" ? args.ranking : "id";

    if (typeValue && !KNOWN_TYPES.has(typeValue)) {
      return null;
    }

    if (limitValue !== undefined && (limitValue < 1 || limitValue > 151)) {
      return null;
    }

    if (!typeValue && !searchValue && limitValue === undefined) {
      return null;
    }

    if (!["base_stat_total", "id", "name"].includes(rankingValue)) {
      return null;
    }

    return {
      type: typeValue || undefined,
      search: searchValue || undefined,
      limit: limitValue,
      ranking: rankingValue,
    };
  }

  if (action === "open_favorites") {
    return {};
  }

  if (action === "navigate_to_generation") {
    const generationValue = Number(args.generation);
    if (!Number.isInteger(generationValue) || generationValue < 1 || generationValue > 9) {
      return null;
    }
    return { generation: generationValue };
  }

  if (action === "navigate_to_pokemon") {
    const nameValue =
      typeof args.name === "string" ? args.name.trim().toLowerCase() : "";

    if (!nameValue || !/^[a-z0-9-]+$/i.test(nameValue)) {
      return null;
    }

    return { name: nameValue };
  }

  return null;
}

type ResponseCard = {
  title?: string;
  subtitle?: string;
  rows?: Array<{ label: string; value: string }>;
  kind?: string;
};

function normalizeResponseCard(payload: unknown): ResponseCard | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const card = payload as Record<string, unknown>;
  const title = typeof card.title === "string" ? card.title : "Pokédex Result";
  const subtitle =
    typeof card.subtitle === "string" ? card.subtitle : "Pokédex Summary";
  const kind = typeof card.kind === "string" ? card.kind : "ui-summary";
  const rows = Array.isArray(card.rows)
    ? (card.rows
        .map((row) => {
          if (!row || typeof row !== "object" || Array.isArray(row)) {
            return null;
          }

          const item = row as Record<string, unknown>;
          const label = typeof item.label === "string" ? item.label : "Detail";
          const value = typeof item.value === "string" ? item.value : "";

          return { label, value };
        })
        .filter(Boolean) as Array<{ label: string; value: string }>)
    : [];

  if (!rows.length) {
    return null;
  }

  return { title, subtitle, kind, rows };
}

export function PokeBotModal({
  onAction,
  favoriteNames = [],
}: {
  onAction?: (action: string, payload: unknown) => void;
  favoriteNames?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [responseAction, setResponseAction] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<"text" | "card">("text");
  const [responseCard, setResponseCard] = useState<ResponseCard | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || loading) {
      return;
    }

    setAnswer("");
    setResponseType("text");
    setResponseCard(null);
    setResponseAction(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, favoriteNames }),
      });

      const data = (await response.json()) as {
        action?: string;
        args?: Record<string, unknown>;
        text?: string;
        reply?: string;
        responseType?: "text" | "card";
        card?: ResponseCard;
      };

      const replyText =
        data.text || data.reply || "I can help you explore the Pokédex.";
      const nextCard = normalizeResponseCard(data.card ?? null);
      const nextResponseType =
        data.responseType === "card" && nextCard ? "card" : "text";

      setAnswer(replyText);
      setResponseAction(
        data.action && data.action !== "chat" ? data.action : null,
      );
      setResponseType(nextResponseType);
      setResponseCard(nextCard);

      if (data.action && data.action !== "chat" && onAction) {
        const safePayload = normalizePayloadForAction(
          data.action,
          data.args || {},
        );

        if (safePayload) {
          onAction(data.action, safePayload);
        }
      }
    } catch {
      setAnswer("PokeBot is currently unavailable.");
      setResponseAction(null);
      setResponseType("text");
      setResponseCard(null);
    } finally {
      setLoading(false);
      setMessage("");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open PokeBot assistant"
        className="fixed bottom-24 right-4 z-[70] inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-500 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-950 shadow-[0_12px_36px_rgba(34,211,238,0.3)] transition-all duration-200 hover:-translate-y-1 hover:bg-cyan-300 active:scale-95 md:bottom-6 md:right-6"
      >
        <Bot className="h-5 w-5" />
        PokeBot
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm md:items-center"
          >
            <motion.section
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-slate-950/60"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-100">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                      PokeBot
                    </p>
                    <h3 className="text-lg font-bold text-white">
                      Pokédex Assistant
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close PokeBot"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-200 transition-all duration-150 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  {responseAction && (
                    <div className="mb-2 flex items-center justify-between rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                      <span>Pokédex Action</span>
                      <span className="rounded-full border border-cyan-300/40 px-2 py-0.5 text-cyan-200">
                        {responseAction}
                      </span>
                    </div>
                  )}

                  {responseType === "card" && responseCard ? (
                    <div className="mb-2 max-h-56 overflow-y-auto rounded-2xl border border-cyan-400/30 bg-slate-950/80">
                      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">
                          {responseCard.title || "Pokédex Result"}
                        </span>
                        <span className="rounded-full border border-cyan-400/30 px-2 py-1 text-[10px] font-bold uppercase text-cyan-100">
                          UI Card
                        </span>
                      </div>
                      <div className="p-3">
                        {responseCard.subtitle && (
                          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
                            {responseCard.subtitle}
                          </div>
                        )}
                        {responseCard.rows && responseCard.rows.length > 0 && (
                          <div className="space-y-2">
                            {responseCard.rows.map((row, index) => (
                              <div
                                key={`${row.label}-${index}`}
                                className="rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2"
                              >
                                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
                                  {row.label}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-slate-200">
                                  {row.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div
                    aria-live="polite"
                    aria-busy={loading}
                    className="max-h-44 min-h-24 overflow-y-auto rounded-xl border border-white/5 bg-slate-950/50 p-3 text-sm leading-6 text-slate-200 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/50"
                  >
                    {loading ? (
                      <div
                        role="status"
                        className="flex h-full min-h-16 items-center gap-3 text-cyan-100"
                      >
                        <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
                        <span>PokeBot is thinking</span>
                        <span
                          className="flex items-center gap-1"
                          aria-hidden="true"
                        >
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
                        </span>
                      </div>
                    ) : answer ||
                      "Ask me to filter, search, open favorites, or jump to a Pokémon."}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={loading}
                    className="min-h-[48px] flex-1 rounded-2xl border border-zinc-800 bg-slate-900 px-4 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Ask PokeBot..."
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    aria-label={loading ? "PokeBot is responding" : "Send message"}
                    disabled={loading || !message.trim()}
                    className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/15 px-4 text-cyan-100 transition-all duration-150 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
