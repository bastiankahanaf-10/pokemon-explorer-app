"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, X } from "lucide-react";
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

    if (!typeValue && !searchValue) {
      return null;
    }

    if (typeValue && !KNOWN_TYPES.has(typeValue)) {
      return null;
    }

    return {
      type: typeValue || undefined,
      search: searchValue || undefined,
    };
  }

  if (action === "open_favorites") {
    return {};
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

export function PokeBotModal({
  onAction,
}: {
  onAction?: (action: string, payload: unknown) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = (await response.json()) as {
        action?: string;
        args?: Record<string, unknown>;
        text?: string;
        reply?: string;
      };

      const replyText =
        data.text || data.reply || "I can help you explore the Pokédex.";
      setAnswer(replyText);

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
      setAnswer("PokéBot is currently unavailable.");
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
        className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-cyan-400/20 active:scale-95"
      >
        <Bot className="h-4 w-4" />
        PokéBot
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
              className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-slate-950/60"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-100">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                      PokéBot
                    </p>
                    <h3 className="text-lg font-bold text-white">
                      Pokédex Assistant
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close PokéBot"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-200 transition-all duration-150 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="min-h-24 rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200">
                  {answer ||
                    "Ask me to filter, search, open favorites, or jump to a Pokémon."}
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
                    className="min-h-[48px] flex-1 rounded-2xl border border-zinc-800 bg-slate-900 px-4 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Ask PokéBot..."
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={loading}
                    className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/15 px-4 text-cyan-100 transition-all duration-150 active:scale-95"
                  >
                    <Send className="h-4 w-4" />
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
