import { getPokemonPageAcrossGenerations } from "@/lib/pokeapi";

const PAGE_SIZE = 24;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedOffset = Number(searchParams.get("offset") ?? 0);
  const offset = Number.isInteger(requestedOffset) && requestedOffset >= 0
    ? requestedOffset
    : 0;

  try {
    const page = await getPokemonPageAcrossGenerations(offset, PAGE_SIZE);
    return Response.json(page);
  } catch {
    return Response.json(
      { error: "Pokémon data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
