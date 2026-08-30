# ⚡ Interactive Pokémon Explorer (Pokédex Modern)

An interactive, high-performance, and responsive Pokédex web application built with **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, and **PokeAPI**. Featuring a sleek dark glassmorphism UI, real-time search/filters, dynamic visual stats, and local favorites persistence.

![Pokédex Banner](public/og-image.png) <!-- Tambahkan screenshot / banner aplikasi Anda di sini -->

---

## ✨ Key Features

- **🚀 Server-Side Rendering & Fast Load:** Built using Next.js App Router for optimal performance, fast initial page loads, and SEO efficiency.
- **🎨 Modern Dark Glassmorphism UI:** Designed with a sleek, permanent dark-mode aesthetic, dynamic element-type color coding, and subtle glow effects.
- **📜 Real Infinite Scroll:** Smooth and automatic fetching of all 151 original Pokémon as you scroll down the page using `Intersection Observer`.
- **📊 Dynamic Base Stats Visuals:** Animated stats progression bars (HP, Attack, Defense, Speed) with dynamic color indicators on individual detail pages.
- **❤️ Favorites & Persistence:** Save your favorite Pokémon locally using `localStorage` with a dedicated "Favorites" filter tab.
- **🔎 Real-Time Search & Type Filters:** Instantly search by Pokémon name or ID, and filter by 18+ elemental types with dynamic URL Query State.
- **📱 Native-Like Mobile Navigation:** Includes a fixed bottom navigation bar on mobile devices (`block md:hidden`) for an improved user experience.
- **🔤 Clean Custom Typography:** Styled using Next.js local fonts and custom Tailwind gradients for iconic headers.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **API Source:** [PokeAPI](https://pokeapi.co/)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 📂 Project Structure

```text
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout & custom font definitions
│   │   ├── page.tsx           # Explorer Home page with Infinite Scroll
│   │   └── pokemon/[name]/    # Dynamic route for individual Pokémon details
│   ├── components/
│   │   ├── ui/                # Reusable UI components (Badges, Skeletons)
│   │   ├── PokemonCard.tsx    # Glassmorphism Pokémon card component
│   │   ├── PokemonGrid.tsx    # Grid renderer with Infinite Scroll trigger
│   │   ├── StatsChart.tsx     # Animated Base Stats progress visualizer
│   │   └── BottomNav.tsx      # Mobile-first bottom navigation bar
│   ├── lib/
│   │   ├── pokeapi.ts         # PokeAPI fetch functions
│   │   └── utils.ts           # Type color maps & CSS utilities
│   └── types/
│       └── pokemon.ts         # TypeScript interfaces for PokeAPI payloads
```
