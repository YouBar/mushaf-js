---
title: Fonts
description: How QPC per-page fonts work and how to set them up.
---

# Fonts

mushaf.js uses QPC (Quran Complex) per-page fonts for pixel-perfect Madani mushaf rendering. These are the same fonts used in the official King Fahad Complex digital Quran.

| Property | Value |
|----------|-------|
| Format | `.woff2` |
| Count | 604 files — one per mushaf page |
| Riwayah | Hafs 'an 'Asim |

---

## How QPC fonts work

The Quran Complex produces font files where each Unicode code point maps to a specific shaped glyph as it appears on a particular mushaf page. Because Arabic calligraphy varies by context and page layout, each page requires its own font file.

- **604 font files** — one per mushaf page
- Each file is a `.woff2` named `001.woff2` through `604.woff2`
- The Renderer injects a `@font-face` rule scoped to the current page, then loads the font via the `FontFace` API

---

## Directory structure

```
fonts/
  hafs/
    001.woff2
    002.woff2
    …
    604.woff2
```

Point the library at the parent directory:

```js
// Default: fonts load from https://cdn.mushafjs.com/fonts.
// Self-hosted:
new Mushaf({ fontsBaseDir: '/fonts' });
```

---

## Font preloading

During `init()` the library preloads fonts for the first `preloadPages` pages. When `renderPage()` is called, the font for that specific page is awaited before rendering, so there is no flash of fallback text.

Adjacent page fonts (±1) are also preloaded in the background after each render.

---

## Hosting considerations

- Serve fonts with the correct `Content-Type: font/woff2` header
- Enable CORS if fonts are on a different origin (`Access-Control-Allow-Origin: *`)
- Enable gzip or Brotli compression — woff2 files compress well
- The default CDN (`cdn.mushafjs.com`) serves the fonts with CORS and caching; when self-hosting on another domain, send `Access-Control-Allow-Origin` for `.woff2` files
