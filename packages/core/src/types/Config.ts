import type { Word } from './Word';
import type { Surah } from './PageData';

/**
 * - `background` — a continuous rounded band behind the text (one band per line)
 * - `underline`  — a continuous bar under the text (one bar per line)
 * - `border`     — an outlined band around the text (one outline per line)
 * - `color`      — recolours the glyphs themselves (no box)
 * - `custom`     — adds `customClass` to every highlighted word/marker element
 */
export type HighlightStyle = 'background' | 'underline' | 'border' | 'color' | 'custom';

export interface HighlightConfig {
  style: HighlightStyle;
  color?: string;
  customClass?: string;
  /**
   * Highlighting again with the same key replaces the previous highlight. Defaults to the
   * type ('word' | 'ayah' | 'surah'); pass your own key to keep several at once.
   */
  key?: string;
}

export type MushafTheme = 'auto' | 'light' | 'dark';

export interface RangeSelection {
  start: { surah: number; ayah: number; word: number };
  end: { surah: number; ayah: number; word: number } | null;
}

export interface Ayah {
  surah: number;
  ayah: number;
  words: Word[];
  elements: HTMLElement[];
}

export interface Juz {
  juz: number;
  page: number;
  line: number;
}

export interface Hizb {
  hizb: number;
  page: number;
  line: number;
}

export interface Rub {
  rub: number;
  page: number;
  line: number;
}


export type MarginMarkerStyle = 'ornament' | 'text';

export interface MushafConfig {
  container: string | HTMLElement;

  /**
   * Base URL of the page JSON files; metadata.json and page-index.json are read from its
   * parent. Default: `https://cdn.mushafjs.com/pages`. Only set it to self-host.
   */
  dataBaseUrl?: string;

  /**
   * Fonts folder: `hafs/NNN.woff2`, `QCF_BSML.woff2`, `surah-banner.webp`.
   * Default: `https://cdn.mushafjs.com/fonts`. Only set it to self-host.
   */
  fontsBaseDir?: string;

  /** URL of the basmala/title calligraphy font. Default: `{fontsBaseDir}/QCF_BSML.woff2` */
  basmalaFontUrl?: string;

  /** URL of the surah header frame image. Default: `{fontsBaseDir}/surah-banner.webp` */
  surahBannerUrl?: string;

  /** Colour scheme. 'auto' follows the OS. Default: 'auto' */
  theme?: MushafTheme;

  /** Show the juz/hizb/rub labels in the outer page margin. Default: true */
  showMarginMarkers?: boolean;

  /**
   * 'ornament' (default): the label inside the Madinah mushaf's margin ornament;
   * 'text': the label only.
   */
  marginMarkerStyle?: MarginMarkerStyle;

  /** Show the running header (surah title + juz title) above the page. Default: true */
  showPageHeader?: boolean;

  /** Navigate with ArrowLeft/ArrowRight. Default: true */
  keyboardNavigation?: boolean;

  /** Navigate with horizontal swipes. Default: true */
  swipeNavigation?: boolean;

  onWordClick?: (word: Word, element: HTMLElement) => void;
  onAyahClick?: (ayah: Ayah) => void;
  onSurahClick?: (surah: Surah) => void;
  onJuzClick?: (juz: Juz) => void;
  onHizbClick?: (hizb: Hizb) => void;
  onRubClick?: (rub: Rub) => void;
  onPageChange?: (page: number) => void;

  /** Fired whenever the range selection changes (see `startSelection()`). */
  onSelectionChange?: (selection: RangeSelection | null) => void;

  /** Style of the range-selection highlight. Default: `{ style: 'border' }` */
  selectionHighlight?: HighlightConfig;

  /** Intercept swipes ('next' = swipe left, RTL). Without it the library navigates itself. */
  onSwipe?: (direction: 'next' | 'prev') => void;

  /** Intercept ArrowLeft ('next', RTL) / ArrowRight ('prev'). Without it the library navigates itself. */
  onKeyNav?: (direction: 'next' | 'prev') => void;

  /** Fixed font size in px (fixes the page width). Default: derived from the container width. */
  fontSize?: number;
  /** Fallback font used when a page font fails to load (Unicode text is shown). */
  fontFamily?: string;
  /** Line pitch in em (distance between baselines). Default: 1.78 */
  lineHeight?: number;
  textColor?: string;

  wordHighlight?: HighlightConfig;
  ayahHighlight?: HighlightConfig;
  surahHighlight?: HighlightConfig;
  juzHighlight?: HighlightConfig;

  enableWordClick?: boolean;
  enableAyahClick?: boolean;
  enableSurahClick?: boolean;
  enableJuzClick?: boolean;

  /** Number of adjacent pages to preload. Default: 3 */
  preloadPages?: number;
}
