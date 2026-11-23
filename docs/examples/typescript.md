---
title: TypeScript Example
description: Using mushaf.js with TypeScript and full type safety.
---

# TypeScript Example

mushaf.js ships with full type definitions. Import types alongside the class.

## Installation

```bash
npm install mushaf.js
```

## Setup

```ts
import { Mushaf } from 'mushaf.js';
import type {
  MushafConfig,
  Word,
  Ayah,
  Surah,
  Juz,
  Hizb,
  Rub,
  HighlightConfig,
  Metadata,
} from 'mushaf.js';
import 'mushaf.js/styles';
```

## Typed configuration

```ts
const config: MushafConfig = {
  container: '#mushaf',
  preloadPages: 3,

  wordHighlight: { style: 'background', color: '#fff176' },
  ayahHighlight: { style: 'underline',  color: '#4caf50' },

  onWordClick(word: Word, element: HTMLElement): void {
    console.log(`${word.surah}:${word.ayah}:${word.word}`);
  },

  onAyahClick(ayah: Ayah): void {
    console.log(`${ayah.surah}:${ayah.ayah} — ${ayah.words.length} words`);
  },

  onSurahClick(surah: Surah): void {
    console.log(surah.name_simple, surah.name_arabic);
  },

  onJuzClick(juz: Juz): void {
    console.log(`Juz ${juz.juz} at page ${juz.page}`);
  },

  onHizbClick(hizb: Hizb): void {
    console.log(`Hizb ${hizb.hizb}`);
  },

  onRubClick(rub: Rub): void {
    console.log(`Rub ${rub.rub}`);
  },

  onPageChange(page: number): void {
    document.title = `Page ${page} / 604`;
  },
};

const mushaf = new Mushaf(config);
await mushaf.init();
await mushaf.renderPage(1);
```

## Navigation with error handling

```ts
async function navigateToAyah(surah: number, ayah: number): Promise<void> {
  try {
    await mushaf.goToAyah(surah, ayah);
  } catch (err) {
    console.error(`Ayah ${surah}:${ayah} not found — is page-index.json generated?`);
  }
}

await navigateToAyah(2, 255);   // Ayat al-Kursi
await navigateToAyah(36, 1);    // Ya-Sin
```

## Working with metadata

```ts
const metadata: Metadata = await mushaf.getMetadata();

metadata.surahs.forEach((surah: Surah) => {
  console.log(`${surah.number}. ${surah.name_simple} — page ${surah.start_page}`);
});
```

## Custom highlight config

```ts
const emphasis: HighlightConfig = {
  style: 'custom',
  customClass: 'highlight-emphasis',
};

mushaf.highlightAyah(2, 255, emphasis);
```

```css
.highlight-emphasis {
  background: linear-gradient(135deg, #ffd700, #ffec80);
  border-radius: 4px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
}
```

## Cleanup

```ts
// Call when tearing down, e.g. in a SPA route change
mushaf.destroy();
```
