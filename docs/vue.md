---
title: Vue
description: Using mushaf.js in Vue 3 with the official @mushafjs/vue wrapper.
---

# Vue

The `@mushafjs/vue` package provides a `<MushafViewer>` component that wraps the core `mushaf.js` library. It handles lifecycle management, exposes navigation methods via template refs, and maps all callbacks to Vue events.

---

## Installation

```bash
npm install mushaf.js @mushafjs/vue
```

---

## Basic usage

```vue
<template>
  <MushafViewer
  />
</template>

<script setup lang="ts">
import { MushafViewer } from '@mushafjs/vue';
import 'mushaf.js/styles';
</script>
```

---

## Page binding with `v-model`

Use `v-model:page` to keep your component state in sync with the rendered page:

```vue
<template>
  <p>Page {{ page }} / 604</p>
  <MushafViewer v-model:page="page" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MushafViewer } from '@mushafjs/vue';
import 'mushaf.js/styles';

const page = ref(1);
</script>
```

---

## Navigation via template ref

Expose navigation methods to your parent component using a template ref:

```vue
<template>
  <div>
    <button @click="viewer?.previousPage()">← Prev</button>
    <button @click="viewer?.nextPage()">Next →</button>
    <button @click="viewer?.goToSurah(36)">Ya-Sin</button>
    <button @click="viewer?.goToAyah(2, 255)">Ayat al-Kursi</button>
    <button @click="viewer?.clearHighlight()">Clear</button>

    <MushafViewer
      ref="viewer"
      v-model:page="page"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MushafViewer } from '@mushafjs/vue';
import 'mushaf.js/styles';

const page = ref(1);
const viewer = ref<InstanceType<typeof MushafViewer> | null>(null);
</script>
```

---

## Handling events

All `mushaf.js` callbacks are exposed as Vue events using kebab-case names:

```vue
<template>
  <MushafViewer
    @word-click="onWord"
    @ayah-click="onAyah"
    @surah-click="onSurah"
    @page-change="onPage"
  />
</template>

<script setup lang="ts">
import { MushafViewer } from '@mushafjs/vue';
import type { Word, Ayah, Surah } from '@mushafjs/vue';
import 'mushaf.js/styles';

function onWord(word: Word, element: HTMLElement) {
  console.log(`${word.surah}:${word.ayah}:${word.word}`);
}

function onAyah(ayah: Ayah) {
  console.log(`Ayah ${ayah.surah}:${ayah.ayah} — ${ayah.words.length} words`);
}

function onSurah(surah: Surah) {
  console.log(`Surah ${surah.number}: ${surah.name_simple}`);
}

function onPage(page: number) {
  document.title = `Page ${page} / 604`;
}
</script>
```

---

## Highlighting from the parent

```vue
<template>
  <MushafViewer
    ref="viewer"
    @ayah-click="highlightAyah"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MushafViewer } from '@mushafjs/vue';
import type { Ayah } from '@mushafjs/vue';
import 'mushaf.js/styles';

const viewer = ref<InstanceType<typeof MushafViewer> | null>(null);

function highlightAyah(ayah: Ayah) {
  viewer.value?.highlightAyah(ayah.surah, ayah.ayah, {
    style: 'underline',
    color: '#4caf50',
  });
}
</script>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `page` | `number` | `1` | Current page (use with `v-model:page`). |
| `dataBaseUrl` | `string` | `'https://cdn.mushafjs.com/pages'` | Base URL for page JSON files (only to self-host). |
| `fontsBaseDir` | `string` | `'https://cdn.mushafjs.com/fonts'` | Base directory for QPC font files (only to self-host). |
| `preloadPages` | `number` | `3` | Pages to preload on init. |
| `wordHighlight` | `HighlightConfig` | — | Default highlight for words. |
| `ayahHighlight` | `HighlightConfig` | — | Default highlight for ayahs. |
| `surahHighlight` | `HighlightConfig` | — | Default highlight for surahs. |
| `juzHighlight` | `HighlightConfig` | — | Default highlight for juz. |
| `selectionHighlight` | `HighlightConfig` | `{ style: 'border' }` | Style of the range selection. |
| `enableWordClick` | `boolean` | `true` | Enable word click events. |
| `enableAyahClick` | `boolean` | `true` | Enable ayah click events. |
| `enableSurahClick` | `boolean` | `true` | Enable surah header click events. |
| `enableJuzClick` | `boolean` | `true` | Enable juz marker click events. |
| `fontSize` | `number` | — | Base font size in px. |
| `fontFamily` | `string` | — | CSS font-family override. |
| `lineHeight` | `number` | — | CSS line-height override. |
| `textColor` | `string` | — | Text colour override. |

---

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:page` | `number` | Emitted on every page change (supports `v-model:page`). |
| `page-change` | `number` | Same as above — use when you don't need `v-model`. |
| `word-click` | `(word: Word, element: HTMLElement)` | A word glyph was clicked. |
| `ayah-click` | `(ayah: Ayah)` | The ayah-end marker was clicked. |
| `surah-click` | `(surah: Surah)` | A surah header was clicked. |
| `juz-click` | `(juz: Juz)` | A juz margin marker was clicked. |
| `hizb-click` | `(hizb: Hizb)` | A hizb margin marker was clicked. |
| `rub-click` | `(rub: Rub)` | A rub el-hizb marker was clicked. |

---

## Exposed methods

Access these methods via a template ref (see [Navigation via template ref](#navigation-via-template-ref)):

| Method | Description |
|--------|-------------|
| `nextPage()` | Navigate to the next page. |
| `previousPage()` | Navigate to the previous page. |
| `goToPage(page)` | Navigate to a specific page number. |
| `goToSurah(surah)` | Jump to the first page of a surah. |
| `goToAyah(surah, ayah)` | Jump to the page containing an ayah. |
| `highlightWord(surah, ayah, word, config?)` | Highlight a single word. |
| `highlightAyah(surah, ayah, config?)` | Highlight all words of an ayah. |
| `highlightSurah(surah, config?)` | Highlight all words of a surah on the current page. |
| `clearHighlight()` | Remove all highlights. |
| `getCurrentPage()` | Returns the current page number. |
| `getPageInfo()` | Returns `{ page, totalPages }`. |

---

## TypeScript types

Types are re-exported from `@mushafjs/vue` for convenience:

```ts
import type {
  HighlightConfig,
  HighlightStyle,
  Ayah,
  Surah,
  Juz,
  Hizb,
  Rub,
  Word,
  MushafConfig,
} from '@mushafjs/vue';
```
