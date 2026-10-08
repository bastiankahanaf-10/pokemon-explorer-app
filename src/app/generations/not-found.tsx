import Link from "next/link";

export default function GenerationNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="max-w-lg rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
          Generation not found
        </p>
        <h1 className="mt-3 text-3xl font-bold">Choose a generation from 1 to 9</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          This page supports the nine generations available in PokéAPI.
        </p>
        <Link
          href="/generations"
          className="mt-6 inline-flex rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
        >
          Browse generations
        </Link>
      </section>
    </main>
  );
}
