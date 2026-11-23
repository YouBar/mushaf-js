import { padPageNum } from './helpers';
import { DEFAULT_FONTS_BASE_DIR } from '../defaults';

/**
 * QPC V2 per-page fonts (`hafs/NNN.woff2`) plus QCF_BSML. Every page font maps the same
 * code points to different glyphs, so each page gets its own font-family.
 */

/** CSS font-family name used for the basmala / title font. */
export const BSML_FONT_NAME = 'QCF-BSML';

export class FontLoader {
  private baseDir: string;
  private bsmlUrl: string;
  private loaded = new Set<string>();
  private failed = new Set<string>();
  private loading = new Map<string, Promise<boolean>>();

  constructor(baseDir?: string, bsmlUrl?: string) {
    this.baseDir = (baseDir ?? DEFAULT_FONTS_BASE_DIR).replace(/\/$/, '');
    this.bsmlUrl = bsmlUrl ?? `${this.baseDir}/QCF_BSML.woff2`;
  }

  /** CSS font-family name for a given page, e.g. "QPC-hafs-001" */
  getFontName(pageNumber: number): string {
    return `QPC-hafs-${padPageNum(pageNumber)}`;
  }

  /** Path to the font file for a given page, e.g. "./fonts/hafs/001.woff2" */
  getFontUrl(pageNumber: number): string {
    return `${this.baseDir}/hafs/${padPageNum(pageNumber)}.woff2`;
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  isLoaded(pageNumber: number): boolean {
    return this.loaded.has(this.getFontName(pageNumber));
  }

  /** Resolves false when the font could not be loaded (callers fall back to Unicode text). */
  loadPageFont(pageNumber: number): Promise<boolean> {
    return this.load(this.getFontName(pageNumber), this.getFontUrl(pageNumber));
  }

  /** Load the basmala / surah-title / juz-title calligraphy font. */
  loadBsmlFont(): Promise<boolean> {
    return this.load(BSML_FONT_NAME, this.bsmlUrl);
  }

  isBsmlLoaded(): boolean {
    return this.loaded.has(BSML_FONT_NAME);
  }

  private load(fontName: string, url: string): Promise<boolean> {
    if (this.loaded.has(fontName)) return Promise.resolve(true);
    if (this.failed.has(fontName)) return Promise.resolve(false);

    const pending = this.loading.get(fontName);
    if (pending) return pending;

    const promise = this.doLoad(fontName, url).finally(() => {
      this.loading.delete(fontName);
    });
    this.loading.set(fontName, promise);
    return promise;
  }

  private async doLoad(fontName: string, url: string): Promise<boolean> {
    // Non-browser environments (SSR, tests): nothing to load.
    if (typeof FontFace === 'undefined' || typeof document === 'undefined') {
      this.loaded.add(fontName);
      return true;
    }

    const face = new FontFace(fontName, `url(${url}) format('woff2')`, { display: 'block' });

    try {
      await face.load();
      (document.fonts as unknown as { add(f: FontFace): void }).add(face);
      this.loaded.add(fontName);
      return true;
    } catch {
      this.failed.add(fontName);
      return false;
    }
  }

  /** Fire-and-forget preload for adjacent pages. */
  preloadPageFont(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > 604) return;
    this.loadPageFont(pageNumber).catch(() => undefined);
  }
}
