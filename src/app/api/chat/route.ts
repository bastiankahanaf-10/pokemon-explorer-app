import OpenAI from "openai";
import type {
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getGenerationById } from "@/lib/pokeapi";

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

const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
const looksLikePlaceholder =
  apiKey.length === 0 ||
  apiKey.toLowerCase().startsWith("your_") ||
  apiKey.toLowerCase().includes("replace_me");

const looksLikeOpenRouterKey = /^sk-or-v1-[A-Za-z0-9\-_.]{20,}$/i.test(apiKey);

const openrouter =
  !looksLikePlaceholder && looksLikeOpenRouterKey && apiKey
    ? new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        defaultHeaders: {
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Pokédex Explorer",
        },
      })
    : null;

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "navigate_to_generation",
      description:
        "Use this tool when the user explicitly asks to open, view, browse, or go to a specific Pokémon generation page. The app supports generations 1 through 9. Do not use this for a factual question about a generation unless the user asks to change the page.",
      parameters: {
        type: "object",
        properties: {
          generation: {
            type: "integer",
            description: "Generation ID from 1 to 9.",
          },
        },
        required: ["generation"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_pokemon",
      description:
        "Use this tool only when the user clearly asks to change the visible home Pokédex list by type, text search, or ranking. It is for UI filtering only. For UI requests such as 'top 3 electric', include limit: 3 and ranking: base_stat_total. The home list includes Pokémon from generations I through IX and loads in pages; do not claim a global all-generation ranking when only currently loaded entries are available. For a request to browse one generation, use navigate_to_generation instead. Map Indonesian type words api, air, rumput, and listrik to fire, water, grass, and electric. This tool does not answer trivia or statistics.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description:
              "Official English Pokémon type slug. Allowed values: bug, dark, dragon, electric, fairy, fighting, fire, flying, ghost, grass, ground, ice, normal, poison, psychic, rock, steel, water. Indonesian user words must be translated: api→fire, air→water, rumput→grass, listrik→electric.",
          },
          search: {
            type: "string",
            description:
              "Free-text search string over Pokémon names in the visible Pokédex list. Use only for UI list filtering, not for a normal trivia answer.",
          },
          limit: {
            type: "integer",
            description:
              "Maximum number of results to display. Use this when the user says top N, first N, or a specific result count, such as top 3. Allowed range: 1 to 151.",
          },
          ranking: {
            type: "string",
            enum: ["base_stat_total", "id", "name"],
            description:
              "Use base_stat_total when the user asks for top, strongest, highest BST, best, or teratas Pokémon. Otherwise use id unless the user explicitly requests name order.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_favorites",
      description:
        "Use this tool when the user asks to show, open, or view their saved favorites list in the app. It only switches the UI to the Favorites tab; for a question asking which Pokémon are saved, answer from the supplied favorites context.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_to_pokemon",
      description:
        "Use this tool only when the user clearly asks to jump to a specific Pokémon detail page by name. The argument can be a valid Pokémon name from generations I through IX, normalized to lowercase and safe alphanumeric-hyphenated text.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Pokémon name to open in the detail page. Example: pikachu, bulbasaur, charmander, squirtle. Accept only a valid name string; never pass arbitrary text.",
          },
        },
        required: ["name"],
      },
    },
  },
];

function parseToolArgs(raw: string): {
  ok: boolean;
  args: Record<string, unknown>;
  reason?: string;
} {
  try {
    const parsed = JSON.parse(raw || "{}");

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        ok: false,
        args: {},
        reason: "The tool payload was not a JSON object.",
      };
    }

    return { ok: true, args: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      args: {},
      reason: "The tool payload could not be parsed safely.",
    };
  }
}

