---
title: Introduction
description: What mushaf.js is, why it exists, and how it works.
---

# mushaf.js

**mushaf.js** is a standalone JavaScript/TypeScript library that renders an interactive Madani Mushaf (Quran) in any web page. It provides pixel-perfect page rendering using QPC fonts, with built-in word-level, ayah-level, surah-level, and juz/hizb-level interaction.

Think of it like Chart.js, but for Quran pages instead of charts.

---

## Why HTML/CSS instead of Canvas?

| Factor | Canvas | HTML/CSS (mushaf.js) |
|--------|--------|----------------------|
| Text selection | Custom implementation required | Native browser support |
| Accessibility | Screen readers cannot read | Full ARIA support |
| SEO | Not indexable | Search-engine friendly |
| Highlighting performance | Redraw entire canvas | Add/remove CSS classes |
| Copy / paste | Custom implementation required | Native support |
| Framework agnostic | Yes | Yes |

---

## Key features

- **Pixel-perfect rendering** using QPC per-page glyph fonts (Hafs 'an 'Asim)
- **Word-level interactivity** — click any word to identify it by surah, ayah, and position
- **Ayah markers** — tap the end-of-ayah glyph to get the full ayah context
- **Surah headers** — clickable headers with Arabic name and transliteration
- **Margin markers** — Juz, Hizb, and Rub el-Hizb markers are rendered and clickable
- **Navigation** — go to any page, surah, or ayah by number
- **Highlighting** — background, underline, border, and custom CSS class styles
- **Touch gestures** — swipe left/right to turn pages on mobile
- **Keyboard navigation** — arrow keys to navigate pages
- **Dark mode** — automatic via `prefers-color-scheme`
- **RTL** — fully right-to-left, including flex layout
- **Print styles** — clean print output
- **Zero dependencies** — no framework or runtime library required
- **TypeScript** — full type definitions included

---

## Architecture overview

```
Mushaf (public API)
  ├── Loader          fetch + LRU-cache page JSON files
  ├── Renderer        build DOM from PageData, scale font-size to fill width
  ├── EventHandler    delegated click, touch gesture, keyboard navigation
  ├── HighlightManager  add/remove CSS highlight classes
  └── FontLoader      load per-page QPC woff2 fonts on demand
```

Page data lives in `data/pages/NNN.json` (604 files). A `data/page-index.json` maps `"surah:ayah"` → page number for fast `goToAyah()` navigation.

---

## Riwayah

mushaf.js renders the Hafs 'an 'Asim Madinah mushaf (KFGQPC V2, 1421H print).
