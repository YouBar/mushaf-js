import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Loader } from '../../src/core/Loader';
import type { PageData, PageIndex, Metadata } from '../../src/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function makePageData(page: number): PageData {
  return {
    page,
    is_centered: false,
    juz: 1,
    lines: [
      {
        line: 1,
        type: 'ayah',
        words: [
          { location: `1:1:1`, surah: 1, ayah: 1, word: 1, qpc: 'ﱁ' },
        ],
      },
    ],
  };
}

function mockFetch(responses: Record<string, unknown>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const key = Object.keys(responses).find((k) => url.endsWith(k));
      if (!key) {
        return { ok: false, statusText: 'Not Found' } as Response;
      }
      return {
        ok: true,
        json: async () => responses[key],
      } as Response;
    })
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Loader', () => {
  let loader: Loader;

  beforeEach(() => {
    loader = new Loader({ dataBaseUrl: './data/output' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── loadPage ─────────────────────────────────────────────────────────────

  describe('loadPage', () => {
    it('throws for page 0 (below range)', async () => {
      await expect(loader.loadPage(0)).rejects.toThrow();
    });

    it('throws for page 605 (above range)', async () => {
      await expect(loader.loadPage(605)).rejects.toThrow();
    });

    it('fetches the correct URL for page 1', async () => {
      mockFetch({ '/001.json': makePageData(1) });
      await loader.loadPage(1);
      const fetchMock = vi.mocked(fetch);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][0]).toMatch(/\/001\.json$/);
    });

    it('defaults to the mushaf.js CDN', async () => {
      mockFetch({ '/001.json': makePageData(1) });
      await new Loader({}).loadPage(1);
      expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://cdn.mushafjs.com/pages/001.json');
    });

    it('fetches the correct URL for page 100', async () => {
      mockFetch({ '/100.json': makePageData(100) });
      await loader.loadPage(100);
      expect(vi.mocked(fetch).mock.calls[0][0]).toMatch(/100\.json$/);
    });

    it('returns the parsed page data', async () => {
      mockFetch({ '/001.json': makePageData(1) });
      const data = await loader.loadPage(1);
      expect(data.page).toBe(1);
      expect(data.lines).toHaveLength(1);
    });

    it('uses the LRU cache on a second call (fetch called only once)', async () => {
      mockFetch({ '/001.json': makePageData(1) });
      await loader.loadPage(1);
      await loader.loadPage(1);
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    });

    it('throws a descriptive error when fetch fails', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, statusText: 'Not Found' })));
      await expect(loader.loadPage(1)).rejects.toThrow('Failed to load page 1');
    });
  });

  // ── loadPageIndex ─────────────────────────────────────────────────────────

  describe('loadPageIndex', () => {
    it('loads and returns the page index', async () => {
      const index: PageIndex = { '1:1': 1, '2:255': 42 };
      mockFetch({ 'page-index.json': index });
      const result = await loader.loadPageIndex();
      expect(result['1:1']).toBe(1);
      expect(result['2:255']).toBe(42);
    });

    it('uses the cached index on a second call', async () => {
      const index: PageIndex = { '1:1': 1 };
      mockFetch({ 'page-index.json': index });
      await loader.loadPageIndex();
      await loader.loadPageIndex();
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    });

    it('throws a clear message when page-index.json is not found', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, statusText: 'Not Found' })));
      await expect(loader.loadPageIndex()).rejects.toThrow(/page index not found/i);
    });
  });

  // ── findPageForAyah ───────────────────────────────────────────────────────

  describe('findPageForAyah', () => {
    it('returns the correct page for a known ayah', async () => {
      const index: PageIndex = { '2:255': 42 };
      mockFetch({ 'page-index.json': index });
      const page = await loader.findPageForAyah(2, 255);
      expect(page).toBe(42);
    });

    it('throws when the ayah is not in the index', async () => {
      const index: PageIndex = {};
      mockFetch({ 'page-index.json': index });
      await expect(loader.findPageForAyah(99, 99)).rejects.toThrow();
    });
  });

  // ── findPageForSurah ──────────────────────────────────────────────────────

  describe('findPageForSurah', () => {
    it('returns the start page for a known surah', async () => {
      const metadata: Metadata = {
        surahs: [
          {
            number: 1,
            name_arabic: 'الفاتحة',
            name_simple: 'Al-Fatihah',
            revelation_place: 'makkah',
            verses_count: 7,
            start_page: 1,
          },
          {
            number: 2,
            name_arabic: 'البقرة',
            name_simple: 'Al-Baqarah',
            revelation_place: 'madinah',
            verses_count: 286,
            start_page: 2,
          },
        ],
      };
      mockFetch({ 'metadata.json': metadata });
      expect(await loader.findPageForSurah(1)).toBe(1);
      expect(await loader.findPageForSurah(2)).toBe(2);
    });

    it('throws when the surah is not found', async () => {
      const metadata: Metadata = { surahs: [] };
      mockFetch({ 'metadata.json': metadata });
      await expect(loader.findPageForSurah(999)).rejects.toThrow();
    });
  });
});
