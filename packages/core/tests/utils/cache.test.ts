import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from '../../src/utils/cache';

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3);
  });

  describe('get / set', () => {
    it('returns null for a missing key', () => {
      expect(cache.get('missing')).toBeNull();
    });

    it('returns the stored value', () => {
      cache.set('a', 'apple');
      expect(cache.get('a')).toBe('apple');
    });

    it('updates an existing key without growing the cache', () => {
      cache.set('a', 'apple');
      cache.set('a', 'avocado');
      expect(cache.get('a')).toBe('avocado');
      expect(cache.size).toBe(1);
    });
  });

  describe('has', () => {
    it('returns false for a missing key', () => {
      expect(cache.has('x')).toBe(false);
    });

    it('returns true for an inserted key', () => {
      cache.set('x', 'xray');
      expect(cache.has('x')).toBe(true);
    });
  });

  describe('delete', () => {
    it('removes an existing key', () => {
      cache.set('a', 'apple');
      cache.delete('a');
      expect(cache.has('a')).toBe(false);
      expect(cache.size).toBe(0);
    });

    it('is a no-op for a missing key', () => {
      expect(() => cache.delete('nope')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeNull();
    });
  });

  describe('size', () => {
    it('tracks the number of entries', () => {
      expect(cache.size).toBe(0);
      cache.set('a', '1');
      expect(cache.size).toBe(1);
      cache.set('b', '2');
      expect(cache.size).toBe(2);
    });
  });

  describe('capacity eviction', () => {
    it('evicts the least-recently-used entry when over capacity', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      // 'a' is the LRU — adding 'd' should evict it
      cache.set('d', '4');
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
      expect(cache.size).toBe(3);
    });

    it('respects access order — recently got item is not evicted', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      // Access 'a' to make it recently used
      cache.get('a');
      // Adding 'd' should evict 'b' (now the LRU), not 'a'
      cache.set('d', '4');
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('updating an existing key counts as a recent access', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      cache.set('a', 'updated');  // make 'a' most-recently-used
      cache.set('d', '4');         // should evict 'b'
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });
  });
});
