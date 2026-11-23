---
title: Getting Started
description: Install mushaf.js and render your first page in under 5 minutes.
---

# Getting Started

## Prerequisites

- Node.js 18 or later (for the data scripts)
- A web server capable of serving static files (required because the library fetches JSON via `fetch()`)
- Nothing else: page data and QPC fonts load from the mushaf.js CDN (or [self-host them](#self-hosting-optional))

---

## Installation

### npm

```bash
npm install mushaf.js
```

### CDN (browser bundle)

```html
<link rel="stylesheet" href="https://cdn.mushafjs.com/mushaf.min.css" />
<script src="https://cdn.mushafjs.com/mushaf.min.js"></script>
<script>
  const mushaf = new Mushaf.Mushaf({ container: '#mushaf' });
</script>
```

The browser bundle exposes everything under the global `Mushaf` (`Mushaf.Mushaf`, `Mushaf.MUSHAF_CDN_URL`, …).

`/mushaf.min.js` and `/mushaf.min.css` always serve the latest release (cached for up to 4 hours).
To pin a version, put it in the path: `https://cdn.mushafjs.com/v1.0.2/mushaf.min.js`.
The bundle is also in the npm package (`mushaf.js/dist/mushaf.min.js`), so jsDelivr and unpkg work too.

---

## Assets (page data & fonts)

The library loads per-page JSON files and per-page fonts at runtime. By default they come from the mushaf.js CDN (`https://cdn.mushafjs.com`), so there is nothing to set up.

### Self-hosting (optional)

To self-host instead, serve the same structure from your own server and point the library at it:

```
{base}/
  pages/001.json … 604.json
  metadata.json          surah list (used by goToSurah / getMetadata)
  page-index.json        ayah → page (used by goToAyah)
  fonts/hafs/001.woff2 … 604.woff2
  fonts/QCF_BSML.woff2   basmala + surah/juz title calligraphy
  fonts/surah-banner.webp
```

```js
new Mushaf({
  container: '#mushaf',
  dataBaseUrl: '/mushaf/pages',   // metadata.json + page-index.json one level up
  fontsBaseDir: '/mushaf/fonts',
});
```

The files are in this repo under `data/` and `fonts/`.

Rebuilding the page data or the page index (`npm run generate-index`) is only needed when you change the data yourself.

See [Fonts](./fonts.md) for font details and licences.

If a page font fails to load, the page is rendered with the Unicode Uthmani text in a fallback font (configurable with `fontFamily`) so it stays readable and interactive.

---

## First page

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>mushaf.js demo</title>
  <link rel="stylesheet" href="/node_modules/mushaf.js/dist/mushaf.min.css" />
  <style>
    body { margin: 0; background: #f0ece4; }
    #mushaf { max-width: 760px; margin: 40px auto; }
  </style>
</head>
<body>
  <div id="mushaf"></div>

  <script type="module">
    import { Mushaf } from '/node_modules/mushaf.js/dist/index.mjs';

    const mushaf = new Mushaf({
      container: '#mushaf',
      onWordClick: (word) => {
        console.log(`Surah ${word.surah}, Ayah ${word.ayah}, Word ${word.word}`);
      },
    });

    await mushaf.init();
    await mushaf.renderPage(1);
  </script>
</body>
</html>
```

---

## Adding navigation controls

```html
<nav>
  <button id="prev">← Prev</button>
  <input id="pageNum" type="number" min="1" max="604" value="1" />
  <button id="next">Next →</button>
</nav>

<script type="module">
  import { Mushaf } from '/node_modules/mushaf.js/dist/index.mjs';

  const mushaf = new Mushaf({
    container: '#mushaf',
    onPageChange: (page) => {
      document.getElementById('pageNum').value = page;
    },
  });

  await mushaf.init();
  await mushaf.renderPage(1);

  document.getElementById('prev').onclick  = () => mushaf.previousPage();
  document.getElementById('next').onclick  = () => mushaf.nextPage();
  document.getElementById('pageNum').onchange = (e) => {
    mushaf.goToPage(parseInt(e.target.value, 10));
  };
</script>
```

Swipe left/right on touch screens and press `←` / `→` on the keyboard to navigate — both work automatically without any additional setup.

---

## Next steps

- [Configuration](./configuration.md) — all available options
- [Navigation](./navigation.md) — page, surah, and ayah navigation
- [Highlighting](./highlighting.md) — highlight styles and methods
- [Events](./events.md) — all event callbacks
- [Fonts](./fonts.md) — QPC font setup
