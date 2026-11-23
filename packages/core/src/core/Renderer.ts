import type { PageData, Line, Word, MarginMarkerStyle } from '../types';
import { FontLoader, BSML_FONT_NAME } from '../utils/fontLoader';
import { InkMeter } from '../utils/ink';
import { MARKER_FULL, MARKER_HALF, type MarkerOrnament } from '../assets/markerOrnaments';

interface WordGroup {
  surah: number;
  ayah: number;
  words: Word[];
}

export interface RenderOptions {
  /** Show juz/hizb/rub labels in the outer page margin. */
  showMarginMarkers?: boolean;
  /** 'ornament' (default, as in the printed mushaf) or plain 'text' labels. */
  marginMarkerStyle?: MarginMarkerStyle;
  /** Show the running header (surah title + juz title). */
  showPageHeader?: boolean;
}

/**
 * QCF_BSML code points: U+FAD5..U+FAD8 basmala, U+F100 + (surah − 1) surah title,
 * U+F1D8 + (juz − 1) juz title.
 */
const BSML_BASMALA = '𥉉𥳐𧻓齃';
const bsmlSurahTitle = (surah: number): string => String.fromCodePoint(0xf100 + surah - 1);
const bsmlJuzTitle = (juz: number): string => String.fromCodePoint(0xf1d8 + juz - 1);

const BASMALA_UNICODE = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';

/**
 * Every page has 15 equal line slots and one global font size (a ratio of the page
 * width, see mushaf.css), so nothing is measured at runtime and resizing is pure CSS.
 */
export class Renderer {
  private container: HTMLElement;
  private fontLoader: FontLoader;
  private options: RenderOptions;
  private currentPage: PageData | null = null;
  private wordIndex = new Map<string, Word>();
  private ink: InkMeter;

  constructor(
    container: HTMLElement,
    fontLoader: FontLoader,
    options: RenderOptions = {},
    ink: InkMeter = new InkMeter()
  ) {
    this.container = container;
    this.fontLoader = fontLoader;
    this.options = options;
    this.ink = ink;
  }

  setOptions(options: RenderOptions): void {
    this.options = { ...this.options, ...options };
  }

  async renderPage(pageData: PageData): Promise<void> {
    const [pageFontOk] = await Promise.all([
      this.fontLoader.loadPageFont(pageData.page),
      this.fontLoader.loadBsmlFont(),
    ]);
    this.buildPage(pageData, pageFontOk !== false);
  }

  buildPage(pageData: PageData, pageFontOk = true): void {
    const pageNumber = pageData.page;
    const bsmlOk = this.fontLoader.isBsmlLoaded();

    this.currentPage = pageData;
    this.wordIndex.clear();

    const pageEl = document.createElement('div');
    pageEl.className = 'mushaf-page';
    pageEl.classList.add(pageNumber % 2 === 1 ? 'mushaf-page--right' : 'mushaf-page--left');
    if (pageData.is_centered) pageEl.classList.add('mushaf-page--centered');
    if (!pageFontOk) pageEl.classList.add('mushaf-page--fallback');
    if (!bsmlOk) pageEl.classList.add('mushaf-page--no-bsml');
    pageEl.setAttribute('data-page', String(pageNumber));
    pageEl.setAttribute('data-juz', String(pageData.juz));
    pageEl.style.setProperty('--mushaf-page-font', `'${this.fontLoader.getFontName(pageNumber)}'`);

    if (this.options.showPageHeader !== false) {
      pageEl.appendChild(this.renderPageHeader(pageData));
    }

    const linesEl = document.createElement('div');
    linesEl.className = 'mushaf-lines';
    pageData.lines.forEach((line, index) => {
      linesEl.appendChild(this.renderLine(line, index + 1, pageNumber, pageFontOk));
    });
    pageEl.appendChild(linesEl);

    const pageNumEl = document.createElement('div');
    pageNumEl.className = 'mushaf-page-number';
    pageNumEl.setAttribute('aria-label', `Page ${pageNumber}`);
    pageNumEl.textContent = toEasternNumeral(pageNumber);
    pageEl.appendChild(pageNumEl);

    const wrapEl = document.createElement('div');
    wrapEl.className = 'mushaf-page-wrap';
    wrapEl.appendChild(pageEl);

    this.container.innerHTML = '';
    this.container.appendChild(wrapEl);
  }

