import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Renderer } from '../../src/core/Renderer';
import { FontLoader } from '../../src/utils/fontLoader';
import type { PageData } from '../../src/types';

// ── Stub FontLoader so no real font loading occurs ─────────────────────────

function makeStubFontLoader(): FontLoader {
  const loader = new FontLoader('./fonts');
  vi.spyOn(loader, 'loadPageFont').mockResolvedValue(undefined);
  vi.spyOn(loader, 'getFontName').mockReturnValue('QPC-hafs-stub');
  vi.spyOn(loader, 'getFontUrl').mockReturnValue('./fonts/hafs/stub.woff2');
  return loader;
}

// ── PageData factories ─────────────────────────────────────────────────────

function makeAyahPage(page = 3): PageData {
  return {
    page,
    is_centered: false,
    juz: 1,
    lines: [
      {
        line: 1,
        type: 'ayah',
        words: [
          { location: '2:1:1', surah: 2, ayah: 1, word: 1, qpc: 'ﱁ' },
          { location: '2:1:2', surah: 2, ayah: 1, word: 2, qpc: 'ﱂ' },
          { location: '2:1:3', surah: 2, ayah: 1, word: 3, qpc: 'ﱃ', is_end_marker: true },
        ],
      },
    ],
  };
}

function makeMixedPage(): PageData {
  return {
    page: 2,
    is_centered: false,
    juz: 1,
    lines: [
      {
        line: 1,
        type: 'surah_name',
        surah: 2,
        name_arabic: 'البقرة',
        name_simple: 'Al-Baqarah',
        revelation_place: 'madinah',
        verses_count: 286,
      },
      { line: 2, type: 'basmala' },
      {
        line: 3,
        type: 'ayah',
        juz_start: 1,
        words: [
          { location: '2:1:1', surah: 2, ayah: 1, word: 1, qpc: 'ﱁ' },
        ],
      },
    ],
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Renderer', () => {
  let container: HTMLElement;
  let fontLoader: FontLoader;
  let renderer: Renderer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    fontLoader = makeStubFontLoader();
    renderer = new Renderer(container, fontLoader);
  });

  afterEach(() => {
    renderer.destroy();
    document.body.removeChild(container);
  });

  // ── Page element ──────────────────────────────────────────────────────────

  describe('page element', () => {
    it('creates a .mushaf-page element', async () => {
      await renderer.renderPage(makeAyahPage(3));
      expect(container.querySelector('.mushaf-page')).not.toBeNull();
    });

    it('sets data-page to the page number', async () => {
      await renderer.renderPage(makeAyahPage(42));
      const page = container.querySelector<HTMLElement>('.mushaf-page')!;
      expect(page.getAttribute('data-page')).toBe('42');
    });

    it('sets data-juz on the page', async () => {
      await renderer.renderPage(makeAyahPage(3));
      const page = container.querySelector<HTMLElement>('.mushaf-page')!;
      expect(page.getAttribute('data-juz')).toBe('1');
    });

    it('adds mushaf-page--centered when is_centered is true', async () => {
      const data: PageData = { ...makeAyahPage(1), is_centered: true };
      await renderer.renderPage(data);
      expect(container.querySelector('.mushaf-page--centered')).not.toBeNull();
    });

    it('does not add mushaf-page--centered when is_centered is false', async () => {
      await renderer.renderPage(makeAyahPage(3));
      expect(container.querySelector('.mushaf-page--centered')).toBeNull();
    });

    it('renders the page number as visible text', async () => {
      await renderer.renderPage(makeAyahPage(99));
      const numEl = container.querySelector('.mushaf-page-number');
      expect(numEl?.textContent).toBe('٩٩');
      expect(numEl?.getAttribute('aria-label')).toBe('Page 99');
    });

    it('replaces the previous page on a second renderPage call', async () => {
      await renderer.renderPage(makeAyahPage(3));
      await renderer.renderPage(makeAyahPage(4));
      const pages = container.querySelectorAll('.mushaf-page');
      expect(pages).toHaveLength(1);
      expect(pages[0].getAttribute('data-page')).toBe('4');
    });
  });

  // ── surah_name line ───────────────────────────────────────────────────────

  describe('surah_name line', () => {
    it('renders a .mushaf-line--surah_name', async () => {
      await renderer.renderPage(makeMixedPage());
      expect(container.querySelector('.mushaf-line--surah_name')).not.toBeNull();
    });

    it('contains a .mushaf-surah-name element', async () => {
      await renderer.renderPage(makeMixedPage());
      const nameEl = container.querySelector('.mushaf-surah-name');
      expect(nameEl).not.toBeNull();
      // Calligraphic title glyph from QCF_BSML: U+F100 + (surah − 1)
      expect(nameEl?.textContent).toBe('\uF101');
      expect(nameEl?.getAttribute('data-surah')).toBe('2');
    });

    it('sets aria-label to the simple name', async () => {
      await renderer.renderPage(makeMixedPage());
      const nameEl = container.querySelector('.mushaf-surah-name');
      expect(nameEl?.getAttribute('aria-label')).toBe('Al-Baqarah');
    });
  });

  // ── basmala line ──────────────────────────────────────────────────────────

  describe('basmala line', () => {
    it('renders a .mushaf-line--basmala', async () => {
      await renderer.renderPage(makeMixedPage());
      expect(container.querySelector('.mushaf-line--basmala')).not.toBeNull();
    });

    it('contains a .mushaf-basmala-text element', async () => {
      await renderer.renderPage(makeMixedPage());
      expect(container.querySelector('.mushaf-basmala-text')).not.toBeNull();
    });
  });

  // ── ayah line ─────────────────────────────────────────────────────────────

  describe('ayah line', () => {
    it('renders a .mushaf-line--ayah', async () => {
      await renderer.renderPage(makeAyahPage());
      expect(container.querySelector('.mushaf-line--ayah')).not.toBeNull();
    });

    it('renders regular words with class mushaf-word', async () => {
      await renderer.renderPage(makeAyahPage());
      const words = container.querySelectorAll('.mushaf-word');
      expect(words).toHaveLength(2); // word 1 and 2; word 3 is end marker
    });

    it('sets data-surah, data-ayah, data-word on each word', async () => {
      await renderer.renderPage(makeAyahPage());
      const word = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="2"][data-ayah="1"][data-word="1"]'
      );
      expect(word).not.toBeNull();
    });

    it('renders the end-marker word as .mushaf-ayah-marker', async () => {
      await renderer.renderPage(makeAyahPage());
      const marker = container.querySelector('.mushaf-ayah-marker');
      expect(marker).not.toBeNull();
      // The end marker word should NOT also have class mushaf-word
      expect(marker?.classList.contains('mushaf-word')).toBe(false);
    });

    it('sets data-surah and data-ayah on the ayah marker', async () => {
      await renderer.renderPage(makeAyahPage());
      const marker = container.querySelector<HTMLElement>('.mushaf-ayah-marker')!;
      expect(marker.getAttribute('data-surah')).toBe('2');
      expect(marker.getAttribute('data-ayah')).toBe('1');
    });

    it('wraps words in .mushaf-ayah spans grouped by ayah', async () => {
      await renderer.renderPage(makeAyahPage());
      expect(container.querySelector('.mushaf-ayah')).not.toBeNull();
    });
  });

  // ── margin markers ────────────────────────────────────────────────────────

  describe('margin markers', () => {
    it('renders a .mushaf-juz-marker when juz_start is set on a line', async () => {
      await renderer.renderPage(makeMixedPage());
      const marker = container.querySelector('.mushaf-juz-marker');
      expect(marker).not.toBeNull();
      expect(marker?.getAttribute('data-juz')).toBe('1');
    });

    it('renders a .mushaf-hizb-marker when hizb_start is set', async () => {
      const data: PageData = {
        page: 5,
        is_centered: false,
        juz: 1,
        lines: [
          {
            line: 1,
            type: 'ayah',
            hizb_start: 3,
            words: [{ location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: 'ﱁ' }],
          },
        ],
      };
      await renderer.renderPage(data);
      const marker = container.querySelector('.mushaf-hizb-marker');
      expect(marker).not.toBeNull();
      expect(marker?.getAttribute('data-hizb')).toBe('3');
    });
  });

  describe('per-line alignment and margin labels', () => {
    it('marks lines flagged centered in the data', async () => {
      const data = makeAyahPage(604);
      data.lines[0].centered = true;
      await renderer.renderPage(data);
      expect(container.querySelector('.mushaf-line--centered')).not.toBeNull();
    });

    it('does not centre justified lines', async () => {
      await renderer.renderPage(makeAyahPage(3));
      expect(container.querySelector('.mushaf-line--centered')).toBeNull();
    });

    it('puts quarter labels in the arched mushaf ornament (full text as tooltip)', async () => {
      const data = makeAyahPage(5);
      data.lines[0].rub_start = 3;
      await renderer.renderPage(data);
      const m = container.querySelector('.mushaf-rub-marker')!;
      expect(m.classList.contains('mushaf-margin-marker--ornament')).toBe(true);
      expect(m.querySelector('.mushaf-marker-ornament--half svg path')).not.toBeNull();
      expect([...m.querySelectorAll('.mushaf-marker-label > span')].map(e => e.textContent))
        .toEqual(['نصف', 'الحزب', '١']);
      expect(m.getAttribute('title')).toBe('نصف الحزب ١');
      expect(m.getAttribute('data-hizb')).toBe('1');
    });

    it('puts hizb and juz starts in the symmetric ornament', async () => {
      const hizbPage = makeAyahPage(5);
      hizbPage.lines[0].hizb_start = 60;
      await renderer.renderPage(hizbPage);
      const hizb = container.querySelector('.mushaf-hizb-marker')!;
      expect(hizb.querySelector('.mushaf-marker-ornament--full')).not.toBeNull();
      expect([...hizb.querySelectorAll('.mushaf-marker-label > span')].map(e => e.textContent))
        .toEqual(['الحزب', '٦٠']);

      const juzPage = makeAyahPage(7);
      juzPage.lines[0].juz_start = 30;
      juzPage.lines[0].hizb_start = 59;
      await renderer.renderPage(juzPage);
      const juz = container.querySelector('.mushaf-juz-marker')!;
      expect(juz.querySelector('.mushaf-marker-ornament--full')).not.toBeNull();
      expect([...juz.querySelectorAll('.mushaf-marker-label > span')].map(e => e.textContent))
        .toEqual(['الجزء ٣٠', 'الحزب ٥٩']);
      expect(juz.getAttribute('title')).toBe('الجزء ٣٠');
    });

    it("keeps the printed text labels with marginMarkerStyle: 'text'", async () => {
      renderer = new Renderer(container, fontLoader, { marginMarkerStyle: 'text' });
      const data = makeAyahPage(5);
      data.lines[0].rub_start = 2;
      await renderer.renderPage(data);
      const m = container.querySelector('.mushaf-rub-marker')!;
      expect(m.textContent).toBe('ربع الحزب ١');
      expect(m.getAttribute('data-hizb')).toBe('1');
    });

    it('puts margin labels on the outer side (odd → right page)', async () => {
      await renderer.renderPage(makeAyahPage(5));
      expect(container.querySelector('.mushaf-page--right')).not.toBeNull();
      await renderer.renderPage(makeAyahPage(6));
      expect(container.querySelector('.mushaf-page--left')).not.toBeNull();
    });

    it('renders Unicode text when the page font fails to load', async () => {
      vi.mocked(fontLoader.loadPageFont).mockResolvedValue(false);
      const data = makeAyahPage(3);
      data.lines[0].words![0].text = 'بِسۡمِ';
      await renderer.renderPage(data);
      expect(container.querySelector('.mushaf-page--fallback')).not.toBeNull();
      expect(container.querySelector('.mushaf-word')!.textContent).toBe('بِسۡمِ');
    });

    it('exposes the full word record for rendered words', async () => {
      const data = makeAyahPage(3);
      data.lines[0].words![0].text = 'بِسۡمِ';
      await renderer.renderPage(data);
      expect(renderer.getWord(2, 1, 1)?.text).toBe('بِسۡمِ');
    });
  });
});
