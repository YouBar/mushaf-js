import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Mushaf } from '../../src/core/Mushaf';
import type { PageData } from '../../src/types';

function page(n: number): PageData {
  return {
    page: n,
    is_centered: false,
    juz: 1,
    lines: [
      {
        line: 1,
        type: 'ayah',
        words: [
          { location: `2:${n}:1`, surah: 2, ayah: n, word: 1, qpc: 'ﱁ', text: 'كلمة' },
          { location: `2:${n}:2`, surah: 2, ayah: n, word: 2, qpc: 'ﱂ', is_end_marker: true },
        ],
      },
    ],
  };
}

/** fetch stub whose responses resolve only when release(n) is called. */
function deferredFetch() {
  const waiting = new Map<number, () => void>();
  const fetchMock = vi.fn((url: string) => {
    const n = Number(/(\d+)\.json/.exec(url)?.[1]);
    return new Promise((resolve) => {
      waiting.set(n, () => resolve({ ok: true, json: async () => page(n) }));
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return {
    release: async (n: number) => {
      waiting.get(n)?.();
      await new Promise((r) => setTimeout(r, 0));
    },
  };
}

describe('Mushaf navigation', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  it('widens the page only when the margin ornaments are shown', () => {
    const withOrnaments = new Mushaf({ container });
    expect(container.classList.contains('mushaf-container--ornaments')).toBe(true);
    withOrnaments.destroy();
    expect(container.classList.contains('mushaf-container--ornaments')).toBe(false);

    new Mushaf({ container, showMarginMarkers: false }).destroy();
    const noMarkers = new Mushaf({ container, showMarginMarkers: false });
    expect(container.classList.contains('mushaf-container--ornaments')).toBe(false);
    noMarkers.destroy();

    const text = new Mushaf({ container, marginMarkerStyle: 'text' });
    expect(container.classList.contains('mushaf-container--ornaments')).toBe(false);
    text.destroy();
  });

  it('does nothing after destroy(), even for a render started before it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const n = Number(/(\d+)\.json/.exec(url)?.[1]);
      return { ok: true, json: async () => page(n) };
    }));
    const m = new Mushaf({ container });
    const pending = m.renderPage(5);
    m.destroy();
    await pending;
    await m.init();
    await m.renderPage(6);
    expect(container.innerHTML).toBe('');
  });

  it('accumulates rapid nextPage() calls instead of dropping them', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const n = Number(/(\d+)\.json/.exec(url)?.[1]);
      return { ok: true, json: async () => page(n) };
    }));
    const m = new Mushaf({ container });
    await m.renderPage(10);
    await Promise.all([m.nextPage(), m.nextPage(), m.nextPage()]);
    expect(m.getCurrentPage()).toBe(13);
    expect(container.querySelector('.mushaf-page')!.getAttribute('data-page')).toBe('13');
    m.destroy();
  });

  it('discards a slow, stale page load that resolves after a newer one', async () => {
    const f = deferredFetch();
    const changes: number[] = [];
    const m = new Mushaf({ container, onPageChange: (p) => changes.push(p) });
    const first = m.renderPage(50);
    const second = m.renderPage(60);
    await f.release(60);
    await f.release(50);
    await Promise.all([first, second]);
    expect(m.getCurrentPage()).toBe(60);
    expect(container.querySelector('.mushaf-page')!.getAttribute('data-page')).toBe('60');
    expect(changes).toEqual([60]);
    m.destroy();
  });

  it('keeps an ayah highlight across a page re-render', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const n = Number(/(\d+)\.json/.exec(url)?.[1]);
      return { ok: true, json: async () => page(n) };
    }));
    const m = new Mushaf({ container });
    await m.renderPage(5);
    m.highlightAyah(2, 5, { style: 'background' });
    await m.renderPage(6);
    await m.renderPage(5);
    expect(container.querySelector('[data-highlighted]')).not.toBeNull();
    m.destroy();
  });

  it('hands the full word (with Unicode text) to onWordClick', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const n = Number(/(\d+)\.json/.exec(url)?.[1]);
      return { ok: true, json: async () => page(n) };
    }));
    const onWordClick = vi.fn();
    const m = new Mushaf({ container, onWordClick });
    await m.renderPage(7);
    container.querySelector<HTMLElement>('.mushaf-word')!.click();
    expect(onWordClick.mock.calls[0][0].text).toBe('كلمة');
    m.destroy();
  });

  it('two instances do not interfere when one is destroyed', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const n = Number(/(\d+)\.json/.exec(url)?.[1]);
      return { ok: true, json: async () => page(n) };
    }));
    const other = document.createElement('div');
    document.body.appendChild(other);
    const a = new Mushaf({ container, keyboardNavigation: false });
    const b = new Mushaf({ container: other, keyboardNavigation: false });
    await a.renderPage(3);
    await b.renderPage(4);
    a.destroy();
    const pageB = other.querySelector<HTMLElement>('.mushaf-page')!;
    expect(pageB.style.getPropertyValue('--mushaf-page-font')).toContain('QPC-hafs-004');
    b.destroy();
    other.remove();
  });
});

