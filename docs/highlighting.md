---
title: Highlighting
description: Highlight words, ayahs, and surahs with built-in or custom styles.
---

# Highlighting

Highlights are declarative: you say *what* to highlight (a word, an ayah, a surah) and *how*, and mushaf.js paints it — and re-paints it whenever the page is re-rendered. Highlights therefore survive page navigation: an ayah that spans two pages is highlighted on both.

---

## Highlight styles

| Style | What you see |
|-------|--------------|
| `background` | One continuous rounded band behind the text **per line** — gaps between words and the ayah-end marker are covered, so an ayah reads as one block |
| `underline` | One continuous bar under the text per line |
| `border` | An outlined band around the text per line |
| `color` | The glyphs themselves are recoloured (no box) — the quran.com look |
| `custom` | Adds `customClass` to every highlighted word / marker element |

### Bands follow the ink, not the word boxes

The QPC calligraphy deliberately lets glyphs spill outside their boxes — swash tails (the final ن of «ٱلرَّحۡمَٰنِ» on page 1 sweeps under the next word), stretched letters and harakat above the line. Across the whole mushaf 19% of words have ink outside their box and 8% rise above their line. Bands are therefore sized from each glyph's **measured ink** (canvas `TextMetrics`), so every swash and haraka stays inside:

- Consecutive highlighted lines join into one continuous block, like a text selection.
- All bands of one highlight are painted in a single layer that carries the transparency, so where bands overlap the colour stays uniform.
- Bands sit behind the glyphs, never shift the layout, and are positioned in % so they stay aligned when the page is resized.

Clicks use the same ink geometry: clicking a glyph's overhanging tail selects the word that owns that ink, even if it lies inside the neighbouring word's box.

Default colours come from CSS custom properties on `.mushaf-container`: `--mushaf-highlight` (solid) and `--mushaf-highlight-opacity` for backgrounds, `--mushaf-accent` for underline/border/colour. They adapt to light/dark theme. A `color` passed in `HighlightConfig` is used as-is (pass an `rgba()` colour for transparency).

Each highlighted element also gets a state class (`mushaf-highlight-bg`, `-underline`, `-border`, `-color`) and `data-highlighted="<style>"`, useful as CSS hooks.

---

## Highlight a single word

```js
// Word 1 of Ayah 1 of Surah 1
mushaf.highlightWord(1, 1, 1);

// With a custom style
mushaf.highlightWord(2, 255, 3, {
  style: 'underline',
  color: '#e91e63',
});
```

---

## Highlight an entire ayah

```js
mushaf.highlightAyah(1, 1);                          // Al-Fatihah 1:1
mushaf.highlightAyah(2, 255);                        // Ayat al-Kursi
mushaf.highlightAyah(36, 1, { style: 'background', color: '#b2dfdb' });
```

Highlights every word of the ayah and its end marker, across all lines. If the ayah spans two pages, it is highlighted on both pages as you navigate.

---

## Highlight a surah

```js
mushaf.highlightSurah(1);    // highlight Al-Fatihah (on whichever page is shown)
```

---

## Setting default highlight styles

Configure defaults in the constructor so you don't have to pass a config to every call:

```js
const mushaf = new Mushaf({
  wordHighlight:  { style: 'background', color: '#fff176' },
  ayahHighlight:  { style: 'underline',  color: '#4caf50' },
  surahHighlight: { style: 'border',     color: '#2196f3' },
});

// Now these use the defaults from above
mushaf.highlightWord(1, 1, 1);
mushaf.highlightAyah(1, 1);
```

---

## Clearing highlights

```js
mushaf.clearHighlight();
```

Removes all highlights. Pass a type (`'word'`, `'ayah'`, `'surah'`) or a custom key to remove just one:

```js
mushaf.clearHighlight('ayah');
```

---

## Several highlights at once

Each highlight is stored under a key, which defaults to its type — so a new ayah highlight replaces the previous ayah highlight. Give highlights your own `key` to keep several (e.g. bookmarks):

```js
mushaf.highlightAyah(2, 255, { style: 'background', key: 'bookmark-2:255' });
mushaf.highlightAyah(2, 286, { style: 'background', key: 'bookmark-2:286', color: '#c8e6c9' });

mushaf.clearHighlight('bookmark-2:255');
```

---

## Custom CSS class

Use `style: 'custom'` to apply your own CSS class:

```js
mushaf.highlightAyah(2, 255, {
  style: 'custom',
  customClass: 'my-gold-highlight',
});
```

```css
.my-gold-highlight {
  background: linear-gradient(135deg, #ffd700 0%, #ffec80 100%);
  border-radius: 3px;
  text-shadow: 0 1px 0 rgba(255,255,255,0.4);
}
```

---

## Highlighting on click

The most common pattern — highlight whatever the user clicks:

```js
const mushaf = new Mushaf({
  container: '#mushaf',
  wordHighlight: { style: 'background' },
  ayahHighlight: { style: 'underline', color: '#009688' },

  onWordClick: (word) => {
    mushaf.highlightWord(word.surah, word.ayah, word.word);
  },

  onAyahClick: (ayah) => {
    mushaf.highlightAyah(ayah.surah, ayah.ayah);
  },
});
```

---

## Highlight persistence across pages

Nothing to do: highlights are re-applied automatically after every page render. Navigate away and back, and the highlight is still there.