function validateToolArgs(action: string, args: Record<string, unknown>) {
  if (action === "filter_pokemon") {
    const typeValue =
      typeof args.type === "string" ? args.type.trim().toLowerCase() : "";
    const searchValue =
      typeof args.search === "string" ? args.search.trim() : "";

    if (typeValue && !KNOWN_TYPES.has(typeValue)) {
      return {
        ok: false,
        args: {},
        reason:
          "Please use a known Pokémon type such as fire, water, grass, or electric.",
      };
    }

    if (args.search !== undefined && typeof args.search !== "string") {
      return {
        ok: false,
        args: {},
        reason: "The search query must be a text string.",
      };
    }

    const limitValue =
      typeof args.limit === "number" && Number.isInteger(args.limit)
        ? args.limit
        : undefined;
    if (limitValue !== undefined && (limitValue < 1 || limitValue > 151)) {
      return {
        ok: false,
        args: {},
        reason: "The result limit must be an integer between 1 and 151.",
      };
    }

    if (!typeValue && !searchValue && limitValue === undefined) {
      return {
        ok: false,
        args: {},
        reason: "Please provide a Pokémon type, search query, or result limit.",
      };
    }

    const rankingValue = typeof args.ranking === "string" ? args.ranking : "id";
    if (!["base_stat_total", "id", "name"].includes(rankingValue)) {
      return {
        ok: false,
        args: {},
        reason: "The ranking mode is not supported.",
      };
    }

    const safeArgs = {
      type: typeValue || undefined,
      search: searchValue || undefined,
      limit: limitValue,
      ranking: rankingValue,
    };

    return { ok: true, args: safeArgs };
  }

  if (action === "navigate_to_pokemon") {
    const nameValue =
      typeof args.name === "string" ? args.name.trim().toLowerCase() : "";

    if (!nameValue || !/^[a-z0-9-]+$/i.test(nameValue)) {
      return {
        ok: false,
        args: {},
        reason: "Please provide a valid Pokémon name to navigate to.",
      };
    }

    return {
      ok: true,
      args: { name: nameValue } as Record<string, unknown>,
    };
  }

  if (action === "navigate_to_generation") {
    const generationValue =
      typeof args.generation === "number" && Number.isInteger(args.generation)
        ? args.generation
        : Number(args.generation);

    if (!Number.isInteger(generationValue) || generationValue < 1 || generationValue > 9) {
      return {
        ok: false,
        args: {},
        reason: "Please choose a Pokémon generation from 1 to 9.",
      };
    }

    return {
      ok: true,
      args: { generation: generationValue } as Record<string, unknown>,
    };
  }

  if (action === "open_favorites") {
    return { ok: true, args: {} as Record<string, unknown> };
  }

  return {
    ok: false,
    args: {},
    reason: "I could not recognize that Pokédex action.",
  };
}