  getCurrentPageData(): PageData | null {
    return this.currentPage;
  }

  /** Look up the full word record (incl. Unicode `text`) for a rendered word. */
  getWord(surah: number, ayah: number, word: number): Word | undefined {
    return this.wordIndex.get(`${surah}:${ayah}:${word}`);
  }

  /** All words (excluding end markers) of an ayah on the current page, in order. */
  getAyahWords(surah: number, ayah: number): Word[] {
    const out: Word[] = [];
    for (const line of this.currentPage?.lines ?? []) {
      for (const w of line.words ?? []) {
        if (w.surah === surah && w.ayah === ayah && !w.is_end_marker) out.push(w);
      }
    }
    return out;
  }

  getSurahLine(surah: number): Line | undefined {
    return this.currentPage?.lines.find((l) => l.type === 'surah_name' && l.surah === surah);
  }

  private renderPageHeader(pageData: PageData): HTMLElement {
    const header = document.createElement('div');
    header.className = 'mushaf-page-header';

    const firstWord = pageData.lines.find((l) => l.words?.length)?.words?.[0];
    const surah = firstWord?.surah ?? pageData.lines.find((l) => l.surah)?.surah ?? 1;

    const surahEl = document.createElement('span');
    surahEl.className = 'mushaf-page-header-surah mushaf-bsml';
    surahEl.setAttribute('data-surah', String(surah));
    surahEl.setAttribute('aria-label', `Surah ${surah}`);
    surahEl.textContent = bsmlSurahTitle(surah);

    const juzEl = document.createElement('span');
    juzEl.className = 'mushaf-page-header-juz mushaf-bsml';
    juzEl.setAttribute('data-juz', String(pageData.juz));
    juzEl.setAttribute('aria-label', `Juz ${pageData.juz}`);
    juzEl.textContent = bsmlJuzTitle(pageData.juz);

    header.append(surahEl, juzEl);
    return header;
  }

  private renderLine(line: Line, lineNumber: number, pageNumber: number, pageFontOk: boolean): HTMLElement {
    const lineEl = document.createElement('div');
    lineEl.className = `mushaf-line mushaf-line--${line.type}`;
    lineEl.setAttribute('data-line', String(lineNumber));

    if (line.type === 'ayah' && (line.centered ?? false)) {
      lineEl.classList.add('mushaf-line--centered');
    }

    if (this.options.showMarginMarkers !== false) {
      const marker = this.renderMarginMarker(line, pageNumber, lineNumber);
      if (marker) lineEl.appendChild(marker);
    }

    switch (line.type) {
      case 'surah_name': return this.renderSurahName(line, lineEl);
      case 'basmala':    return this.renderBasmala(lineEl);
      case 'ayah':       return this.renderAyahLine(line, lineEl, pageFontOk);
      default:           return lineEl;
    }
  }

  private renderSurahName(line: Line, container: HTMLElement): HTMLElement {
    const surah = line.surah ?? 0;
    container.setAttribute('data-surah', String(surah));

    const frame = document.createElement('div');
    frame.className = 'mushaf-surah-header';

    const nameEl = document.createElement('span');
    nameEl.className = 'mushaf-surah-name';
    nameEl.setAttribute('role', 'heading');
    nameEl.setAttribute('aria-level', '2');
    nameEl.setAttribute('aria-label', line.name_simple ?? line.name_arabic ?? '');
    nameEl.setAttribute('data-surah', String(surah));

    if (this.fontLoader.isBsmlLoaded() && surah >= 1 && surah <= 114) {
      nameEl.classList.add('mushaf-bsml');
      nameEl.textContent = bsmlSurahTitle(surah);
      // Each title glyph sits at a different height in its em box; centre its
      // INK optically inside the banner (the span is a 1em-high line box).
      const dy = this.ink.inkCenterOffsetEm(`'${BSML_FONT_NAME}'`, nameEl.textContent, 1);
      if (dy) nameEl.style.setProperty('--mushaf-title-shift', `${(-dy).toFixed(4)}em`);
    } else {
      nameEl.textContent = `سُورَةُ ${line.name_arabic ?? ''}`;
    }

    frame.appendChild(nameEl);
    container.appendChild(frame);
    return container;
  }

