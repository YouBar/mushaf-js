import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventHandler } from '../../src/core/EventHandler';
import type { MushafConfig } from '../../src/types';

// ── DOM helpers ────────────────────────────────────────────────────────────

function makeWord(surah: number, ayah: number, word: number, qpc = 'ﱁ'): HTMLElement {
  const el = document.createElement('span');
  el.className = 'mushaf-word';
  el.setAttribute('data-surah', String(surah));
  el.setAttribute('data-ayah', String(ayah));
  el.setAttribute('data-word', String(word));
  el.textContent = qpc;
  return el;
}

function makeAyahMarker(surah: number, ayah: number): HTMLElement {
  const el = document.createElement('span');
  el.className = 'mushaf-ayah-marker';
  el.setAttribute('data-surah', String(surah));
  el.setAttribute('data-ayah', String(ayah));
  el.textContent = '۝';
  return el;
}

function makeSurahName(surahNum: number, arabic: string, simple: string): HTMLElement {
  const outer = document.createElement('div');
  outer.setAttribute('data-surah', String(surahNum));
  const inner = document.createElement('span');
  inner.className = 'mushaf-surah-name';
  inner.textContent = arabic;
  inner.setAttribute('aria-label', simple);
  outer.appendChild(inner);
  return inner; // the click target
}

function makeJuzMarker(juz: number, page: number, line: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'mushaf-juz-marker';
  el.setAttribute('data-juz', String(juz));
  el.setAttribute('data-page', String(page));
  el.setAttribute('data-line', String(line));
  return el;
}

function makeContainer(): { container: HTMLElement; elements: ReturnType<typeof gatherElements> } {
  const container = document.createElement('div');
  container.tabIndex = 0;

  const ayahGroup = document.createElement('span');
  ayahGroup.className = 'mushaf-ayah';
  ayahGroup.setAttribute('data-surah', '2');
  ayahGroup.setAttribute('data-ayah', '255');

  const w1 = makeWord(2, 255, 1, 'ﱁ');
  const w2 = makeWord(2, 255, 2, 'ﱂ');
  const marker = makeAyahMarker(2, 255);
  ayahGroup.appendChild(w1);
  ayahGroup.appendChild(w2);
  ayahGroup.appendChild(marker);

  const surahNameOuter = document.createElement('div');
  surahNameOuter.setAttribute('data-surah', '3');
  const surahName = document.createElement('span');
  surahName.className = 'mushaf-surah-name';
  surahName.textContent = 'آل عمران';
  surahName.setAttribute('aria-label', 'Aal-e-Imran');
  surahNameOuter.appendChild(surahName);

  const juzMarker = makeJuzMarker(3, 40, 1);

  container.appendChild(ayahGroup);
  container.appendChild(surahNameOuter);
  container.appendChild(juzMarker);

  document.body.appendChild(container);
  return { container, elements: { w1, w2, marker, surahName, juzMarker } };
}

function gatherElements() {
  return {} as { w1: HTMLElement; w2: HTMLElement; marker: HTMLElement; surahName: HTMLElement; juzMarker: HTMLElement };
}

