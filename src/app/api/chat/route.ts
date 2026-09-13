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

const openrouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
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
        "Filter Pokémon list by exact type or free-text search query.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Pokémon type like fire, water, grass, electric.",
          },
          search: {
            type: "string",
            description: "Free text search over Pokémon names.",
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
      description: "Switch the Pokédex page to the favorites tab.",
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
      description: "Navigate directly to a Pokémon detail page by name.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Pokémon name to open in the detail page.",
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

    if (!typeValue && !searchValue) {
      return {
        ok: false,
        args: {},
        reason: "Please clarify the Pokémon type or search query.",
      };
    }

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

    const safeArgs = {
      type: typeValue || undefined,
      search: searchValue || undefined,
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

function makeClarificationResponse(reason: string) {
  return NextResponse.json(
    {
      action: "chat",
      args: {},
      text: `${reason} Please clarify what you'd like me to do in the Pokédex.`,
      reply: `${reason} Please clarify what you'd like me to do in the Pokédex.`,
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
          text: "I am unable to reach the Pokédex assistant right now.",
          reply: "I am unable to reach the Pokédex assistant right now.",
        },
        { status: 200 },
      );
    }

    const message = body.message || "Show me the Pokédex";

    const completion = await openrouter.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are PokéBot. Help users explore the Pokémon list. Use tools when the user asks to filter, show favorites, or navigate to a Pokémon detail page.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.4,
    });

    const reply = completion.choices[0]?.message;
    const toolCall = reply?.tool_calls?.find(
      (call): call is ChatCompletionMessageFunctionToolCall =>
        call.type === "function",
    );

    if (toolCall?.function?.name) {
      const action = toolCall.function.name;
      const parsed = parseToolArgs(toolCall.function.arguments || "{}");

      if (!parsed.ok) {
        return makeClarificationResponse(
          parsed.reason || "I could not safely read that Pokédex tool command.",
        );
      }

      const validation = validateToolArgs(action, parsed.args);

      if (!validation.ok) {
        return makeClarificationResponse(
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
          "I will filter the Pokédex for the requested Pokémon type or search.",
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

    const replyText =
      typeof reply?.content === "string"
        ? reply.content
        : "I can help you explore the Pokédex.";

    return NextResponse.json({
      action: "chat",
      args: {},
      text: replyText,
      reply: replyText,
    });
  } catch (error) {
    console.error("OpenRouter chat error", error);
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
