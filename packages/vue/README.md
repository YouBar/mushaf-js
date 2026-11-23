# @mushafjs/vue

[![npm](https://img.shields.io/npm/v/@mushafjs/vue?color=c9a24f&label=npm)](https://www.npmjs.com/package/@mushafjs/vue)
[![license](https://img.shields.io/badge/license-MIT-1e3468)](https://github.com/YouBar/mushaf-js/blob/develop/LICENSE)

Vue 3 component wrapper for [mushaf.js](https://github.com/YouBar/mushaf-js).
Full documentation: **[mushafjs.com/vue](https://mushafjs.com/vue)**.

## Installation

```bash
npm install mushaf.js @mushafjs/vue
```

## Basic usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { MushafViewer } from '@mushafjs/vue';

const page = ref(1);
</script>

<template>
  <MushafViewer
    v-model:page="page"
    @word-click="(word) => console.log(word)"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Current page — supports `v-model:page` |
| `dataBaseUrl` | `string` | CDN | Base URL for page JSON files (only to self-host) |
| `fontsBaseDir` | `string` | CDN | Base dir for QPC font files (only to self-host) |
| `useQpcFonts` | `boolean` | `true` | Enable per-page QPC fonts |
| `fontSize` | `number` | — | Base font size in px |
| `fontFamily` | `string` | — | CSS font-family override |
| `lineHeight` | `number` | — | CSS line-height override |
| `textColor` | `string` | — | Text colour |
| `wordHighlight` | `HighlightConfig` | — | Default word highlight style |
| `ayahHighlight` | `HighlightConfig` | — | Default ayah highlight style |
| `surahHighlight` | `HighlightConfig` | — | Default surah highlight style |
| `juzHighlight` | `HighlightConfig` | — | Default juz highlight style |
| `selectionHighlight` | `HighlightConfig` | `{ style: 'border' }` | Range selection style |
| `enableWordClick` | `boolean` | `true` | Enable word click events |
| `enableAyahClick` | `boolean` | `true` | Enable ayah marker click events |
| `enableSurahClick` | `boolean` | `true` | Enable surah name click events |
| `enableJuzClick` | `boolean` | `true` | Enable juz marker click events |
| `preloadPages` | `number` | `3` | Adjacent pages to preload |

## Events

| Event | Payload | Description |
|---|---|---|
| `update:page` | `number` | Emitted when the page changes (v-model) |
| `page-change` | `number` | Same as above — useful without v-model |
| `word-click` | `(word: Word, el: HTMLElement)` | A word was clicked |
| `ayah-click` | `AyahInfo` | An ayah marker was clicked |
| `surah-click` | `SurahInfo` | A surah header was clicked |
| `juz-click` | `JuzInfo` | A juz marker was clicked |
| `hizb-click` | `HizbInfo` | A hizb marker was clicked |
| `rub-click` | `RubInfo` | A rub marker was clicked |

## Exposed methods

Access via a template ref:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { MushafViewer } from '@mushafjs/vue';

const viewer = ref<InstanceType<typeof MushafViewer>>();
</script>

<template>
  <MushafViewer ref="viewer" :page="1" />
  <button @click="viewer?.nextPage()">Next</button>
  <button @click="viewer?.previousPage()">Previous</button>
  <button @click="viewer?.goToAyah(2, 255)">Ayat al-Kursi</button>
  <button @click="viewer?.highlightWord(1, 1, 1)">Highlight first word</button>
  <button @click="viewer?.clearHighlight()">Clear</button>
</template>
```

| Method | Signature | Description |
|---|---|---|
| `nextPage` | `() => Promise` | Go to next page |
| `previousPage` | `() => Promise` | Go to previous page |
| `goToPage` | `(page: number) => Promise` | Go to a specific page |
| `goToSurah` | `(surah: number) => Promise` | Jump to surah start |
| `goToAyah` | `(surah, ayah) => Promise` | Jump to ayah |
| `highlightWord` | `(surah, ayah, word, config?)` | Highlight a word |
| `highlightAyah` | `(surah, ayah, config?)` | Highlight an ayah |
| `highlightSurah` | `(surah, config?)` | Highlight a surah |
| `clearHighlight` | `()` | Remove all highlights |
| `getCurrentPage` | `() => number` | Current page number |
| `getPageInfo` | `() => { page, totalPages }` | Page info |

## License

MIT