describe('Mushaf ranges and selection', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const n = Number(/(\d+)\.json/.exec(url)?.[1]);
      return { ok: true, json: async () => page(n) };
    }));
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  it('highlights words and markers inside a word-level range only', async () => {
    const m = new Mushaf({ container, keyboardNavigation: false });
    await m.renderPage(5);
    // Range covering only the marker (word 2) of 2:5
    m.highlightRange({ surah: 2, ayah: 5, word: 2 }, { surah: 2, ayah: 5, word: 2 }, { style: 'background' });
    expect(container.querySelector('.mushaf-ayah-marker')!.hasAttribute('data-highlighted')).toBe(true);
    expect(container.querySelector('.mushaf-word')!.hasAttribute('data-highlighted')).toBe(false);
    m.destroy();
  });

  it('accepts ranges given in reverse order', async () => {
    const m = new Mushaf({ container, keyboardNavigation: false });
    await m.renderPage(5);
    m.highlightRange({ surah: 2, ayah: 6, word: 1 }, { surah: 2, ayah: 4, word: 1 }, { style: 'color' });
    expect(container.querySelectorAll('[data-highlighted]')).toHaveLength(2);
    m.destroy();
  });

  it('batches many highlights and clears them by key prefix', async () => {
    const m = new Mushaf({ container, keyboardNavigation: false });
    await m.renderPage(5);
    m.batchHighlights(() => {
      m.highlightWord(2, 5, 1, { style: 'color', color: 'red', key: 'mistake:1' });
      m.highlightRange({ surah: 2, ayah: 5, word: 2 }, { surah: 2, ayah: 5, word: 2 }, { style: 'color', color: 'red', key: 'mistake:2' });
    });
    expect(container.querySelectorAll('[data-highlighted]')).toHaveLength(2);
    m.clearHighlightsWithPrefix('mistake:');
    expect(container.querySelectorAll('[data-highlighted]')).toHaveLength(0);
    m.destroy();
  });

  it('selects a range with two taps and suppresses word clicks while selecting', async () => {
    const onWordClick = vi.fn();
    const onSelectionChange = vi.fn();
    const m = new Mushaf({ container, keyboardNavigation: false, onWordClick, onSelectionChange });
    await m.renderPage(5);
    m.startSelection();

    container.querySelector<HTMLElement>('.mushaf-ayah-marker')!.click();
    container.querySelector<HTMLElement>('.mushaf-word')!.click();

    expect(onWordClick).not.toHaveBeenCalled();
    expect(m.getSelection()).toEqual({
      start: { surah: 2, ayah: 5, word: 1 },
      end: { surah: 2, ayah: 5, word: 2 },
    });
    expect(onSelectionChange).toHaveBeenLastCalledWith(m.getSelection());
    expect(container.querySelectorAll('[data-highlighted="border"]')).toHaveLength(2);

    // A third tap starts a new selection
    container.querySelector<HTMLElement>('.mushaf-word')!.click();
    expect(m.getSelection()?.end).toBeNull();

    // Tapping the pending start again cancels it
    container.querySelector<HTMLElement>('.mushaf-word')!.click();
    expect(m.getSelection()).toBeNull();

    m.cancelSelection();
    expect(m.getSelection()).toBeNull();
    expect(container.querySelector('[data-highlighted]')).toBeNull();
    container.querySelector<HTMLElement>('.mushaf-word')!.click();
    expect(onWordClick).toHaveBeenCalledOnce();
    m.destroy();
  });
});
