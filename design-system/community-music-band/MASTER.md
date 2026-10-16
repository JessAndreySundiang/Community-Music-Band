# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/community-music-band/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Community Music Band
**Direction:** "Golden Hour at the Bandstand"
**Approach:** Warm, accessible non-profit site. Adapted from the ui-ux-pro-max `--design-system`
output (which suggested a generic community-purple / Minimalism system) toward the skill's
`Music Instrument Learning` color reasoning and a serif + sans editorial pairing that better
fits a volunteer concert band.

---

## Global Rules

### Color Palette

Warm cream stage, deep concert navy, brass gold accent, terracotta secondary. Every pairing below
meets WCAG AA (4.5:1) for its intended use.

| Role | Light | Dark | CSS Variable |
|------|-------|------|--------------|
| Deep concert navy | `#0D1B34` | `#0A1020` | `--ink` |
| Navy highlight | `#16305A` | `#101A30` | `--ink-2` |
| Supporting blue | `#2B5896` | `#2B5896` | `--blue` |
| Brass gold (accent on dark) | `#E0A92E` | `#E9BA55` | `--brass` |
| Brass gold (text on light) | `#8A5F12` | `#EEC56C` | `--brass-ink` |
| Soft gold wash | `#F7E6BD` | `rgba(233,186,85,.16)` | `--brass-soft` |
| Terracotta (accent on dark) | `#CF5138` | `#FF8570` | `--plume` |
| Terracotta (text on light) | `#A63A22` | `#FF9A86` | `--plume-ink` |
| Terracotta wash | `#F8E2DA` | `rgba(255,133,112,.14)` | `--plume-soft` |
| Cream background | `#FBF7EF` | `#0A1020` | `--paper` |
| Tinted section | `#F4ECDD` | `#101A30` | `--paper-2` |
| Card | `#FFFFFF` | `#141F38` | `--card` |
| Nav bar | `#0A1528` | `#060B16` | `--nav` |
| Body text | `#1C2540` | `#E8EDF8` | `--text` |
| Muted text | `#5D677D` | `#A4B0C8` | `--muted` |
| Headings | `#0D1B34` | `#F3F7FF` | `--heading` |
| Border / hairline | `rgba(13,27,52,.14)` | `rgba(232,237,248,.16)` | `--line` |

**Contrast notes:** Use `--brass-ink` / `--plume-ink` for gold/terracotta text on light surfaces
(the bright `--brass` / `--plume` values do not reach 4.5:1 on cream). The bright values are for
borders, fills, and text on the dark navy surfaces.

### Typography

- **Heading Font:** Fraunces (opsz serif) — warm, editorial, concert-program feel
- **Body Font:** DM Sans
- **Google Fonts:** `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap`

### Spacing & Shape

- Section rhythm: `--section-y: clamp(3.5rem, 7vw, 6rem)`
- Gutters: `--gutter: clamp(1.1rem, 4vw, 2rem)`
- Radii: `--radius-sm: 11px`, `--radius: 16px`, `--radius-lg: 26px`
- Easing: `--ease: cubic-bezier(0.22, 0.61, 0.36, 1)`; transitions 150–300ms

---

## Component Specs

- **Buttons (`.btn`)**: brass fill, dark text, `translateY(-2px)` hover; variants `.ghost` (on dark),
  `.outline` (on light). Inline SVG icons at `1.15em`.
- **Cards (`.fact`, `.program`, `.event`, `.value`, `.voice`, `.donate-list li`)**: white/`--card`
  surface, 1px `--line` border, `--shadow-sm`, hover lifts to `--shadow-md` and brass border.
- **Kicker (`.eyebrow`)**: pill badge for section labels; `.eyebrow--onDark` on navy surfaces.
- **Icons**: single inline-SVG set in `src/components/Icons.tsx` (24px grid, stroke 1.8, currentColor).
  No emoji as structural icons, no icon dependency.

---

## Style Guidelines

**Style:** Warm editorial / accessible & ethical. High contrast, 16px+ body, visible focus,
reduced-motion safe, keyboard-friendly.

**Page Pattern:** Hero + Value prop + Key features + Social proof (Voices) + CTA + Footer.

---

## Anti-Patterns (Do NOT Use)

- ❌ Emojis as icons — use the shared SVG set
- ❌ Bright gold/terracotta text on cream (use the `*-ink` tokens)
- ❌ Layout-shifting hovers that move surrounding content
- ❌ Text below 4.5:1 contrast
- ❌ Instant state changes — always transition 150–300ms
- ❌ Invisible focus states

---

## Pre-Delivery Checklist

- [x] No emojis used as icons (inline SVG set)
- [x] Consistent icon family, stroke width, sizing
- [x] `cursor: pointer` on clickable elements
- [x] Hover states with 150–300ms transitions
- [x] Light + dark mode text contrast ≥ 4.5:1
- [x] Visible focus rings for keyboard nav (skip link included)
- [x] `prefers-reduced-motion` respected
- [x] Responsive: 375 / 768 / 1024 / 1440
- [x] No content hidden behind the sticky navbar
- [x] Lighthouse: Accessibility 100 · Best Practices 100 · SEO 100
