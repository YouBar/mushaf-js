export { Mushaf } from './core/Mushaf';
export { Renderer } from './core/Renderer';
export { EventHandler } from './core/EventHandler';
export { HighlightManager } from './core/HighlightManager';
export { Loader } from './core/Loader';
export { FontLoader } from './utils/fontLoader';
export { LRUCache } from './utils/cache';
export { wordPosition, positionToRef, orderRefs } from './utils/position';
export { MUSHAF_CDN_URL, DEFAULT_DATA_BASE_URL, DEFAULT_FONTS_BASE_DIR } from './defaults';
export type { WordRef } from './utils/position';

export type {
  Word,
  Line,
  AyahMarker,
  PageData,
  PageIndex,
  Surah,
  Metadata,
  HighlightStyle,
  HighlightConfig,
  Ayah,
  Juz,
  Hizb,
  Rub,
  MushafConfig,
  MushafTheme,
  MarginMarkerStyle,
  RangeSelection,
} from './types';

export { Mushaf as default } from './core/Mushaf';
