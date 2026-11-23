import { describe, it, expect, vi } from 'vitest';
import { InkMeter, containsPoint } from '../../src/utils/ink';
import { EventHandler } from '../../src/core/EventHandler';
import type { MushafConfig } from '../../src/types';

function word(n: number): HTMLElement {
  const el = document.createElement('span');
  el.className = 'mushaf-word';
  el.setAttribute('data-surah', '1');
  el.setAttribute('data-ayah', '1');
  el.setAttribute('data-word', String(n));
  el.textContent = 'ﱁ';
  return el;
}

describe('InkMeter', () => {
  it('falls back to the element box when canvas metrics are unavailable', () => {
    const el = word(1);
    document.body.appendChild(el);
    const box = new InkMeter().inkBox(el);
    expect(box).toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
    expect(new InkMeter().hasInkAt(el, 0, 0)).toBeNull();
    el.remove();
  });

  it('containsPoint is inclusive of the edges', () => {
    const b = { left: 0, right: 10, top: 0, bottom: 10 };
    expect(containsPoint(b, 10, 10)).toBe(true);
    expect(containsPoint(b, 11, 5)).toBe(false);
  });
});

describe('EventHandler ink hit-testing', () => {
  function setup(inkOwner: number | null) {
    const container = document.createElement('div');
    const line = document.createElement('div');
    line.className = 'mushaf-line mushaf-line--ayah';
    const w1 = word(1);
    const w2 = word(2);
    line.append(w1, w2);
    container.appendChild(line);
    document.body.appendChild(container);

    const ink = new InkMeter();
    // Both glyphs' ink boxes cover the click point; only `inkOwner` has ink there.
    vi.spyOn(ink, 'inkBox').mockReturnValue({ left: 0, right: 100, top: 0, bottom: 100 });
    vi.spyOn(ink, 'hasInkAt').mockImplementation((el) =>
      inkOwner === null ? false : el.getAttribute('data-word') === String(inkOwner)
    );

    const config: MushafConfig = { container, onWordClick: vi.fn() };
    const handler = new EventHandler(container, config, null, ink);
    return { container, w1, w2, config, handler };
  }

  const clickAt = (el: HTMLElement) =>
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 50, clientY: 50 }));

  it('selects the neighbouring word whose overhanging ink is under the pointer', () => {
    const { container, w2, config, handler } = setup(1);
    clickAt(w2); // DOM says word 2, but the ink belongs to word 1
    expect(vi.mocked(config.onWordClick!).mock.calls[0][0].word).toBe(1);
    handler.detach();
    container.remove();
  });

  it('keeps the DOM target when it owns the ink', () => {
    const { container, w2, config, handler } = setup(2);
    clickAt(w2);
    expect(vi.mocked(config.onWordClick!).mock.calls[0][0].word).toBe(2);
    handler.detach();
    container.remove();
  });

  it('keeps the DOM target when nobody has ink there (blank space in a box)', () => {
    const { container, w2, config, handler } = setup(null);
    clickAt(w2);
    expect(vi.mocked(config.onWordClick!).mock.calls[0][0].word).toBe(2);
    handler.detach();
    container.remove();
  });
});
