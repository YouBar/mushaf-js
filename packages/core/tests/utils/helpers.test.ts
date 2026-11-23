import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { padPageNum, parseIntAttr, clamp, debounce, isValidPage } from '../../src/utils/helpers';
import { parseLocation } from '../../src/types/Word';

describe('padPageNum', () => {
  it('pads single-digit numbers to 3 digits', () => {
    expect(padPageNum(1)).toBe('001');
    expect(padPageNum(9)).toBe('009');
  });

  it('pads two-digit numbers', () => {
    expect(padPageNum(10)).toBe('010');
    expect(padPageNum(99)).toBe('099');
  });

  it('does not pad 3-digit numbers', () => {
    expect(padPageNum(100)).toBe('100');
    expect(padPageNum(604)).toBe('604');
  });
});

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 1, 10)).toBe(5);
  });

  it('returns min when value is below range', () => {
    expect(clamp(-5, 1, 10)).toBe(1);
    expect(clamp(0, 1, 10)).toBe(1);
  });

  it('returns max when value is above range', () => {
    expect(clamp(15, 1, 10)).toBe(10);
  });

  it('handles boundary values', () => {
    expect(clamp(1, 1, 10)).toBe(1);
    expect(clamp(10, 1, 10)).toBe(10);
  });
});

describe('isValidPage', () => {
  it('accepts the first and last valid pages', () => {
    expect(isValidPage(1)).toBe(true);
    expect(isValidPage(604)).toBe(true);
  });

  it('accepts mid-range values', () => {
    expect(isValidPage(302)).toBe(true);
  });

  it('rejects 0', () => {
    expect(isValidPage(0)).toBe(false);
  });

  it('rejects 605', () => {
    expect(isValidPage(605)).toBe(false);
  });

  it('rejects non-integer values', () => {
    expect(isValidPage(1.5)).toBe(false);
    expect(isValidPage(NaN)).toBe(false);
  });

  it('rejects negative numbers', () => {
    expect(isValidPage(-1)).toBe(false);
  });
});

describe('parseIntAttr', () => {
  it('reads a numeric attribute from an element', () => {
    const el = document.createElement('span');
    el.setAttribute('data-surah', '2');
    expect(parseIntAttr(el, 'data-surah')).toBe(2);
  });

  it('returns 0 when the attribute is missing', () => {
    const el = document.createElement('span');
    expect(parseIntAttr(el, 'data-missing')).toBe(0);
  });

  it('returns 0 when the attribute is not a number', () => {
    const el = document.createElement('span');
    el.setAttribute('data-bad', 'hello');
    expect(parseIntAttr(el, 'data-bad')).toBe(0);
  });
});

describe('debounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('fires the function after the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancels a previous call when invoked again within the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced();
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments through', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced('hello', 42);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });
});

describe('parseLocation', () => {
  it('parses a well-formed location string', () => {
    expect(parseLocation('2:255:3')).toEqual({ surah: 2, ayah: 255, word: 3 });
  });

  it('parses the first word of Al-Fatihah', () => {
    expect(parseLocation('1:1:1')).toEqual({ surah: 1, ayah: 1, word: 1 });
  });

  it('returns 0 for missing parts', () => {
    const result = parseLocation('1');
    expect(result.surah).toBe(1);
    expect(result.ayah).toBe(0);
    expect(result.word).toBe(0);
  });
});
