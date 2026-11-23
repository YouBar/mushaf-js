import type { Word, Ayah, Juz, Hizb, Rub, MushafConfig, Surah, Line } from '../types';
import { parseIntAttr } from '../utils/helpers';
import { InkMeter, containsPoint } from '../utils/ink';

/** Lets the handler enrich DOM hits with the page data behind them. */
export interface PageDataResolver {
  getWord(surah: number, ayah: number, word: number): Word | undefined;
  getSurahLine(surah: number): Line | undefined;
  getCurrentPageNumber(): number;
  /**
   * Called before the normal click callbacks with the word / ayah-marker
   * element that was hit. Return true to consume the click (selection mode).
   */
  interceptGlyphClick?(el: HTMLElement): boolean;
  /** Called when the pointer moves onto a word / ayah-marker element. */
  glyphHover?(el: HTMLElement): void;
}

export class EventHandler {
  private container: HTMLElement;
  private config: MushafConfig;
  private resolver: PageDataResolver | null;
  private ink: InkMeter;
  private boundClick:      (e: MouseEvent)    => void;
  private boundMouseOver:  (e: MouseEvent)    => void;
  private boundMouseOut:   (e: MouseEvent)    => void;
  private boundTouchStart: (e: TouchEvent)    => void;
  private boundTouchEnd:   (e: TouchEvent)    => void;
  private boundKeyDown:    (e: KeyboardEvent) => void;
  private touchStartX = 0;
  private touchStartY = 0;

  constructor(
    container: HTMLElement,
    config: MushafConfig,
    resolver: PageDataResolver | null = null,
    ink: InkMeter = new InkMeter()
  ) {
    this.container = container;
    this.config = config;
    this.resolver = resolver;
    this.ink = ink;

    this.boundClick      = (e) => this.handleClick(e);
    this.boundMouseOver  = (e) => this.handleMouseOver(e);
    this.boundMouseOut   = (e) => this.handleMouseOut(e);
    this.boundTouchStart = (e) => this.handleTouchStart(e);
    this.boundTouchEnd   = (e) => this.handleTouchEnd(e);
    this.boundKeyDown    = (e) => this.handleKeyDown(e);

    this.attach();
  }

  private attach(): void {
    this.container.addEventListener('click',      this.boundClick);
    this.container.addEventListener('mouseover',  this.boundMouseOver);
    this.container.addEventListener('mouseout',   this.boundMouseOut);
    this.container.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    this.container.addEventListener('touchend',   this.boundTouchEnd,   { passive: true });
    document.addEventListener('keydown', this.boundKeyDown);
  }

  detach(): void {
    this.container.removeEventListener('click',      this.boundClick);
    this.container.removeEventListener('mouseover',  this.boundMouseOver);
    this.container.removeEventListener('mouseout',   this.boundMouseOut);
    this.container.removeEventListener('touchstart', this.boundTouchStart);
    this.container.removeEventListener('touchend',   this.boundTouchEnd);
    document.removeEventListener('keydown', this.boundKeyDown);
  }

