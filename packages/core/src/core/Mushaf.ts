import { Renderer } from './Renderer';
import { EventHandler } from './EventHandler';
import { HighlightManager } from './HighlightManager';
import { Loader } from './Loader';
import { FontLoader } from '../utils/fontLoader';
import { InkMeter } from '../utils/ink';
import { isValidPage, clamp } from '../utils/helpers';
import { wordPosition, orderRefs, type WordRef } from '../utils/position';
import type { MushafConfig, HighlightConfig, Metadata, Surah, MushafTheme, Word, RangeSelection } from '../types';

const SELECTION_KEY = '__mushaf-selection';

/** Natural em-width of the widest justified line + the page's side margins. */
const LINE_EM = 16.4;
const MARGIN_EM = 1.6;

export class Mushaf {
  private container: HTMLElement;
  private config: MushafConfig;
  private renderer: Renderer;
  private eventHandler: EventHandler;
  private highlightManager: HighlightManager;
  private loader: Loader;
  private fontLoader: FontLoader;
  private resizeObserver: ResizeObserver | null = null;
  private currentPage = 1;
  /** Page most recently requested (may still be loading). */
  private targetPage = 1;
  /** Incremented per navigation; stale loads are discarded. */
  private renderToken = 0;
  private initialized = false;
  private destroyed = false;
  private lastWidth = 0;
  private selecting = false;
  private selection: RangeSelection | null = null;
  private previewPosition: number | null = null;
  private previewFrame = 0;

