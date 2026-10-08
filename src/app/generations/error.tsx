"use client";

export default function GenerationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center">
        <h1 className="text-2xl font-bold">Couldn&apos;t load generations</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Generation data is temporarily unavailable. Check your connection and
          try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
