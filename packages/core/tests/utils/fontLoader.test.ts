import { describe, it, expect } from 'vitest';
import { FontLoader } from '../../src/utils/fontLoader';

describe('FontLoader', () => {
  describe('getFontName', () => {
    it('returns the per-page font name', () => {
      const loader = new FontLoader('./fonts');
      expect(loader.getFontName(1)).toBe('QPC-hafs-001');
      expect(loader.getFontName(100)).toBe('QPC-hafs-100');
      expect(loader.getFontName(604)).toBe('QPC-hafs-604');
    });
  });

  describe('getFontUrl', () => {
    it('builds the per-page font URL', () => {
      const loader = new FontLoader('./fonts');
      expect(loader.getFontUrl(1)).toBe('./fonts/hafs/001.woff2');
      expect(loader.getFontUrl(604)).toBe('./fonts/hafs/604.woff2');
    });

    it('defaults to the mushaf.js CDN', () => {
      const loader = new FontLoader();
      expect(loader.getFontUrl(1)).toBe('https://cdn.mushafjs.com/fonts/hafs/001.woff2');
      expect(loader.getBaseDir()).toBe('https://cdn.mushafjs.com/fonts');
    });

    it('strips a trailing slash from fontsBaseDir', () => {
      const loader = new FontLoader('/public/fonts/');
      expect(loader.getFontUrl(1)).toBe('/public/fonts/hafs/001.woff2');
    });

    it('uses a custom base directory', () => {
      const loader = new FontLoader('/assets/qpc');
      expect(loader.getFontUrl(50)).toBe('/assets/qpc/hafs/050.woff2');
    });
  });

  describe('isLoaded', () => {
    it('returns false before any font has been loaded', () => {
      const loader = new FontLoader('./fonts');
      expect(loader.isLoaded(1)).toBe(false);
      expect(loader.isLoaded(100)).toBe(false);
    });
  });

  describe('preloadPageFont', () => {
    it('does not throw for out-of-range page 0', () => {
      const loader = new FontLoader('./fonts');
      expect(() => loader.preloadPageFont(0)).not.toThrow();
    });

    it('does not throw for out-of-range page 605', () => {
      const loader = new FontLoader('./fonts');
      expect(() => loader.preloadPageFont(605)).not.toThrow();
    });
  });
});