  private renderBasmala(container: HTMLElement): HTMLElement {
    const textEl = document.createElement('span');
    textEl.className = 'mushaf-basmala-text';
    textEl.setAttribute('role', 'img');
    textEl.setAttribute('aria-label', BASMALA_UNICODE);
    if (this.fontLoader.isBsmlLoaded()) {
      textEl.classList.add('mushaf-bsml');
      textEl.textContent = BSML_BASMALA;
    } else {
      textEl.textContent = BASMALA_UNICODE;
    }
    container.appendChild(textEl);
    return container;
  }

  private renderAyahLine(line: Line, container: HTMLElement, pageFontOk: boolean): HTMLElement {
    if (!line.words?.length) return container;

    for (const group of this.groupWordsByAyah(line.words)) {
      const ayahSpan = document.createElement('span');
      ayahSpan.className = 'mushaf-ayah';
      ayahSpan.setAttribute('data-surah', String(group.surah));
      ayahSpan.setAttribute('data-ayah', String(group.ayah));

      for (const word of group.words) {
        this.wordIndex.set(`${word.surah}:${word.ayah}:${word.word}`, word);
        ayahSpan.appendChild(
          word.is_end_marker
            ? this.renderAyahEndMarker(word, pageFontOk)
            : this.renderWord(word, pageFontOk)
        );
      }
      container.appendChild(ayahSpan);
    }
    return container;
  }

  private renderWord(word: Word, pageFontOk: boolean): HTMLElement {
    const span = document.createElement('span');
    span.className = 'mushaf-word';
    span.textContent = pageFontOk || !word.text ? word.qpc : word.text;
    span.setAttribute('data-surah', String(word.surah));
    span.setAttribute('data-ayah', String(word.ayah));
    span.setAttribute('data-word', String(word.word));
    if (word.text) span.setAttribute('aria-label', word.text);
    return span;
  }

  /** The QPC ayah-end glyph already encodes the number (and ۩ for sajda verses). */
  private renderAyahEndMarker(word: Word, pageFontOk: boolean): HTMLElement {
    const marker = document.createElement('span');
    marker.className = 'mushaf-ayah-marker';
    marker.setAttribute('data-ayah-number', String(word.ayah));
    marker.setAttribute('data-surah', String(word.surah));
    marker.setAttribute('data-ayah', String(word.ayah));
    marker.setAttribute('data-word', String(word.word));
    marker.setAttribute('role', 'button');
    marker.setAttribute('aria-label', `End of Ayah ${word.ayah}`);
    marker.textContent = pageFontOk ? word.qpc : `۝${toEasternNumeral(word.ayah)}`;
    return marker;
  }

  /** Juz / hizb / quarter label in the outer margin; the ۞ itself is part of the QPC text. */
  private renderMarginMarker(line: Line, page: number, lineNumber: number): HTMLElement | null {
    const { juz_start: juz, hizb_start: hizbStart, rub_start: rub } = line;
    if (juz === undefined && hizbStart === undefined && rub === undefined) return null;

    const el = document.createElement('span');
    el.className = 'mushaf-margin-marker';
    el.setAttribute('data-page', String(page));
    el.setAttribute('data-line', String(lineNumber));
    el.setAttribute('role', 'note');

    const hizb = hizbStart ?? (rub !== undefined ? Math.ceil(rub / 4) : undefined);
    if (hizb !== undefined) el.setAttribute('data-hizb', String(hizb));
    if (rub !== undefined) el.setAttribute('data-rub', String(rub));

    const quarter = rub !== undefined ? (rub - 1) % 4 : 0;
    const fullText = juz !== undefined
      ? `الجزء ${toEasternNumeral(juz)}`
      : `${['', 'ربع ', 'نصف ', 'ثلاثة أرباع '][quarter]}الحزب ${toEasternNumeral(hizb ?? 0)}`;

    if (this.options.marginMarkerStyle !== 'text') {
      el.title = fullText;
      return this.renderMarkerOrnament(el, juz, hizb, quarter);
    }

    if (juz !== undefined) {
      el.classList.add('mushaf-juz-marker');
      el.setAttribute('data-juz', String(juz));
      el.setAttribute('aria-label', `Start of Juz ${juz}`);
      const title = document.createElement('span');
      if (this.fontLoader.isBsmlLoaded()) {
        title.className = 'mushaf-bsml';
        title.textContent = bsmlJuzTitle(juz);
      } else {
        title.textContent = `الجزء ${toEasternNumeral(juz)}`;
      }
      el.appendChild(title);
      return el;
    }

    if (quarter === 0) {
      el.classList.add('mushaf-hizb-marker');
      el.setAttribute('aria-label', `Start of Hizb ${hizb}`);
      el.textContent = `الحزب ${toEasternNumeral(hizb ?? 0)}`;
    } else {
      el.classList.add('mushaf-rub-marker');
      el.setAttribute('aria-label', `Quarter ${quarter} of Hizb ${hizb}`);
      const label = ['', 'ربع', 'نصف', 'ثلاثة أرباع'][quarter];
      el.textContent = `${label} الحزب ${toEasternNumeral(hizb ?? 0)}`;
    }
    return el;
  }

