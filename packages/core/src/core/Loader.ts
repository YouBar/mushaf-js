import type { PageData, PageIndex, Metadata, Surah, MushafConfig } from '../types';
import { LRUCache } from '../utils/cache';
import { padPageNum, isValidPage } from '../utils/helpers';
import { DEFAULT_DATA_BASE_URL } from '../defaults';

export class Loader {
  private pageCache: LRUCache<PageData>;
  private baseUrl: string;
  private pageIndex: PageIndex | null = null;
  private metadata: Metadata | null = null;

  constructor(config: Pick<MushafConfig, 'dataBaseUrl'>) {
    this.pageCache = new LRUCache<PageData>(15);
    this.baseUrl   = (config.dataBaseUrl ?? DEFAULT_DATA_BASE_URL).replace(/\/$/, '');
  }

  async loadPage(pageNumber: number): Promise<PageData> {
    if (!isValidPage(pageNumber)) {
      throw new Error(`Invalid page number: ${pageNumber}. Must be 1–604.`);
    }

    const cacheKey = `page-${pageNumber}`;
    const cached = this.pageCache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/${padPageNum(pageNumber)}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load page ${pageNumber}: ${response.statusText}`);
    }

    const data: PageData = await response.json();
    this.pageCache.set(cacheKey, data);
    return data;
  }

  preloadPage(pageNumber: number): void {
    if (!isValidPage(pageNumber)) return;
    this.loadPage(pageNumber).catch(() => undefined);
  }

  /** "surah:ayah" → page, from page-index.json (`npm run generate-index`). */
  async loadPageIndex(): Promise<PageIndex> {
    if (this.pageIndex) return this.pageIndex;

    const url = `${this.baseUrl}/../page-index.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('not found');
      this.pageIndex = await response.json();
      return this.pageIndex!;
    } catch {
      throw new Error(
        'Page index not found. Run `npm run generate-index` after building page data.'
      );
    }
  }

  /** metadata.json, or else derived by scanning the pages for surah headers (slow). */
  async loadMetadata(): Promise<Metadata> {
    if (this.metadata) return this.metadata;

    const metaUrl = `${this.baseUrl}/../metadata.json`;
    try {
      const response = await fetch(metaUrl);
      if (response.ok) {
        this.metadata = await response.json();
        return this.metadata!;
      }
    } catch { /* fall through to derived metadata */ }

    const surahs: Surah[] = [];
    const seen = new Set<number>();

    for (let p = 1; p <= 604; p++) {
      try {
        const page = await this.loadPage(p);
        for (const line of page.lines) {
          if (
            line.type === 'surah_name' &&
            line.surah !== undefined &&
            !seen.has(line.surah)
          ) {
            seen.add(line.surah);
            surahs.push({
              number:           line.surah,
              name_arabic:      line.name_arabic ?? '',
              name_simple:      line.name_simple ?? '',
              revelation_place: line.revelation_place ?? '',
              verses_count:     line.verses_count ?? 0,
              start_page:       p,
            });
          }
        }
        if (surahs.length === 114) break;
      } catch { /* skip missing pages */ }
    }

    this.metadata = { surahs: surahs.sort((a, b) => a.number - b.number) };
    return this.metadata;
  }

  async findPageForSurah(surahNumber: number): Promise<number> {
    const metadata = await this.loadMetadata();
    const surah = metadata.surahs.find((s) => s.number === surahNumber);
    if (!surah) throw new Error(`Surah ${surahNumber} not found.`);
    return surah.start_page;
  }

  async findPageForAyah(surah: number, ayah: number): Promise<number> {
    const index = await this.loadPageIndex();
    const page  = index[`${surah}:${ayah}`];
    if (!page) throw new Error(`Ayah ${surah}:${ayah} not found in page index.`);
    return page;
  }
}
