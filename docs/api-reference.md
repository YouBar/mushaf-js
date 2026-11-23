---
title: API Reference
description: Complete reference for all public methods on the Mushaf class.
---

# API Reference

All public methods are on the `Mushaf` class.

```ts
import { Mushaf } from 'mushaf.js';
const mushaf = new Mushaf(config);
```

---

## Lifecycle

### `init(): Promise<void>`

Initialises the library. Preloads the first `preloadPages` pages and their fonts.

Call this once before rendering any page.

```js
await mushaf.init();
```

### `destroy(): void`

Removes all DOM content, detaches all event listeners, and disconnects the resize observer. Call this when the component that holds the mushaf unmounts. After `destroy()` the instance does nothing anymore.

```js
mushaf.destroy();
```

---

## Rendering

### `renderPage(pageNumber: number): Promise<void>`

Renders the given page (1–604) into the container. Throws if the page number is out of range.

Also preloads the adjacent pages (±1) in the background.

```js
await mushaf.renderPage(255);
```

---

## Navigation

### `nextPage(): Promise<void>`

Renders the next page. No-op if already on page 604.

```js
await mushaf.nextPage();
```

### `previousPage(): Promise<void>`

Renders the previous page. No-op if already on page 1.

```js
await mushaf.previousPage();
```

### `goToPage(pageNumber: number): Promise<void>`

Alias for `renderPage()`. Provided for clarity in navigation contexts.

```js
await mushaf.goToPage(1);
```

### `goToSurah(surahNumber: number): Promise<void>`

Navigates to the first page of the given surah (1–114).

Requires `metadata.json` to be available at `{dataBaseUrl}/../metadata.json`. If the file is missing the library falls back to scanning all 604 pages (slow).

```js
await mushaf.goToSurah(36);   // Surah Ya-Sin
await mushaf.goToSurah(55);   // Surah Ar-Rahman
```

### `goToAyah(surah: number, ayah: number): Promise<void>`

Navigates to the page containing the given ayah.

Requires `page-index.json` to be available. Generate it with:

```bash
npm run generate-index
```

```js
await mushaf.goToAyah(2, 255);   // Ayat al-Kursi
await mushaf.goToAyah(112, 1);   // Al-Ikhlas
```

---

## Highlighting

All highlight methods accept an optional `HighlightConfig` that overrides the default set in the constructor.

```ts
interface HighlightConfig {
  style: 'background' | 'underline' | 'border' | 'color' | 'custom';
  color?: string;
  customClass?: string;
  key?: string;   // highlights with the same key replace each other; defaults to the type
}
```

### `highlightWord(surah, ayah, word, config?): void`

Highlights a single word.

```js
mushaf.highlightWord(1, 1, 1);
mushaf.highlightWord(2, 255, 3, { style: 'border', color: '#e91e63' });
```

### `highlightAyah(surah, ayah, config?): void`

Highlights all words in an ayah that are currently visible on the rendered page.

```js
mushaf.highlightAyah(1, 7);
mushaf.highlightAyah(2, 255, { style: 'underline', color: '#009688' });
```

### `highlightSurah(surah, config?): void`

Highlights all words belonging to a surah that are visible on the current page.

```js
mushaf.highlightSurah(1);
```

### `highlightRange(from, to, config?): void`

Highlights every word and ayah marker from `from` to `to` (inclusive, in reading order; the order of the arguments does not matter). Ranges are word-level, so they can start or end mid-ayah — e.g. on a rub' boundary — and they span lines and pages.

```js
// An-Naba 1–5 (ending on the ayah-5 marker)
mushaf.highlightRange(
  { surah: 78, ayah: 1, word: 1 },
  { surah: 78, ayah: 5, word: 4 },
  { style: 'background', color: 'rgba(255,193,7,.4)', key: 'homework' },
);
```

Word positions can also be stored as one integer with `wordPosition({ surah, ayah, word })` (`surah·1,000,000 + ayah·1,000 + word`), which sorts in reading order; `positionToRef()` converts back.

### `clearHighlight(keyOrType?): void`

Removes all active highlights, or only the one stored under a type (`'word'`, `'ayah'`, `'surah'`, `'range'`) or custom `key`.

```js
mushaf.clearHighlight();
mushaf.clearHighlight('homework');
```

### `clearHighlightsWithPrefix(prefix): void`

Removes every highlight whose key starts with `prefix` — handy when you key highlights per record (`'mistake:12'`, `'mistake:13'`, …).

### `batchHighlights(fn): void`

Runs several highlight/clear calls with a single repaint at the end. Use it when painting many records at once:

```js
mushaf.batchHighlights(() => {
  mushaf.clearHighlightsWithPrefix('seg:');
  for (const s of segments) mushaf.highlightRange(s.from, s.to, { style: 'background', color: s.color, key: `seg:${s.id}` });
});
```

---

## Range selection

Lets a user pick a word-level range by tapping the first and the last word (or ayah marker). While selecting, `onWordClick` / `onAyahClick` are not fired; a third tap starts a new selection.

| Method | Description |
|--------|-------------|
| `startSelection(initial?)` | Enter selection mode (optionally with an initial selection). |
| `cancelSelection()` | Leave selection mode and remove the selection highlight. |
| `setSelection(selection \| null)` | Set or clear the selection programmatically. |
| `getSelection()` | `{ start, end }` (end is `null` until the second tap), or `null`. |
| `isSelecting()` | Whether selection mode is active. |

```js
const mushaf = new Mushaf({
  container: '#mushaf',
  selectionHighlight: { style: 'border', color: '#7c3aed' },
  onSelectionChange: (sel) => {
    if (sel?.end) console.log('Selected', sel.start, '→', sel.end);
  },
});
mushaf.startSelection();
```

---

## Metadata

### `getCurrentPage(): number`

Returns the current page number.

```js
const page = mushaf.getCurrentPage();
```

### `getPageInfo(): { page: number; totalPages: number }`

Returns the current page and the total number of pages (always 604).

```js
const { page, totalPages } = mushaf.getPageInfo();
```

### `getMetadata(): Promise<Metadata>`

Returns surah metadata. Loads from `metadata.json` if available, otherwise derives it by scanning pages.

```ts
interface Metadata {
  surahs: Surah[];
}

interface Surah {
  number:           number;
  name_arabic:      string;   // e.g. "الفاتحة"
  name_simple:      string;   // e.g. "Al-Fatihah"
  revelation_place: string;   // 'makkah' | 'madinah'
  verses_count:     number;
  start_page:       number;
}
```

```js
const meta = await mushaf.getMetadata();
meta.surahs.forEach((s) => console.log(s.number, s.name_simple));
```

### `getSurahInfo(surahNumber: number): Promise<Surah | undefined>`

Convenience wrapper that returns info for a single surah.

```js
const fatiha = await mushaf.getSurahInfo(1);
console.log(fatiha.start_page); // 1
```

---

## TypeScript types

All types are available as named exports:

```ts
import type {
  MushafConfig,
  HighlightConfig,
  HighlightStyle,
  Word,
  Ayah,
  Surah,
  Juz,
  Hizb,
  Rub,
  Metadata,
  PageData,
  PageIndex,
} from 'mushaf.js';
```