function fireClick(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function fireMouseOver(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
}

function fireMouseOut(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
}

function fireKey(key: string, target: EventTarget = document): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function fireTouch(container: HTMLElement, startX: number, endX: number, startY = 0, endY = 0): void {
  const makeTouch = (x: number, y: number) =>
    ({ clientX: x, clientY: y } as Touch);

  container.dispatchEvent(
    new TouchEvent('touchstart', {
      bubbles: true,
      changedTouches: [makeTouch(startX, startY)] as unknown as TouchList,
    })
  );
  container.dispatchEvent(
    new TouchEvent('touchend', {
      bubbles: true,
      changedTouches: [makeTouch(endX, endY)] as unknown as TouchList,
    })
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('EventHandler', () => {
  let container: HTMLElement;
  let w1: HTMLElement;
  let w2: HTMLElement;
  let marker: HTMLElement;
  let surahName: HTMLElement;
  let juzMarker: HTMLElement;
  let handler: EventHandler;
  let config: Required<Pick<MushafConfig, 'onWordClick' | 'onAyahClick' | 'onSurahClick' | 'onJuzClick' | 'onSwipe' | 'onKeyNav'>> & MushafConfig;

  beforeEach(() => {
    const built = makeContainer();
    container = built.container;
    ({ w1, w2, marker, surahName, juzMarker } = built.elements);

    config = {
      dataBaseUrl: './data',
      onWordClick: vi.fn(),
      onAyahClick: vi.fn(),
      onSurahClick: vi.fn(),
      onJuzClick: vi.fn(),
      onSwipe: vi.fn(),
      onKeyNav: vi.fn(),
    };

    handler = new EventHandler(container, config);
  });

  afterEach(() => {
    handler.detach();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // ── Click ─────────────────────────────────────────────────────────────────

  describe('word click', () => {
    it('calls onWordClick with the correct word data', () => {
      fireClick(w1);
      expect(config.onWordClick).toHaveBeenCalledOnce();
      const word = vi.mocked(config.onWordClick).mock.calls[0][0];
      expect(word.surah).toBe(2);
      expect(word.ayah).toBe(255);
      expect(word.word).toBe(1);
      expect(word.qpc).toBe('ﱁ');
    });

    it('does not call onAyahClick when a regular word is clicked', () => {
      fireClick(w1);
      expect(config.onAyahClick).not.toHaveBeenCalled();
    });
  });

  describe('ayah marker click', () => {
    it('calls onAyahClick with correct surah and ayah', () => {
      fireClick(marker);
      expect(config.onAyahClick).toHaveBeenCalledOnce();
      const info = vi.mocked(config.onAyahClick).mock.calls[0][0];
      expect(info.surah).toBe(2);
      expect(info.ayah).toBe(255);
    });

    it('does not call onWordClick when the marker is clicked', () => {
      fireClick(marker);
      expect(config.onWordClick).not.toHaveBeenCalled();
    });

    it('returns the words of the ayah from every line, not just the marker line', () => {
      // A previous line carrying the start of the same ayah
      const prevLine = document.createElement('span');
      prevLine.className = 'mushaf-ayah';
      prevLine.setAttribute('data-surah', '2');
      prevLine.setAttribute('data-ayah', '255');
      prevLine.appendChild(makeWord(2, 255, 0, 'ﱀ'));
      container.insertBefore(prevLine, container.firstChild);

      fireClick(marker);
      const info = vi.mocked(config.onAyahClick).mock.calls[0][0];
      expect(info.words.map((w) => w.word)).toEqual([0, 1, 2]);
    });
  });

  describe('surah name click', () => {
    it('calls onSurahClick with the surah number', () => {
      fireClick(surahName);
      expect(config.onSurahClick).toHaveBeenCalledOnce();
      const info = vi.mocked(config.onSurahClick).mock.calls[0][0];
      expect(info.number).toBe(3);
      expect(info.name_arabic).toBe('آل عمران');
      expect(info.name_simple).toBe('Aal-e-Imran');
    });
  });

  describe('juz marker click', () => {
    it('calls onJuzClick with the juz data', () => {
      fireClick(juzMarker);
      expect(config.onJuzClick).toHaveBeenCalledOnce();
      const info = vi.mocked(config.onJuzClick).mock.calls[0][0];
      expect(info.juz).toBe(3);
      expect(info.page).toBe(40);
      expect(info.line).toBe(1);
    });
  });

  // ── Hover ─────────────────────────────────────────────────────────────────

  describe('hover effects', () => {
    it('adds mushaf-word--hover on mouseover a word', () => {
      fireMouseOver(w1);
      expect(w1.classList.contains('mushaf-word--hover')).toBe(true);
    });

    it('removes mushaf-word--hover on mouseout', () => {
      fireMouseOver(w1);
      fireMouseOut(w1);
      expect(w1.classList.contains('mushaf-word--hover')).toBe(false);
    });

    it('does not add hover class to non-word elements', () => {
      fireMouseOver(container);
      expect(container.classList.contains('mushaf-word--hover')).toBe(false);
    });
  });

  // ── Keyboard navigation ───────────────────────────────────────────────────

  describe('keyboard navigation', () => {
    it('calls onKeyNav("next") on ArrowLeft', () => {
      fireKey('ArrowLeft');
      expect(config.onKeyNav).toHaveBeenCalledWith('next');
    });

    it('calls onKeyNav("prev") on ArrowRight', () => {
      fireKey('ArrowRight');
      expect(config.onKeyNav).toHaveBeenCalledWith('prev');
    });

    it('does not call onKeyNav for other keys', () => {
      fireKey('ArrowUp');
      fireKey('Enter');
      fireKey('Space');
      expect(config.onKeyNav).not.toHaveBeenCalled();
    });

    it('ignores keydown when an <input> element is focused', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      fireKey('ArrowLeft', document);
      expect(config.onKeyNav).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });
  });

  // ── Touch / swipe ─────────────────────────────────────────────────────────

  describe('touch swipe', () => {
    it('calls onSwipe("next") on left swipe (dx = -80)', () => {
      fireTouch(container, 200, 120); // dx = -80
      expect(config.onSwipe).toHaveBeenCalledWith('next');
    });

    it('calls onSwipe("prev") on right swipe (dx = +80)', () => {
      fireTouch(container, 100, 180); // dx = +80
      expect(config.onSwipe).toHaveBeenCalledWith('prev');
    });

    it('does not fire for small horizontal movement (< 50px)', () => {
      fireTouch(container, 100, 130); // dx = +30
      expect(config.onSwipe).not.toHaveBeenCalled();
    });

    it('does not fire when vertical movement dominates', () => {
      // dx = -60, dy = -120 → vertical dominates
      fireTouch(container, 200, 140, 0, -120);
      expect(config.onSwipe).not.toHaveBeenCalled();
    });
  });

  // ── detach ────────────────────────────────────────────────────────────────

  describe('detach', () => {
    it('prevents click events from firing after detach', () => {
      handler.detach();
      fireClick(w1);
      expect(config.onWordClick).not.toHaveBeenCalled();
    });

    it('prevents keyboard events from firing after detach', () => {
      handler.detach();
      fireKey('ArrowLeft');
      expect(config.onKeyNav).not.toHaveBeenCalled();
    });

    it('prevents swipe events from firing after detach', () => {
      handler.detach();
      fireTouch(container, 200, 100);
      expect(config.onSwipe).not.toHaveBeenCalled();
    });
  });
});
