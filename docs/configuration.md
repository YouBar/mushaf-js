---
title: Configuration
description: Complete reference for all MushafConfig options.
---

# Configuration

All options are passed to the `Mushaf` constructor as a single `MushafConfig` object.

```ts
const mushaf = new Mushaf(config: MushafConfig);
```

---

## Container

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `container` | `string \| HTMLElement` | Yes | CSS selector string or a direct DOM element reference. |

```js
// By selector
new Mushaf({ container: '#mushaf-container' });

// By element
const el = document.getElementById('mushaf-container');
new Mushaf({ container: el });
```

---

## Data

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dataBaseUrl` | `string` | `'https://cdn.mushafjs.com/pages'` | Base URL for page JSON files. The loader appends `/NNN.json` to this path. Only set it to self-host the data. |

```js
new Mushaf({
  // Default: the mushaf.js CDN, nothing to configure.

  // Self-hosted:
  dataBaseUrl: '/mushaf/pages',
});
```

The loader also looks for `page-index.json` and `metadata.json` one level up from `dataBaseUrl` (i.e. at `../page-index.json` relative to the base URL).

---

## Fonts

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fontsBaseDir` | `string` | `'https://cdn.mushafjs.com/fonts'` | Only set it to self-host the fonts. Base directory containing `hafs/NNN.woff2` (one font per page), `QCF_BSML.woff2` and `surah-banner.webp`. |
| `basmalaFontUrl` | `string` | `'{fontsBaseDir}/QCF_BSML.woff2'` | Calligraphy font for the basmala and surah/juz titles. |
| `surahBannerUrl` | `string` | `'{fontsBaseDir}/surah-banner.webp'` | Ornamental frame drawn behind surah titles. |

```js
new Mushaf({
  fontsBaseDir: '/mushaf/fonts',   // only when self-hosting
});
```

Expected font structure:

```
fonts/
  hafs/
    001.woff2
    002.woff2
    …
    604.woff2
  QCF_BSML.woff2
  surah-banner.webp
```

See [Fonts](./fonts.md) for details.

---

## Performance

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preloadPages` | `number` | `3` | Number of pages (starting from page 1) to preload during `init()`. Clamped to 1–10. |

```js
new Mushaf({ preloadPages: 5 });
```

The library also preloads the adjacent pages (±1) every time a page is rendered.

---

## Appearance

By default the font size is derived from the container width, so every justified line exactly fills the page and every page has the same proportions (15 equal line slots, like the printed Madani mushaf). Set `max-width` on the container to control the page size.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'auto' \| 'light' \| 'dark'` | `'auto'` | Colour scheme. `'auto'` follows the OS. Change later with `mushaf.setTheme()`. |
| `showPageHeader` | `boolean` | `true` | Running header with the surah title and juz title. |
| `showMarginMarkers` | `boolean` | `true` | Juz / hizb / quarter labels in the outer margin (right margin on odd pages, left on even). |
| `marginMarkerStyle` | `'ornament' \| 'text'` | `'ornament'` | `'ornament'`: as in the printed Madinah mushaf — the label inside the mushaf's margin ornament: arched for quarters ("ربع / نصف / ثلاثة أرباع · الحزب · N"), symmetric for a hizb start ("الحزب · N") and a juz start ("الجزء N · الحزب M"). The page gets a wider side margin for them. `'text'`: the same labels without the ornament, compact page. |
| `fontSize` | `number` | — | Fixed font size in px; fixes the page width to match. |
| `fontFamily` | `string` | — | Fallback font used when a page font fails to load. |
| `lineHeight` | `number` | `1.78` | Line pitch in em. |
| `textColor` | `string` | — | Text colour. |

Every colour is a CSS custom property on `.mushaf-container` (`--mushaf-text`, `--mushaf-page-bg`, `--mushaf-accent`, `--mushaf-highlight`, …), so themes can be customised in CSS.

---

## Default highlight styles

Configure the highlight style applied when calling `highlightWord()`, `highlightAyah()`, or `highlightSurah()` without an explicit config argument.

| Option | Type | Description |
|--------|------|-------------|
| `wordHighlight` | `HighlightConfig` | Default highlight for individual words. |
| `ayahHighlight` | `HighlightConfig` | Default highlight for entire ayahs. |
| `surahHighlight` | `HighlightConfig` | Default highlight for an entire surah (visible words on the current page). |
| `juzHighlight` | `HighlightConfig` | Reserved for juz highlighting. |

`HighlightConfig`:

```ts
interface HighlightConfig {
  style: 'background' | 'underline' | 'border' | 'color' | 'custom';
  color?: string;       // CSS color value
  customClass?: string; // CSS class to add (when style = 'custom')
  key?: string;         // storage key; defaults to the highlight type
}
```

Example:

```js
new Mushaf({
  wordHighlight:  { style: 'background', color: '#fff176' },
  ayahHighlight:  { style: 'underline',  color: '#4caf50' },
  surahHighlight: { style: 'border',     color: '#2196f3' },
});
```

---

## Enable/disable interactions

By default all click types are enabled. Set any of these to `false` to disable:

| Option | Type | Default |
|--------|------|---------|
| `enableWordClick` | `boolean` | `true` |
| `enableAyahClick` | `boolean` | `true` |
| `enableSurahClick` | `boolean` | `true` |
| `enableJuzClick` | `boolean` | `true` |
| `keyboardNavigation` | `boolean` | `true` |
| `swipeNavigation` | `boolean` | `true` |

---

## Event callbacks

See [Events](./events.md) for the full callback reference.

| Option | Signature |
|--------|-----------|
| `onWordClick` | `(word: Word, element: HTMLElement) => void` |
| `onAyahClick` | `(ayah: Ayah) => void` |
| `onSurahClick` | `(surah: Surah) => void` |
| `onJuzClick` | `(juz: Juz) => void` |
| `onHizbClick` | `(hizb: Hizb) => void` |
| `onRubClick` | `(rub: Rub) => void` |
| `onPageChange` | `(page: number) => void` |
| `onSwipe` | `(direction: 'next' \| 'prev') => void` |
| `onKeyNav` | `(direction: 'next' \| 'prev') => void` |
