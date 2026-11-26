---
name: uiverse_magicui
description: Fetch, adapt, and install animated 3D/glassmorphic UI components from Magic UI (@magicui shadcn registry) and Uiverse (uiverse-io/galaxy via scripts/uiverse.mjs) into this Next.js + Tailwind v4 project. Use whenever the user asks to add, search, or convert components from Magic UI or Uiverse.io.
---

# Uiverse & Magic UI Integration Guide

This project is pre-configured with **Magic UI** (via the `@magicui` registry in `components.json` and `motion`) and a local **Uiverse CLI fetcher** (`scripts/uiverse.mjs` backed by `uiverse-io/galaxy`).

## 1. Magic UI (`@magicui`)

### Installing a Magic UI Component
Run the `shadcn` CLI with the `@magicui/` namespace:
```powershell
npx shadcn add --yes @magicui/<component-name>
```

Popular installed & available components:
- `@magicui/shimmer-button` — Button with animated light shimmer sweep
- `@magicui/sparkles-text` — Animated twinkling stars around headings/words
- `@magicui/confetti` — Interactive canvas confetti bursts & celebration cannons
- `@magicui/shine-border` — Glowing animated border around cards
- `@magicui/number-ticker` — Smooth counting animation for XP, scores, streaks
- `@magicui/bento-grid`, `@magicui/marquee`, `@magicui/meteors`, `@magicui/cool-mode`, `@magicui/pulsating-button`, `@magicui/rainbow-button`, `@magicui/ripple-button`

Installed components are placed in `src/components/ui/` and can be imported directly:
```tsx
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { SparklesText } from '@/components/ui/sparkles-text';
```

## 2. Uiverse (`uiverse-io/galaxy`)

Uiverse is a collection of 3,800+ pure CSS & Tailwind UI elements rather than an npm library. Use `scripts/uiverse.mjs` (or `npm run uiverse -- ...`) to search and pull source code directly without opening a browser:

### Commands
```powershell
# List all Uiverse categories (Buttons, Cards, Checkboxes, Loaders, Toggle-switches, etc.)
node scripts/uiverse.mjs categories

# Search components by keyword (and optional category)
node scripts/uiverse.mjs search panda Buttons
node scripts/uiverse.mjs search glass Cards

# Fetch raw HTML + CSS/Tailwind directly from a Uiverse URL or author/slug
node scripts/uiverse.mjs get https://uiverse.io/0xnihilism/fast-cat-82
node scripts/uiverse.mjs get Buttons/0xnihilism_fast-cat-82.html
```

### Converting Uiverse Snippets to React TSX
1. Fetch the snippet with `node scripts/uiverse.mjs get <url>`.
2. If the snippet uses Tailwind utility classes, convert `class=` to `className=` and wrap it in a reusable React component under `src/components/ui/`.
3. If the snippet uses custom `<style>` keyframes or pseudo-elements, scope the styles with CSS modules (`*.module.css`) or convert simple rules to Tailwind arbitrary variants so global class names (like `.button` or `.card`) never leak across pages.
