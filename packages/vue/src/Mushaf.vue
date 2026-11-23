<template>
  <div ref="containerRef" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Mushaf } from 'mushaf.js';
import type {
  HighlightConfig,
  Ayah,
  Juz,
  Hizb,
  Rub,
  Surah,
  Word,
  MushafTheme,
  RangeSelection,
  WordRef,
} from 'mushaf.js';

const props = withDefaults(
  defineProps<{
    /** Current page number (supports v-model:page). */
    page?: number;

    /** Base URL for page JSON data files. */
    dataBaseUrl?: string;

    /** Base directory of the fonts (default: the mushaf.js CDN). */
    fontsBaseDir?: string;

    /** URL of the basmala / title calligraphy font. */
    basmalaFontUrl?: string;

    /** URL of the surah header frame image. */
    surahBannerUrl?: string;

    /** 'auto' (follow OS), 'light' or 'dark'. */
    theme?: MushafTheme;

    showMarginMarkers?: boolean;
    marginMarkerStyle?: 'ornament' | 'text';
    showPageHeader?: boolean;
    keyboardNavigation?: boolean;
    swipeNavigation?: boolean;

    /** Fixed font size in px (default: derived from the container width). */
    fontSize?: number;

    /** Fallback font used if a page font fails to load. */
    fontFamily?: string;

    /** Line pitch in em. */
    lineHeight?: number;

    textColor?: string;

    /** Default highlight style applied to word highlights. */
    wordHighlight?: HighlightConfig;

    /** Default highlight style applied to ayah highlights. */
    ayahHighlight?: HighlightConfig;

    /** Default highlight style applied to surah highlights. */
    surahHighlight?: HighlightConfig;

    /** Default highlight style applied to juz highlights. */
    juzHighlight?: HighlightConfig;

    /** Style of the range-selection highlight. */
    selectionHighlight?: HighlightConfig;

    enableWordClick?: boolean;
    enableAyahClick?: boolean;
    enableSurahClick?: boolean;
    enableJuzClick?: boolean;

    /** Number of adjacent pages to preload. Default: 3. */
    preloadPages?: number;
  }>(),
  {
    page: 1,
    theme: 'auto',
    showMarginMarkers: true,
    showPageHeader: true,
    keyboardNavigation: true,
    swipeNavigation: true,
    enableWordClick: true,
    enableAyahClick: true,
    enableSurahClick: true,
    enableJuzClick: true,
    preloadPages: 3,
  }
);

const emit = defineEmits<{
  'update:page': [page: number];
  'page-change': [page: number];
  'word-click':  [word: Word, element: HTMLElement];
  'ayah-click':  [ayah: Ayah];
  'surah-click': [surah: Surah];
  'juz-click':   [juz: Juz];
  'hizb-click':  [hizb: Hizb];
  'rub-click':   [rub: Rub];
  'selection-change': [selection: RangeSelection | null];
}>();

const containerRef = ref<HTMLElement | null>(null);
let mushaf: Mushaf | null = null;

onMounted(async () => {
  if (!containerRef.value) return;

  const instance = new Mushaf({
    container: containerRef.value,

    dataBaseUrl:  props.dataBaseUrl,
    fontsBaseDir: props.fontsBaseDir,
    basmalaFontUrl: props.basmalaFontUrl,
    surahBannerUrl: props.surahBannerUrl,
    theme:          props.theme,
    showMarginMarkers:  props.showMarginMarkers,
    marginMarkerStyle:  props.marginMarkerStyle,
    showPageHeader:     props.showPageHeader,
    keyboardNavigation: props.keyboardNavigation,
    swipeNavigation:    props.swipeNavigation,

    fontSize:   props.fontSize,
    fontFamily: props.fontFamily,
    lineHeight: props.lineHeight,
    textColor:  props.textColor,

    wordHighlight:  props.wordHighlight,
    ayahHighlight:  props.ayahHighlight,
    surahHighlight: props.surahHighlight,
    juzHighlight:   props.juzHighlight,
    selectionHighlight: props.selectionHighlight,

    enableWordClick:  props.enableWordClick,
    enableAyahClick:  props.enableAyahClick,
    enableSurahClick: props.enableSurahClick,
    enableJuzClick:   props.enableJuzClick,
    preloadPages:     props.preloadPages,

    onWordClick:  (word, element) => emit('word-click', word, element),
    onAyahClick:  (ayah)          => emit('ayah-click', ayah),
    onSurahClick: (surah)         => emit('surah-click', surah),
    onJuzClick:   (juz)           => emit('juz-click', juz),
    onHizbClick:  (hizb)          => emit('hizb-click', hizb),
    onRubClick:   (rub)           => emit('rub-click', rub),
    onSelectionChange: (selection) => emit('selection-change', selection),

    onPageChange: (page) => {
      emit('update:page', page);
      emit('page-change', page);
    },
  });

  mushaf = instance;
  // Unmounted while loading: destroy() has already made the instance inert.
  await instance.init();
  await instance.renderPage(props.page);
});

onUnmounted(() => {
  mushaf?.destroy();
  mushaf = null;
});

// Sync external page changes to the renderer.
watch(
  () => props.page,
  async (newPage) => {
    if (mushaf && newPage !== mushaf.getCurrentPage()) {
      await mushaf.renderPage(newPage);
    }
  }
);

watch(
  () => props.theme,
  (theme) => mushaf?.setTheme(theme ?? 'auto')
);

defineExpose({
  nextPage: () => mushaf?.nextPage(),

  previousPage: () => mushaf?.previousPage(),

  goToPage: (page: number) => mushaf?.goToPage(page),

  goToSurah: (surah: number) => mushaf?.goToSurah(surah),

  goToAyah: (surah: number, ayah: number) => mushaf?.goToAyah(surah, ayah),

  highlightWord: (surah: number, ayah: number, word: number, config?: HighlightConfig) =>
    mushaf?.highlightWord(surah, ayah, word, config),

  highlightAyah: (surah: number, ayah: number, config?: HighlightConfig) =>
    mushaf?.highlightAyah(surah, ayah, config),

  /** Highlight all words of a surah (persists across pages). */
  highlightSurah: (surah: number, config?: HighlightConfig) =>
    mushaf?.highlightSurah(surah, config),

  /** Remove all highlights, or only the one stored under a type/key. */
  clearHighlight: (keyOrType?: string) => mushaf?.clearHighlight(keyOrType),

  /** Highlight a word-level range (may start/end mid-ayah, spans pages). */
  highlightRange: (from: WordRef, to: WordRef, config?: HighlightConfig) =>
    mushaf?.highlightRange(from, to, config),

  /** Apply many highlight calls with one repaint. */
  batchHighlights: (fn: () => void) => mushaf?.batchHighlights(fn),

  /** Remove all highlights whose key starts with a prefix. */
  clearHighlightsWithPrefix: (prefix: string) => mushaf?.clearHighlightsWithPrefix(prefix),

  /** Range selection: tap start, tap end; emits `selection-change`. */
  startSelection: (initial?: RangeSelection | null) => mushaf?.startSelection(initial),
  cancelSelection: () => mushaf?.cancelSelection(),
  setSelection: (selection: RangeSelection | null) => mushaf?.setSelection(selection),
  getSelection: () => mushaf?.getSelection() ?? null,

  setTheme: (theme: MushafTheme) => mushaf?.setTheme(theme),

  getCurrentPage: (): number => mushaf?.getCurrentPage() ?? 1,

  getPageInfo: () => mushaf?.getPageInfo() ?? { page: 1, totalPages: 604 },
});
</script>