  /** Arched ornament for quarters, symmetric for a hizb / juz start, as in the Madinah print. */
  private renderMarkerOrnament(
    el: HTMLElement, juz: number | undefined, hizb: number | undefined, quarter: number,
  ): HTMLElement {
    const num = (n: number | undefined) => toEasternNumeral(n ?? 0);
    let ornament: MarkerOrnament;
    let lines: string[];

    if (juz !== undefined) {
      el.classList.add('mushaf-juz-marker');
      el.setAttribute('data-juz', String(juz));
      el.setAttribute('aria-label', `Start of Juz ${juz}`);
      ornament = MARKER_FULL;
      lines = [`الجزء ${num(juz)}`, ...(hizb !== undefined ? [`الحزب ${num(hizb)}`] : [])];
    } else if (quarter === 0) {
      el.classList.add('mushaf-hizb-marker');
      el.setAttribute('aria-label', `Start of Hizb ${hizb}`);
      ornament = MARKER_FULL;
      lines = ['الحزب', num(hizb)];
    } else {
      el.classList.add('mushaf-rub-marker');
      el.setAttribute('aria-label', `Quarter ${quarter} of Hizb ${hizb}`);
      ornament = MARKER_HALF;
      lines = [['', 'ربع', 'نصف', 'ثلاثة أرباع'][quarter], 'الحزب', num(hizb)];
    }

    el.classList.add('mushaf-margin-marker--ornament');
    const box = document.createElement('span');
    box.className = `mushaf-marker-ornament mushaf-marker-ornament--${ornament === MARKER_HALF ? 'half' : 'full'}`;

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', ornament.viewBox);
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', ornament.path);
    svg.appendChild(path);
    box.appendChild(svg);

    const label = document.createElement('span');
    label.className = 'mushaf-marker-label';
    label.setAttribute('aria-hidden', 'true');
    const f = ornament.frame;
    label.style.left = `${f.left * 100}%`;
    label.style.top = `${f.top * 100}%`;
    label.style.width = `${f.width * 100}%`;
    label.style.height = `${f.height * 100}%`;
    for (const text of lines) {
      const line = document.createElement('span');
      line.textContent = text;
      if (text.length > 6) line.className = 'mushaf-marker-label-long';
      label.appendChild(line);
    }
    box.appendChild(label);
    el.appendChild(box);
    return el;
  }

  private groupWordsByAyah(words: Word[]): WordGroup[] {
    const groups: WordGroup[] = [];
    for (const word of words) {
      const last = groups[groups.length - 1];
      if (last && last.surah === word.surah && last.ayah === word.ayah) {
        last.words.push(word);
      } else {
        groups.push({ surah: word.surah, ayah: word.ayah, words: [word] });
      }
    }
    return groups;
  }

  destroy(): void {
    this.currentPage = null;
    this.wordIndex.clear();
  }
}

export function toEasternNumeral(n: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(n).replace(/\d/g, (d) => digits[Number(d)]);
}

export { BSML_FONT_NAME };
