---
title: Data
description: How page data is structured, generated, and served.
---

# Data

mushaf.js loads per-page JSON files at runtime. Understanding the data format helps when customising the data pipeline or debugging rendering issues.

## Source

All Qur'an data used by mushaf.js comes from **[QUL — Quranic Universal Library](https://qul.tarteel.ai/)** by Tarteel: the 15-line Madani layout, the QPC V2 glyph codes and per-page fonts, the word-by-word Uthmani text and the surah / juz / hizb / rub‘ / sajda metadata. The original files are kept unmodified in `data/source/`; everything in `data/pages/` and the index files is generated from them.

Jazāhum Allāhu khayran to the QUL team for making this work freely available.

---

## Directory layout

```
data/
  pages/
    001.json    ← rendered page data (604 files)
    002.json
    …
    604.json
  source/
    qpc-v2-15-lines.db    ← source SQLite database
    qpc-v2.json           ← word glyph codes
    quran-metadata-*.json ← surah / juz / hizb metadata
  page-index.json          ← "surah:ayah" → page number map
  metadata.json            ← surah info (derived from output/)
```

---

## Page JSON format

Each `NNN.json` file has the following structure:

```ts
interface PageData {
  page:        number;   // 1–604
  is_centered: boolean;  // true for pages 1–2 (Al-Fatihah, shorter lines)
  juz:         number;   // which juz this page starts in
  lines:       Line[];   // ordered top-to-bottom
}
```

### Line types

A page has three line types:

```ts
type LineType = 'surah_name' | 'basmala' | 'ayah';
```

**`surah_name`** — rendered as the ornamental surah header box:

```json
{
  "line": 1,
  "type": "surah_name",
  "surah": 2,
  "name_arabic": "البقرة",
  "name_simple": "Al-Baqarah",
  "revelation_place": "madinah",
  "verses_count": 286,
  "bismillah_pre": true
}
```

**`basmala`** — the Bismillah line (appears before surah headers that have `bismillah_pre: true`):

```json
{
  "line": 2,
  "type": "basmala"
}
```

**`ayah`** — a line of Quran text:

```json
{
  "line": 3,
  "type": "ayah",
  "juz_start": 1,
  "words": [
    {
      "location": "1:1:1",
      "surah": 1,
      "ayah": 1,
      "word": 1,
      "qpc": "ﱁ"
    },
    {
      "location": "1:1:5",
      "surah": 1,
      "ayah": 1,
      "word": 5,
      "qpc": "ﱅ",
      "is_end_marker": true
    }
  ]
}
```

### Margin markers

Ayah lines may carry optional margin markers:

| Field | Type | Description |
|-------|------|-------------|
| `juz_start` | `number` | Juz number that starts on this line |
| `hizb_start` | `number` | Hizb number that starts on this line |
| `rub_start` | `number` | Rub el-Hizb position |
| `sajda` | `'obligatory' \| 'optional' \| 'required'` | The sajda type if this line ends a sajda verse |

### End markers

The last word of every ayah in the QPC dataset is the ayah-end glyph (a decorative circle with the ayah number encoded in the font). It is flagged with `is_end_marker: true` so the Renderer applies the `mushaf-ayah-marker` class instead of `mushaf-word`.

---

## Page index

`data/page-index.json` is a flat JSON object:

```json
{
  "1:1": 1,
  "1:2": 1,
  "2:1": 2,
  "2:255": 42,
  …
}
```

Keys are `"surah:ayah"` strings. Values are page numbers (1-based).

Generate it after building the page data:

```bash
npm run generate-index
```

This scans all 604 `NNN.json` files and records the first page on which each ayah appears.

---

## Metadata

`data/metadata.json` is used by `goToSurah()` for fast surah lookup:

```json
{
  "surahs": [
    {
      "number": 1,
      "name_arabic": "الفاتحة",
      "name_simple": "Al-Fatihah",
      "revelation_place": "makkah",
      "verses_count": 7,
      "start_page": 1
    },
    …
  ]
}
```

If this file is absent the library derives the metadata by scanning all 604 pages on first use (slow — ~2 seconds).

---

## Regenerating page data

The raw source data lives in `data/source/`. Rebuild everything from it with (Node.js 22+):

```bash
npm run build-data
```

This writes `data/pages/`, `data/page-index.json` and `data/quran-index.json` from:
- `data/source/qpc-v2-15-lines.db` — page and line structure (SQLite)
- `data/source/qpc-v2.json` — QPC glyph code per word
- `data/source/qpc-hafs-word-by-word.json` — Unicode text per word
- `data/source/quran-metadata-*.json` — surah info, juz/hizb/rub positions, sajda verses
