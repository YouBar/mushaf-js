---
title: Events
description: All event callbacks and the data they receive.
---

# Events

All event callbacks are optional. Provide them in the `MushafConfig` constructor argument.

---

## `onWordClick`

Fired when a word glyph is clicked.

```ts
onWordClick?: (word: Word, element: HTMLElement) => void
```

### `Word`

```ts
interface Word {
  location: string;        // "surah:ayah:word" e.g. "2:255:1"
  surah:    number;        // 1–114
  ayah:     number;        // 1-based within the surah
  word:     number;        // 1-based position within the ayah
  qpc:      string;        // QPC v2 glyph character(s)
  is_end_marker?: boolean; // true for the ayah-end glyph
}
```

```js
onWordClick: (word, element) => {
  console.log(word.surah, word.ayah, word.word);
  element.classList.add('my-selected');
},
```

---

## `onAyahClick`

Fired when the ayah-end marker glyph (the circle with the ayah number) is clicked.

```ts
onAyahClick?: (ayah: Ayah) => void
```

### `Ayah`

```ts
interface Ayah {
  surah:    number;
  ayah:     number;
  words:    Word[];           // all words of this ayah on the current page
  elements: HTMLElement[];    // their DOM elements
}
```

```js
onAyahClick: (ayah) => {
  console.log(`${ayah.surah}:${ayah.ayah} — ${ayah.words.length} words`);
  mushaf.highlightAyah(ayah.surah, ayah.ayah);
},
```

---

## `onSurahClick`

Fired when a surah header (the ornamental surah name box) is clicked.

```ts
onSurahClick?: (surah: Surah) => void
```

### `Surah`

```ts
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
onSurahClick: (surah) => {
  console.log(`Surah ${surah.number}: ${surah.name_simple}`);
},
```

---

## `onJuzClick`

Fired when a Juz margin marker is clicked.

```ts
onJuzClick?: (juz: Juz) => void
```

### `Juz`

```ts
interface Juz {
  juz:  number;   // 1–30
  page: number;   // page where this juz starts
  line: number;   // line number within the page
}
```

```js
onJuzClick: (juz) => {
  console.log(`Start of Juz ${juz.juz}`);
},
```

---

## `onHizbClick`

Fired when a Hizb (half-juz) margin marker is clicked.

```ts
onHizbClick?: (hizb: Hizb) => void
```

### `Hizb`

```ts
interface Hizb {
  hizb: number;   // 1–60
  page: number;
  line: number;
}
```

---

## `onRubClick`

Fired when a Rub el-Hizb (quarter-hizb) marker is clicked.

```ts
onRubClick?: (rub: Rub) => void
```

### `Rub`

```ts
interface Rub {
  rub:  number;   // quarter position
  page: number;
  line: number;
}
```

---

## `onPageChange`

Fired after a page has been rendered, including on the initial `renderPage()` call.

```ts
onPageChange?: (page: number) => void
```

```js
onPageChange: (page) => {
  document.getElementById('pageCounter').textContent = `Page ${page} / 604`;
  history.replaceState(null, '', `?page=${page}`);
},
```

---

## `onSwipe`

Fired when a horizontal touch swipe is detected on the container. The library navigates automatically — use this callback to track analytics or update external state.

```ts
onSwipe?: (direction: 'next' | 'prev') => void
```

| `direction` | Gesture | Result |
|-------------|---------|--------|
| `'next'` | Swipe left | Next page (increasing page number) |
| `'prev'` | Swipe right | Previous page |

---

## `onKeyNav`

Fired when `ArrowLeft` or `ArrowRight` is pressed while no text input has focus. The library navigates automatically.

```ts
onKeyNav?: (direction: 'next' | 'prev') => void
```

| `direction` | Key | Result |
|-------------|-----|--------|
| `'next'` | `←` ArrowLeft | Next page (RTL forward) |
| `'prev'` | `→` ArrowRight | Previous page |

---

## Event delegation

All click events are attached to the **container** element via a single delegated listener, not to individual word elements. This means:

- The DOM can be completely rebuilt on page change without re-attaching listeners
- There is no performance cost from having thousands of individual listeners
- Events bubble correctly through the ayah wrapper (`display: contents`) to the container