function sanitizeCleanText(text: string) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<br\s*>/gi, "\n")
    .replace(/<\/p>|<p>/gi, "\n")
    .replace(/<li>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<ul>|<\/ul>|<ol>|<\/ol>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|apos);/gi, (entity) => {
      return (
        {
          "&nbsp;": " ",
          "&amp;": "&",
          "&lt;": "<",
          "&gt;": ">",
          "&quot;": '"',
          "&apos;": "'",
        }[entity] || entity
      );
    })
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function buildDeterministicRankingAction(message: string) {
  const normalized = sanitizeCleanText(message).toLowerCase();
  if (/\b(gen(?:eration)?\s*(?:[2-9]|ii|iii|iv|v|vi|vii|viii|ix)|johto|hoenn|sinnoh|unova|kalos|alola|galar|hisui|paldea)\b/i.test(normalized)) {
    return null;
  }
  if (!/pokemon|pokémon|pokédex/.test(normalized)) {
    return null;
  }

  const numberWords: Record<string, number> = {
    satu: 1,
    dua: 2,
    tiga: 3,
    four: 4,
    empat: 4,
    five: 5,
    lima: 5,
    six: 6,
    enam: 6,
    seven: 7,
    tujuh: 7,
    eight: 8,
    delapan: 8,
    nine: 9,
    sembilan: 9,
    ten: 10,
    sepuluh: 10,
  };
  const numberMatch = normalized.match(
    /(?:top|teratas|terkuat|strongest|best|first|pertama)\s*(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)|(?:^|\s)(\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\s+(?:pokemon|pokémon)/i,
  );
  const rawLimit = numberMatch?.[1] || numberMatch?.[2];
  const limit = rawLimit
    ? Number(rawLimit) || numberWords[rawLimit.toLowerCase()]
    : undefined;
  const rankingIntent =
    /top|teratas|terkuat|strongest|best|highest\s+bst|terbaik|paling\s+kuat/i.test(
      normalized,
    );

  if (!limit || !rankingIntent || limit > 151) {
    return null;
  }

  const typeAliases: Record<string, string> = {
    api: "fire",
    air: "water",
    rumput: "grass",
    listrik: "electric",
    es: "ice",
    perang: "fighting",
    venom: "poison",
    racun: "poison",
    tanah: "ground",
    terbang: "flying",
    psikik: "psychic",
    serangga: "bug",
    batu: "rock",
    hantu: "ghost",
    naga: "dragon",
  };
  const typeValue = [...KNOWN_TYPES].find((type) =>
    new RegExp(`\\b${type}\\b`, "i").test(normalized),
  );
  const aliasValue = Object.entries(typeAliases).find(([alias]) =>
    new RegExp(`\\b${alias}\\b`, "i").test(normalized),
  )?.[1];
  const selectedType = typeValue || aliasValue;

  return NextResponse.json({
    action: "filter_pokemon",
    args: {
      type: selectedType,
      search: undefined,
      limit,
      ranking: "base_stat_total",
    },
    text: selectedType
      ? `Menampilkan ${limit} Pokémon ${selectedType} terkuat berdasarkan total stat dasar.`
      : `Menampilkan ${limit} Pokémon terkuat dari daftar yang sedang dimuat berdasarkan total stat dasar.`,
    reply: selectedType
      ? `Menampilkan ${limit} Pokémon ${selectedType} terkuat berdasarkan total stat dasar.`
      : `Menampilkan ${limit} Pokémon terkuat dari daftar yang sedang dimuat berdasarkan total stat dasar.`,
  });
}

function buildUiCardResponseFromPrompt(message: string, replyText: string) {
  const normalized = sanitizeCleanText(message).toLowerCase();
  const hasPokemonIntent = /pokemon|pokémon|pokédex/.test(normalized);
  const hasUiIntent =
    /show|display|tampilan|daftar|list|jenis|type|ranking|top\s*3|card|ui|visual/.test(
      normalized,
    );

  if (!hasPokemonIntent || !hasUiIntent) {
    return null;
  }

  const rows = [
    { label: "Coverage", value: "Generations I–IX, Kanto to Paldea" },
    { label: "Explore", value: "Search, types, favorites, and generation pages" },
    { label: "Notes", value: sanitizeCleanText(replyText) },
  ];

  return {
    action: "chat",
    args: {},
    text: replyText,
    reply: replyText,
    responseType: "card",
    card: {
      title: "Pokédex UI Summary",
      subtitle: "Pokémon Type Ranking",
      rows,
      kind: "type-ranking",
    },
  };
}

function makeNaturalFallbackResponse(message: string, reason?: string) {
  const cleanReason = reason ? ` ${reason}` : "";
  const fallbackText = `Saya dapat menjawab pertanyaan umum tentang Pokédex Pokémon dari generation 1 sampai 9 secara natural. Untuk trivia, statistik, jumlah Pokémon, strategi bertarung, atau percakapan umum, saya akan menjawab dengan teks biasa tanpa menyentuh tool UI.${cleanReason} Pertanyaan Anda: ${message}`;

  return NextResponse.json(
    {
      action: "chat",
      args: {},
      text: sanitizeCleanText(fallbackText),
      reply: sanitizeCleanText(fallbackText),
    },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      message?: string;
      favoriteNames?: unknown;
    };

    if (!openrouter) {
      return NextResponse.json(
        {
          action: "chat",
          args: {},
          text: "PokeBot can't connect right now. Please add a valid OPENROUTER_API_KEY in the .env.local file for this project.",
          reply:
            "PokeBot can't connect right now. Please add a valid OPENROUTER_API_KEY in the .env.local file for this project.",
        },
        { status: 200 },
      );
    }

    const message = body.message || "Show me the Pokédex";
    const favoriteNames = Array.isArray(body.favoriteNames)
      ? [...new Set(
          body.favoriteNames
            .filter((name): name is string => typeof name === "string")
            .map((name) => name.trim().toLowerCase())
            .filter((name) => /^[a-z0-9-]{1,40}$/.test(name)),
        )].slice(0, 1025)
      : [];
    const favoritesContext = favoriteNames.length
      ? `The user's current saved favorites are: ${favoriteNames.join(", ")}.`
      : "The user currently has no Pokémon saved in favorites.";

    const deterministicRanking = buildDeterministicRankingAction(message);
    if (deterministicRanking) {
      return deterministicRanking;
    }

    const generationCatalog = await Promise.all(
      Array.from({ length: 9 }, (_, index) =>
        getGenerationById(index + 1).catch(() => null),
      ),
    );
    const generationContext = generationCatalog
      .map((generation, index) =>
        generation
          ? `Generation ${index + 1}: ${generation.main_region.name} region, ${generation.pokemon_species.length} species`
          : `Generation ${index + 1}: unavailable`,
      )
      .join("; ");

    const systemPrompt = [
      "You are PokeBot, the in-app assistant for Pokédex Explorer. Always spell the assistant name exactly PokeBot, without accents or alternate spellings.",
      "The app explores Pokémon species from Generations I through IX (Kanto to Paldea), sourced from PokéAPI. Help users with concise answers about Pokémon, generations, types, base stats, abilities, matchups, and the app's search, filters, sorting, favorites, generation pages, and detail pages. Never describe the app as limited to Kanto or 151 Pokémon. For generation-specific rankings, do not trigger a home-list filter that cannot select one generation; answer the question naturally or open the requested generation page if the user asks to browse it.",
      "Match the language used by the user, including Indonesian or English. Keep a friendly, clear, knowledgeable tone that fits a Pokémon companion. For unrelated requests, briefly explain that you specialize in this Pokédex and offer a relevant way to help.",
      "Current generation catalog from PokéAPI: " + generationContext + ".",
      "Only use UI tools when the user clearly asks to change the app. Available actions are filter_pokemon, open_favorites, navigate_to_pokemon, and navigate_to_generation. Use open_favorites when the user asks to show, open, or view their favorites list. For questions about which Pokémon are favorited, use the supplied current favorites context and never guess or claim favorites that are not listed. For explicit requests to open, view, browse, or go to a specific generation, call navigate_to_generation with its ID from 1 to 9. Never claim that a UI action happened unless its tool call is valid.",
      favoritesContext,
      "When Indonesian type words appear in a UI request, map api, air, rumput, and listrik to fire, water, grass, and electric. Pokémon names may come from any generation I through IX. Do not invent tools or claim access to favorites or app state that is not provided.",
      "For ordinary replies, use plain text with short readable paragraphs or bullets. Do not use HTML or Markdown tables.",
    ].join(" ");

    const completionPayload = {
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.4,
    };

    const completion = await openrouter.chat.completions.create(
      completionPayload as Parameters<
        typeof openrouter.chat.completions.create
      >[0],
    );

    if (!("choices" in completion)) {
      return NextResponse.json(
        {
          action: "chat",
          args: {},
          text: "PokeBot couldn't get a response right now. Please try again.",
          reply: "PokeBot couldn't get a response right now. Please try again.",
        },
        { status: 200 },
      );
    }

    const reply = completion.choices[0]?.message;
    const replyTextRaw =
      typeof reply?.content === "string"
        ? sanitizeCleanText(reply.content)
        : "";

    const toolCall = reply?.tool_calls?.find(
      (call): call is ChatCompletionMessageFunctionToolCall =>
        call.type === "function",
    );

    if (toolCall?.function?.name) {
      const action = toolCall.function.name;
      const parsed = parseToolArgs(toolCall.function.arguments || "{}");

      if (!parsed.ok) {
        return makeNaturalFallbackResponse(
          message,
          parsed.reason || "I could not safely read that Pokédex tool command.",
        );
      }

      const validation = validateToolArgs(action, parsed.args);

      if (!validation.ok) {
        return makeNaturalFallbackResponse(
          message,
          validation.reason ||
            "I could not safely validate that Pokédex action.",
        );
      }

      let navigateName = "";
      let navigateGeneration: number | null = null;
      if (action === "navigate_to_pokemon") {
        const namePayload = validation.args as { name?: string };
        if (typeof namePayload.name === "string") {
          navigateName = namePayload.name;
        }
      }
      if (action === "navigate_to_generation") {
        const generationPayload = validation.args as { generation?: number };
        navigateGeneration = generationPayload.generation ?? null;
      }

      const confirmationMap: Record<string, string> = {
        filter_pokemon:
          "I will update the Pokédex with the requested filter and ranking.",
        open_favorites: "I will switch the Pokédex list to the favorites tab.",
        navigate_to_pokemon: `I will open the Pokémon detail page for ${navigateName || "that Pokémon"}.`,
        navigate_to_generation: `I will open Generation ${navigateGeneration ?? "requested"}.`,
      };

      return NextResponse.json({
        action,
        args: validation.args,
        text:
          confirmationMap[action] || "I will handle that Pokédex action now.",
        reply:
          confirmationMap[action] || "I will handle that Pokédex action now.",
      });
    }

    const replyText = replyTextRaw || "I can help you explore the Pokédex.";

    const cardPayload = buildUiCardResponseFromPrompt(message, replyText);
    if (cardPayload) {
      return NextResponse.json(cardPayload, { status: 200 });
    }

    return NextResponse.json({
      action: "chat",
      args: {},
      text: replyText,
      reply: replyText,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "OpenRouter authentication failed.";

    console.error("OpenRouter chat error", error);

    if (/user not found|401/i.test(message) || /401/i.test(String(error))) {
      return NextResponse.json(
        {
          action: "chat",
          args: {},
          text: "PokeBot can't connect right now. Please check that OPENROUTER_API_KEY is a valid OpenRouter key in the project environment.",
          reply:
            "PokeBot can't connect right now. Please check that OPENROUTER_API_KEY is a valid OpenRouter key in the project environment.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        action: "chat",
        args: {},
        text: "PokeBot couldn't get a response right now. Please try again.",
        reply: "PokeBot couldn't get a response right now. Please try again.",
      },
      { status: 200 },
    );
  }
}