  private handleTouchStart(e: TouchEvent): void {
    this.touchStartX = e.changedTouches[0].clientX;
    this.touchStartY = e.changedTouches[0].clientY;
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (this.config.swipeNavigation === false) return;
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    // Only fire when horizontal movement dominates and exceeds the threshold
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    // RTL book convention: swipe left (dx < 0) → next page, swipe right → prev
    const dir: 'next' | 'prev' = dx < 0 ? 'next' : 'prev';
    this.config.onSwipe?.(dir);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.config.keyboardNavigation === false) return;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    // Don't steal keys from text inputs / selects / editable content
    const active = document.activeElement as HTMLElement | null;
    const tag = (active?.tagName ?? '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active?.isContentEditable) return;

    // RTL convention: ArrowLeft = forward (next page), ArrowRight = backward (prev)
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.config.onKeyNav?.('next');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.config.onKeyNav?.('prev');
    }
  }

  private handleClick(e: MouseEvent): void {
    const domTarget = e.target as HTMLElement | null;
    if (!domTarget || typeof domTarget.closest !== 'function') return;
    const target = this.resolveGlyphAt(domTarget, e.clientX, e.clientY);

    const glyph = target.closest<HTMLElement>('.mushaf-word, .mushaf-ayah-marker');
    if (glyph && this.resolver?.interceptGlyphClick?.(glyph)) return;

    const word = target.closest<HTMLElement>('.mushaf-word');
    if (word && this.config.enableWordClick !== false) {
      this.onWordClick(word);
      return;
    }
    const marker = target.closest<HTMLElement>('.mushaf-ayah-marker');
    if (marker && this.config.enableAyahClick !== false) {
      this.onAyahClick(marker);
      return;
    }
    const surahName = target.closest<HTMLElement>('.mushaf-surah-name');
    if (surahName && this.config.enableSurahClick !== false) {
      this.onSurahClick(surahName);
      return;
    }
    const juz = target.closest<HTMLElement>('.mushaf-juz-marker');
    if (juz && this.config.enableJuzClick !== false) {
      this.onJuzClick(juz);
      return;
    }
    const hizb = target.closest<HTMLElement>('.mushaf-hizb-marker');
    if (hizb) {
      this.onHizbClick(hizb);
      return;
    }
    const rub = target.closest<HTMLElement>('.mushaf-rub-marker');
    if (rub) {
      this.onRubClick(rub);
    }
  }

  /**
   * The glyph whose ink is under the pointer: calligraphy overhangs its box, so the DOM
   * target is not always the glyph that was really clicked.
   */
  private resolveGlyphAt(target: HTMLElement, x: number, y: number): HTMLElement {
    const line = target.closest<HTMLElement>('.mushaf-line--ayah');
    if (!line || (x === 0 && y === 0)) return target;

    const domGlyph = target.closest<HTMLElement>('.mushaf-word, .mushaf-ayah-marker');
    if (domGlyph && this.ink.hasInkAt(domGlyph, x, y) !== false) return target;

    const candidates = Array.from(
      line.querySelectorAll<HTMLElement>('.mushaf-word, .mushaf-ayah-marker')
    ).filter((el) => el !== domGlyph && containsPoint(this.ink.inkBox(el), x, y));

    for (const el of candidates) {
      if (this.ink.hasInkAt(el, x, y)) return el;
    }
    // Pointer is on blank space: keep the DOM hit, or the only overhang there.
    if (domGlyph) return target;
    return candidates.length === 1 ? candidates[0] : target;
  }

  private onWordClick(target: HTMLElement): void {
    this.config.onWordClick?.(this.extractWord(target), target);
  }

  private onAyahClick(markerEl: HTMLElement): void {
    const surah = parseIntAttr(markerEl, 'data-surah');
    const ayah  = parseIntAttr(markerEl, 'data-ayah');
    // Collect the ayah's words across ALL lines of the page, not just the
    // marker's line — long ayahs span several lines.
    const wordEls = Array.from(
      this.container.querySelectorAll<HTMLElement>(
        `.mushaf-word[data-surah="${surah}"][data-ayah="${ayah}"]`
      )
    );
    const words = wordEls.map((el) => this.extractWord(el));

    const info: Ayah = { surah, ayah, words, elements: wordEls };
    this.config.onAyahClick?.(info);
  }

  private onSurahClick(target: HTMLElement): void {
    const holder   = target.closest<HTMLElement>('[data-surah]');
    const surahNum = holder ? parseIntAttr(holder, 'data-surah') : 0;
    const line     = this.resolver?.getSurahLine(surahNum);
    const surah: Surah = {
      number:           surahNum,
      name_arabic:      line?.name_arabic
                          ?? (target.classList.contains('mushaf-bsml') ? '' : (target.textContent ?? '')),
      name_simple:      line?.name_simple ?? target.getAttribute('aria-label') ?? '',
      revelation_place: line?.revelation_place ?? '',
      verses_count:     line?.verses_count ?? 0,
      start_page:       line ? (this.resolver?.getCurrentPageNumber() ?? 0) : 0,
    };
    this.config.onSurahClick?.(surah);
  }

  private onJuzClick(target: HTMLElement): void {
    const info: Juz = {
      juz:  parseIntAttr(target, 'data-juz'),
      page: parseIntAttr(target, 'data-page'),
      line: parseIntAttr(target, 'data-line'),
    };
    this.config.onJuzClick?.(info);
  }

  private onHizbClick(target: HTMLElement): void {
    const info: Hizb = {
      hizb: parseIntAttr(target, 'data-hizb'),
      page: parseIntAttr(target, 'data-page'),
      line: parseIntAttr(target, 'data-line'),
    };
    this.config.onHizbClick?.(info);
  }

  private onRubClick(target: HTMLElement): void {
    const info: Rub = {
      rub:  parseIntAttr(target, 'data-rub'),
      page: parseIntAttr(target, 'data-page'),
      line: parseIntAttr(target, 'data-line'),
    };
    this.config.onRubClick?.(info);
  }

  private handleMouseOver(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const glyph = typeof target.closest === 'function'
      ? target.closest<HTMLElement>('.mushaf-word, .mushaf-ayah-marker')
      : null;
    if (glyph) this.resolver?.glyphHover?.(glyph);
    if (target.classList.contains('mushaf-word'))             target.classList.add('mushaf-word--hover');
    else if (target.classList.contains('mushaf-ayah-marker')) target.classList.add('mushaf-marker--hover');
    else if (target.classList.contains('mushaf-surah-name'))  target.classList.add('mushaf-surah--hover');
  }

  private handleMouseOut(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    target.classList.remove('mushaf-word--hover', 'mushaf-marker--hover', 'mushaf-surah--hover');
  }

  /** Full word record from the page data, falling back to DOM attributes. */
  private extractWord(el: HTMLElement): Word {
    const surah = parseIntAttr(el, 'data-surah');
    const ayah  = parseIntAttr(el, 'data-ayah');
    const word  = parseIntAttr(el, 'data-word');
    const data  = this.resolver?.getWord(surah, ayah, word);
    if (data) return { ...data };
    return {
      location: `${surah}:${ayah}:${word}`,
      surah,
      ayah,
      word,
      qpc: el.textContent ?? '',
      text: el.getAttribute('aria-label'),
    };
  }
}
