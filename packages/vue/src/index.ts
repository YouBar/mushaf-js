export { default as MushafViewer, default } from './Mushaf.vue';

// Re-export types consumers commonly need alongside the component.
export type {
  HighlightConfig,
  HighlightStyle,
  MushafTheme,
  RangeSelection,
  WordRef,
  Ayah,
  Juz,
  Hizb,
  Rub,
  Surah,
  Word,
  MushafConfig,
} from 'mushaf.js';
