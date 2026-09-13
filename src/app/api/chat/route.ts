import OpenAI from "openai";
import type {
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
      name: "filter_pokemon",
      description:
        "Use this tool only when the user clearly asks to change the visible Pokédex list by type, text search, or a global Kanto ranking. It must be used for UI filtering actions only. For phrases such as 'top 3 electric', 'three strongest fire Pokémon', or '3 Pokémon teratas', always include limit: 3 and ranking: base_stat_total so the UI shows only the requested count ranked by BST. For phrases such as '3 Pokémon terkuat Gen 1', 'top 3 Kanto Pokémon', or 'strongest Gen 1 Pokémon', omit type and search, include limit: 3, and set ranking: base_stat_total so the ranking covers all 151 Kanto Pokémon. When the user mentions Indonesian type words like 'api' (fire), 'air' (water), 'rumput' (grass), or 'listrik' (electric), translate them to the official English type names fire, water, grass, electric before constructing the args. This tool never answers trivia or statistics.",
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
        "Use this tool only when the user explicitly asks to open the Favorites tab or switch to favorite Pokémon. It should only update the UI tab state, and never answer general Pokémon questions.",
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
        "Use this tool only when the user clearly asks to jump to a specific Pokémon detail page by name. The argument must be a single valid Pokémon name from Generasi 1 Kanto, ideally normalized to lowercase and safe alphanumeric-hyphenated text.",
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
      : `Menampilkan ${limit} Pokémon Gen 1 terkuat berdasarkan total stat dasar.`,
    reply: selectedType
      ? `Menampilkan ${limit} Pokémon ${selectedType} terkuat berdasarkan total stat dasar.`
      : `Menampilkan ${limit} Pokémon Gen 1 terkuat berdasarkan total stat dasar.`,
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
    { label: "Kanto Types", value: "Normal • Fire • Water • Electric" },
    { label: "Top BST", value: "Mewtwo 680 • Dragonite 600 • Moltres 580" },
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
  const fallbackText = `Saya dapat menjawab pertanyaan umum tentang Pokédex Kanto secara natural. Untuk pertanyaan seperti trivia, statistik, jumlah Pokémon, strategi bertarung, atau percakapan umum, saya akan menjawab dengan teks biasa tanpa menyentuh tool UI.${cleanReason} Pertanyaan Anda: ${message}`;

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
    };

    if (!openrouter) {
      return NextResponse.json(
        {
          action: "chat",
          args: {},
          text: "I am unable to reach the Pokédex assistant right now. Please add a valid OPENROUTER_API_KEY in the .env.local file for this project.",
          reply:
            "I am unable to reach the Pokédex assistant right now. Please add a valid OPENROUTER_API_KEY in the .env.local file for this project.",
        },
        { status: 200 },
      );
    }

    const message = body.message || "Show me the Pokédex";

    const deterministicRanking = buildDeterministicRankingAction(message);
    if (deterministicRanking) {
      return deterministicRanking;
    }

    const completionPayload = {
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      messages: [
        {
          role: "system",
          content:
            "You are PokéBot, a friendly Pokédex assistant for the Kanto Generation 1 experience. The app has exactly 151 Kanto Pokémon in the dataset, and you may answer all kinds of user questions in an open and natural way. You are not limited to a developer-only route. You can answer trivia, counts, statistics, Pokémon facts, battle strategy, comparison, names, greeting, casual conversation, recommendations, and general user intents in plain text, but you should only use tool calling when the user clearly asks to change the visible app UI through a supported Pokédex action. The UI tool actions are limited to filter_pokemon, open_favorites, and navigate_to_pokemon. When a UI filter request contains top N, first N, strongest N, highest BST, or teratas N, call filter_pokemon with limit set to N and ranking set to base_stat_total; never omit the limit and never return the entire type list for a top-N request. For a global request such as '3 Pokémon terkuat Gen 1', 'top 3 Kanto Pokémon', or 'strongest Gen 1 Pokémon', call filter_pokemon with type omitted, search omitted, limit set to the requested number, and ranking set to base_stat_total. Do not answer that UI request with ordinary text only. When a user asks in Indonesian and mentions type words such as api, air, rumput, or listrik, map them to the official English Pokémon type names fire, water, grass, and electric before any tool call. Never invent extra tools or create fake UI actions. If the user request is not a UI action, answer naturally as ordinary text and do not call a function. For UI actions, produce tool arguments only when they are safe, valid, and grounded in the known Kanto Pokémon names and allowed type names. Answer in clean plain text only. Do not use HTML tags, <br>, table markup, Markdown tables, or decorative HTML from the answer. Use readable natural sentences and short clean bullet lines if needed, but no raw HTML markup.",
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
          text: "I am unable to reach the Pokédex assistant right now.",
          reply: "I am unable to reach the Pokédex assistant right now.",
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
      if (action === "navigate_to_pokemon") {
        const namePayload = validation.args as { name?: string };
        if (typeof namePayload.name === "string") {
          navigateName = namePayload.name;
        }
      }

      const confirmationMap: Record<string, string> = {
        filter_pokemon:
          "I will update the Pokédex with the requested filter and ranking.",
        open_favorites: "I will switch the Pokédex list to the favorites tab.",
        navigate_to_pokemon: `I will open the Pokémon detail page for ${navigateName || "that Pokémon"}.`,
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
          text: "I am unable to reach the Pokédex assistant right now. Please check that OPENROUTER_API_KEY is a valid OpenRouter key in the project environment.",
          reply:
            "I am unable to reach the Pokédex assistant right now. Please check that OPENROUTER_API_KEY is a valid OpenRouter key in the project environment.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        action: "chat",
        args: {},
        text: "I am unable to reach the Pokédex assistant right now.",
        reply: "I am unable to reach the Pokédex assistant right now.",
      },
      { status: 200 },
    );
  }
}