  constructor(config: MushafConfig) {
    this.config = config;
    this.container = this.resolveContainer(config.container);

    this.fontLoader = new FontLoader(config.fontsBaseDir, config.basmalaFontUrl);
    this.loader = new Loader({ dataBaseUrl: config.dataBaseUrl });

    const ink = new InkMeter();
    this.renderer = new Renderer(this.container, this.fontLoader, {
      showMarginMarkers: config.showMarginMarkers,
      marginMarkerStyle: config.marginMarkerStyle,
      showPageHeader: config.showPageHeader,
    }, ink);
    this.eventHandler = new EventHandler(this.container, this.buildDelegatedConfig(), {
      getWord: (s, a, w) => this.renderer.getWord(s, a, w),
      getSurahLine: (s) => this.renderer.getSurahLine(s),
      getCurrentPageNumber: () => this.currentPage,
      interceptGlyphClick: (el) => this.handleSelectionClick(el),
      glyphHover: (el) => this.previewSelection(el),
    }, ink);
    this.highlightManager = new HighlightManager(this.container, ink);

    this.container.classList.add('mushaf-container');
    // The ornaments need a wider side margin; without them keep the compact page.
    this.container.classList.toggle(
      'mushaf-container--ornaments',
      config.showMarginMarkers !== false && config.marginMarkerStyle !== 'text',
    );
    this.applyInlineStyles();
    this.setTheme(config.theme ?? 'auto');

    // Highlight bands are stored in % of the line width, so they scale with
    // the page. Only repaint when the page goes from hidden (0px) to visible.
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 0;
        if (width > 0 && this.lastWidth === 0) this.highlightManager.refresh();
        this.lastWidth = width;
      });
      this.resizeObserver.observe(this.container);
    }
  }

  async init(): Promise<void> {
    if (this.initialized || this.destroyed) return;
    this.initialized = true;

    this.fontLoader.loadBsmlFont().catch(() => undefined);
    const preloadCount = clamp(this.config.preloadPages ?? 3, 1, 10);
    for (let i = 1; i <= preloadCount; i++) {
      this.loader.preloadPage(i);
      this.fontLoader.preloadPageFont(i);
    }
  }

  async renderPage(pageNumber: number): Promise<void> {
    if (this.destroyed) return;
    if (!isValidPage(pageNumber)) {
      throw new Error(`Invalid page number: ${pageNumber}. Must be 1–604.`);
    }

    const token = ++this.renderToken;
    this.targetPage = pageNumber;

    const [pageData, pageFontOk] = await Promise.all([
      this.loader.loadPage(pageNumber),
      this.fontLoader.loadPageFont(pageNumber),
      this.fontLoader.loadBsmlFont(),
    ]);

    // A newer navigation started while we were loading — drop this one.
    if (token !== this.renderToken) return;

    this.renderer.buildPage(pageData, pageFontOk);
    this.currentPage = pageNumber;
    this.highlightManager.refresh();

    this.loader.preloadPage(pageNumber + 1);
    this.loader.preloadPage(pageNumber - 1);
    this.fontLoader.preloadPageFont(pageNumber + 1);
    this.fontLoader.preloadPageFont(pageNumber - 1);

    this.config.onPageChange?.(pageNumber);
  }

  /** Rapid calls accumulate: three quick calls advance three pages. */
  async nextPage(): Promise<void> {
    if (this.targetPage < 604) await this.renderPage(this.targetPage + 1);
  }

  async previousPage(): Promise<void> {
    if (this.targetPage > 1) await this.renderPage(this.targetPage - 1);
  }

  async goToPage(pageNumber: number): Promise<void> {
    await this.renderPage(pageNumber);
  }

  async goToSurah(surahNumber: number): Promise<void> {
    const page = await this.loader.findPageForSurah(surahNumber);
    await this.renderPage(page);
  }

  async goToAyah(surah: number, ayah: number): Promise<void> {
    const page = await this.loader.findPageForAyah(surah, ayah);
    await this.renderPage(page);
  }

  highlightWord(surah: number, ayah: number, wordIndex: number, config?: HighlightConfig): void {
    this.highlightManager.highlightWord(
      { surah, ayah, word: wordIndex },
      config ?? this.config.wordHighlight
    );
  }

  highlightAyah(surah: number, ayah: number, config?: HighlightConfig): void {
    this.highlightManager.highlightAyah(surah, ayah, config ?? this.config.ayahHighlight);
  }

  highlightSurah(surah: number, config?: HighlightConfig): void {
    this.highlightManager.highlightSurah(surah, config ?? this.config.surahHighlight);
  }

  /** Highlight from `from` to `to` (inclusive, word level: may start or end mid-ayah). */
  highlightRange(from: WordRef, to: WordRef, config?: HighlightConfig): void {
    this.highlightManager.highlightRange(
      wordPosition(from),
      wordPosition(to),
      config ?? this.config.ayahHighlight
    );
  }

  /** Apply many highlight/clear calls with a single repaint. */
  batchHighlights(fn: () => void): void {
    this.highlightManager.batch(fn);
  }

  /** Remove every highlight whose key starts with `prefix` (e.g. 'mistake:'). */
  clearHighlightsWithPrefix(prefix: string): void {
    this.highlightManager.clearHighlightsWithPrefix(prefix);
  }

  /**
   * Selection mode: first tap sets the start, second the end, a third starts over.
   * Word/ayah click callbacks are suppressed meanwhile; changes go to `onSelectionChange`.
   */
  startSelection(initial?: RangeSelection | null): void {
    this.selecting = true;
    this.setSelection(initial ?? null);
  }

  /** Leave selection mode and remove the selection highlight. */
  cancelSelection(): void {
    this.selecting = false;
    this.setSelection(null);
  }

  isSelecting(): boolean {
    return this.selecting;
  }

  getSelection(): RangeSelection | null {
    return this.selection ? { ...this.selection } : null;
  }

  /** Set (or clear with null) the selection programmatically. */
  setSelection(selection: RangeSelection | null): void {
    this.previewPosition = null;
    if (selection?.end) {
      const [start, end] = orderRefs(selection.start, selection.end);
      selection = { start, end };
    }
    this.selection = selection;
    if (selection) {
      this.highlightManager.highlightRange(
        wordPosition(selection.start),
        wordPosition(selection.end ?? selection.start),
        { ...(this.config.selectionHighlight ?? { style: 'border' }), key: SELECTION_KEY }
      );
    } else {
      this.highlightManager.clearHighlight(SELECTION_KEY);
    }
    this.config.onSelectionChange?.(this.getSelection());
  }

  private handleSelectionClick(el: HTMLElement): boolean {
    if (!this.selecting) return false;
    const ref: WordRef = {
      surah: Number(el.getAttribute('data-surah')),
      ayah: Number(el.getAttribute('data-ayah')),
      word: Number(el.getAttribute('data-word')),
    };
    if (!ref.surah || !ref.ayah || !ref.word) return false;

    if (!this.selection || this.selection.end) {
      this.setSelection({ start: ref, end: null });
    } else if (wordPosition(ref) === wordPosition(this.selection.start)) {
      // Tapping the pending start again cancels it.
      this.setSelection(null);
    } else {
      this.setSelection({ start: this.selection.start, end: ref });
    }
    return true;
  }

  /** With only the start picked, preview the range up to the glyph under the pointer. */
  private previewSelection(el: HTMLElement): void {
    const sel = this.selection;
    if (!this.selecting || !sel || sel.end) return;
    const ref: WordRef = {
      surah: Number(el.getAttribute('data-surah')),
      ayah: Number(el.getAttribute('data-ayah')),
      word: Number(el.getAttribute('data-word')),
    };
    if (!ref.surah || !ref.ayah || !ref.word) return;
    const position = wordPosition(ref);
    if (position === this.previewPosition) return;
    this.previewPosition = position;

    if (typeof requestAnimationFrame === 'undefined') return;
    cancelAnimationFrame(this.previewFrame);
    this.previewFrame = requestAnimationFrame(() => {
      const current = this.selection;
      if (!current || current.end) return;
      this.highlightManager.highlightRange(wordPosition(current.start), position, {
        ...(this.config.selectionHighlight ?? { style: 'border' }),
        key: SELECTION_KEY,
      });
    });
  }

  /** Clear all highlights, or only those of a type or custom key. */
  clearHighlight(keyOrType?: string): void {
    if (keyOrType === undefined && this.selection) {
      // Keep an active selection when clearing the user's own highlights.
      this.highlightManager.batch(() => {
        this.highlightManager.clearHighlight();
        this.setSelection(this.selection);
      });
      return;
    }
    this.highlightManager.clearHighlight(keyOrType);
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getPageInfo(): { page: number; totalPages: number } {
    return { page: this.currentPage, totalPages: 604 };
  }

  /** Full word record (incl. Unicode `text`) for a word on the current page. */
  getWord(surah: number, ayah: number, word: number): Word | undefined {
    return this.renderer.getWord(surah, ayah, word);
  }

  async getMetadata(): Promise<Metadata> {
    return this.loader.loadMetadata();
  }

  async getSurahInfo(surahNumber: number): Promise<Surah | undefined> {
    const metadata = await this.loader.loadMetadata();
    return metadata.surahs.find((s) => s.number === surahNumber);
  }

  setTheme(theme: MushafTheme): void {
    if (theme === 'auto') this.container.removeAttribute('data-mushaf-theme');
    else this.container.setAttribute('data-mushaf-theme', theme);
  }

  destroy(): void {
    this.destroyed = true;
    this.renderToken++;
    this.resizeObserver?.disconnect();
    this.eventHandler.detach();
    this.highlightManager.clearHighlight();
    this.renderer.destroy();
    this.container.innerHTML = '';
    this.container.classList.remove('mushaf-container', 'mushaf-container--ornaments');
    this.container.removeAttribute('data-mushaf-theme');
  }

  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === 'string') {
      const el = document.querySelector<HTMLElement>(container);
      if (!el) throw new Error(`Container not found: "${container}"`);
      return el;
    }
    return container;
  }

  private applyInlineStyles(): void {
    const { fontSize, fontFamily, lineHeight, textColor, surahBannerUrl } = this.config;
    const style = this.container.style;
    // A fixed font size fixes the page width (the font is width-derived).
    if (fontSize) style.maxWidth = `${(fontSize * (LINE_EM + 2 * MARGIN_EM)).toFixed(1)}px`;
    if (fontFamily) style.setProperty('--mushaf-fallback-font', fontFamily);
    if (lineHeight) style.setProperty('--mushaf-line-height', `${lineHeight}em`);
    if (textColor) style.setProperty('--mushaf-text', textColor);
    // Resolve to an absolute URL: a relative url() inside a custom property is
    // resolved against the *stylesheet* that uses it, not the document.
    const banner = surahBannerUrl ?? `${this.fontLoader.getBaseDir()}/surah-banner.webp`;
    let bannerUrl = banner;
    try { bannerUrl = new URL(banner, document.baseURI).href; } catch { /* keep as-is */ }
    style.setProperty('--mushaf-surah-banner', `url("${bannerUrl}")`);
  }

  private buildDelegatedConfig(): MushafConfig {
    return {
      ...this.config,
      onSwipe: (dir) => {
        if (dir === 'next') this.nextPage().catch(() => undefined);
        else this.previousPage().catch(() => undefined);
        this.config.onSwipe?.(dir);
      },
      onKeyNav: (dir) => {
        if (dir === 'next') this.nextPage().catch(() => undefined);
        else this.previousPage().catch(() => undefined);
        this.config.onKeyNav?.(dir);
      },
    };
  }
}
