# Design System: Solarpunk Utópico

## 1. Definição do Estilo

- **Nome:** Solarpunk Utópico
- **Tipo:** Optimistic, Green, Futuristic-Organic
- **Keywords:** solarpunk, utopian, green technology, organic architecture, sustainable, lush, botanical, optimistic future, community, renewable
- **Era:** Near-Future Sustainable Utopia
- **Light/Dark:** ✓ Full / ✗ No

## 2. Paleta de Cores

- **Primárias:** Verdant Green #2D6A4F, Solar Gold #FFB703, Sky Blue #219EBC, Warm White #FFF8E7
- **Secundárias:** Terracotta #C1440E, Moss #52B788, Soft Lavender #C7B8EA, Earth Brown #6B4226

## 3. Efeitos Visuais

Organic vine borders, solar flare animations, botanical illustrations, living architecture patterns, gradient skies, leaf particle effects, curved glass panels, soft ambient glow

## 4. AI Prompt Keywords

Design a solarpunk utopian landing page. Use: verdant green and solar gold, organic vine borders, solar flare animations, botanical illustrations, living architecture patterns, gradient skies, leaf particle effects, curved glass panels.

## 5. CSS Technical

```css
background: linear-gradient(180deg, #87CEEB, #FFF8E7), color: #2D6A4F, font-family: 'Nunito', sans-serif, border: 2px solid #52B788, box-shadow: 0 8px 24px rgba(45,106,79,0.15), animation: solar-pulse 4s ease-in-out infinite, border-radius: 20px, background-blend-mode: overlay
```

## 6. Design System Variables

```css
--verdant-green-solar: #2D6A4F, --solar-gold: #FFB703, --sky-blue-solar: #219EBC, --warm-white-solar: #FFF8E7, --vine-border-radius: 20px, --font-solarpunk: 'Nunito', sans-serif
```

## 7. Checklist de Implementação

- ☐ Organic vine borders
- ☐ Solar flare animations
- ☐ Botanical illustrations
- ☐ Living architecture patterns
- ☐ Gradient skies
- ☐ Leaf particle effects

## 8. Visual Theme & Atmosphere

Solarpunk Utópico — Design general com solarpunk, utopian, green technology. Template e prompt pronto para IA. Estilo Solarpunk Utópico representa uma tendência moderna em design UI/UX web com foco em general.

- Density: 5/10 — Balanced
- Variance: 8/10 — Expressive
- Motion: 8/10 — Cinematic

## 9. Color Palette & Roles

- **Verdant Green** (#2D6A4F) — Primary surface or dominant color
- **Solar Gold** (#FFB703) — Premium accent, decorative highlights
- **Sky Blue** (#219EBC) — Accent highlight, links and focus states
- **Warm White** (#FFF8E7) — Light surface, card backgrounds
- **Terracotta** (#C1440E) — Extended palette, decorative use
- **Moss** (#52B788) — Extended palette, decorative use
- **Soft Lavender** (#C7B8EA) — Extended palette, decorative use
- **Earth Brown** (#6B4226) — Extended palette, decorative use

## 10. Typography Rules

- **Display / Hero:** Nunito — Weight 700, tight tracking, used for headline impact
- **Body:** Nunito — Weight 400, 16px/1.6 line-height, max 72ch per line
- **UI Labels / Captions:** Nunito — 0.875rem, weight 500, slight letter-spacing
- **Monospace:** JetBrains Mono — Used for code, metadata, and technical values

Scale:
- Hero: clamp(2.5rem, 5vw, 4rem)
- H1: 2.25rem
- H2: 1.5rem
- Body: 1rem / 1.6
- Small: 0.875rem

## 11. Component Stylings

- **Primary Button:** Generously rounded (1.5rem) shape. Accent color fill. Hover: 8% darken + subtle lift shadow. Active: -1px translate tactile press. Font weight 600. No outer glows.
- **Secondary / Ghost Button:** Outline variant. 1.5px border in muted color. Text in primary color. Hover: subtle background fill.
- **Cards:** Generously rounded (1.5rem) corners. Surface background. Subtle shadow (0 2px 12px rgba(0,0,0,0.06)). 1px border stroke.
- **Inputs:** Label above input. 1px border stroke. Focus ring: 2px accent color offset 2px. Error text below in semantic red. No floating labels.
- **Navigation:** Primary surface background. Active item: accent color indicator. Font weight 500 when active.
- **Skeletons:** Shimmer animation matching component dimensions. No circular spinners.
- **Empty States:** Icon-based composition with descriptive text and action button.

## 12. Layout Principles

- **Grid:** CSS Grid primary. Max-width containment: 1280px centered with 1.5rem side padding.
- **Spacing rhythm:** Balanced. Base unit: 0.5rem (8px).
- **Section vertical gaps:** clamp(4rem, 8vw, 8rem).
- **Hero layout:** Asymmetric composition.
- **Feature sections:** Asymmetric grid with varied card sizes. No 3-equal-columns.
- **Mobile collapse:** All multi-column layouts collapse below 768px. No horizontal overflow.
- **z-index contract:** base (0) / sticky-nav (100) / overlay (200) / modal (300) / toast (500).

## 13. Motion & Interaction

- **Physics:** Spring — stiffness 120, damping 20. Confident, weighted transitions.
- **Entry animations:** Fade + translate-Y (16px → 0) over 540ms ease-out. Staggered cascades for lists: 120ms between items.
- **Hover states:** Scale(1.03) + shadow lift over 200ms.
- **Page transitions:** Fade + slide (300ms).
- **Performance:** Only transform and opacity animated. No layout-triggering properties.

## 14. Anti-Patterns (Banned)

- No emojis in UI — use icon system only (Lucide, Heroicons)
- No pure black (#000000) — use off-black or charcoal variants
- No oversaturated accent colors (saturation cap: 80%)
- No 3-column equal-width feature layouts — use zig-zag or asymmetric grid
- No `h-screen` — use `min-h-[100dvh]`
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen"
- No broken external image links — use picsum.photos or inline SVG
- No generic lorem ipsum in demos

## Contexto Histórico

Estilo Solarpunk Utópico representa uma tendência moderna em design UI/UX web com foco em general.

## Caso de Uso

Landing pages, SaaS
