import { describe, it, expect, beforeEach } from 'vitest';
import { HighlightManager } from '../../src/core/HighlightManager';

// ── DOM helpers ────────────────────────────────────────────────────────────

function makeWord(surah: number, ayah: number, word: number): HTMLElement {
  const span = document.createElement('span');
  span.className = 'mushaf-word';
  span.setAttribute('data-surah', String(surah));
  span.setAttribute('data-ayah', String(ayah));
  span.setAttribute('data-word', String(word));
  span.textContent = 'ﱁ';
  return span;
}

function makeAyahGroup(surah: number, ayah: number, wordCount: number): HTMLElement {
  const group = document.createElement('span');
  group.className = 'mushaf-ayah';
  group.setAttribute('data-surah', String(surah));
  group.setAttribute('data-ayah', String(ayah));
  for (let i = 1; i <= wordCount; i++) {
    group.appendChild(makeWord(surah, ayah, i));
  }
  return group;
}

function makeContainer(): HTMLElement {
  const container = document.createElement('div');
  const line = document.createElement('div');
  line.className = 'mushaf-line';
  // Surah 1, Ayah 1 — 3 words
  line.appendChild(makeAyahGroup(1, 1, 3));
  // Surah 1, Ayah 2 — 2 words
  line.appendChild(makeAyahGroup(1, 2, 2));
  // Surah 2, Ayah 1 — 2 words
  line.appendChild(makeAyahGroup(2, 1, 2));
  container.appendChild(line);
  return container;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('HighlightManager', () => {
  let container: HTMLElement;
  let manager: HighlightManager;

  beforeEach(() => {
    container = makeContainer();
    document.body.appendChild(container);
    manager = new HighlightManager(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  // ── highlightWord ─────────────────────────────────────────────────────────

  describe('highlightWord', () => {
    it('adds mushaf-highlight-bg to the correct element (background style)', () => {
      manager.highlightWord(
        { location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: '' },
        { style: 'background' }
      );
      const word = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="1"]'
      )!;
      expect(word.classList.contains('mushaf-highlight-bg')).toBe(true);
      expect(word.dataset.highlighted).toBe('background');
    });

    it('falls back to the background style when none is given (plain JS)', () => {
      manager.highlightWord(
        { location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: '' },
        { color: '#9fd3b0' } as never,
      );
      const word = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="1"]'
      )!;
      expect(word.dataset.highlighted).toBe('background');
    });

    it('passes a custom color to the highlight band', () => {
      manager.highlightWord(
        { location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: '' },
        { style: 'background', color: '#ff0000' }
      );
      const band = container.querySelector<HTMLElement>('.mushaf-hl--background')!;
      expect(band).not.toBeNull();
      const layer = band.closest<HTMLElement>('.mushaf-hl-layer')!;
      expect(layer.style.getPropertyValue('--mushaf-hl-color')).toBe('#ff0000');
    });

    it('recolours the glyph itself with the color style', () => {
      manager.highlightWord(
        { location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: '' },
        { style: 'color', color: '#ff0000' }
      );
      const word = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="1"]'
      )!;
      expect(word.style.color).toBe('rgb(255, 0, 0)');
      expect(container.querySelector('.mushaf-hl')).toBeNull();
    });

    it('adds mushaf-highlight-underline (underline style)', () => {
      manager.highlightWord(
        { location: '1:1:2', surah: 1, ayah: 1, word: 2, qpc: '' },
        { style: 'underline', color: '#00ff00' }
      );
      const word = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="2"]'
      )!;
      expect(word.classList.contains('mushaf-highlight-underline')).toBe(true);
    });

    it('adds mushaf-highlight-border (border style)', () => {
      manager.highlightWord(
        { location: '1:1:3', surah: 1, ayah: 1, word: 3, qpc: '' },
        { style: 'border' }
      );
      const word = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="3"]'
      )!;
      expect(word.classList.contains('mushaf-highlight-border')).toBe(true);
    });

    it('adds a custom CSS class (custom style)', () => {
      manager.highlightWord(
        { location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: '' },
        { style: 'custom', customClass: 'my-gold' }
      );
      const word = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="1"]'
      )!;
      expect(word.classList.contains('my-gold')).toBe(true);
    });

    it('does not highlight other words', () => {
      manager.highlightWord(
        { location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: '' },
        { style: 'background' }
      );
      const otherWord = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="2"]'
      )!;
      expect(otherWord.classList.contains('mushaf-highlight-bg')).toBe(false);
    });

    it('replaces the previous word highlight when called again', () => {
      manager.highlightWord(
        { location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: '' },
        { style: 'background' }
      );
      manager.highlightWord(
        { location: '1:1:2', surah: 1, ayah: 1, word: 2, qpc: '' },
        { style: 'background' }
      );
      const first = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="1"]'
      )!;
      const second = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="2"]'
      )!;
      expect(first.classList.contains('mushaf-highlight-bg')).toBe(false);
      expect(second.classList.contains('mushaf-highlight-bg')).toBe(true);
    });

    it('is a no-op when the word element does not exist', () => {
      expect(() =>
        manager.highlightWord(
          { location: '99:99:99', surah: 99, ayah: 99, word: 99, qpc: '' },
          { style: 'background' }
        )
      ).not.toThrow();
    });
  });

  // ── highlightAyah ─────────────────────────────────────────────────────────

  describe('highlightAyah', () => {
    it('highlights all words inside the matching ayah group', () => {
      manager.highlightAyah(1, 1, { style: 'background' });
      const words = container.querySelectorAll<HTMLElement>(
        '.mushaf-ayah[data-surah="1"][data-ayah="1"] .mushaf-word'
      );
      expect(words).toHaveLength(3);
      words.forEach((w) => {
        expect(w.classList.contains('mushaf-highlight-bg')).toBe(true);
      });
    });

    it('does not highlight words from a different ayah', () => {
      manager.highlightAyah(1, 1, { style: 'background' });
      const other = container.querySelectorAll<HTMLElement>(
        '.mushaf-ayah[data-surah="1"][data-ayah="2"] .mushaf-word'
      );
      other.forEach((w) => {
        expect(w.classList.contains('mushaf-highlight-bg')).toBe(false);
      });
    });
  });

  // ── highlightSurah ────────────────────────────────────────────────────────

  describe('highlightSurah', () => {
    it('highlights all words belonging to the given surah', () => {
      manager.highlightSurah(1, { style: 'background' });
      // Surah 1 has ayahs 1 (3 words) and 2 (2 words) = 5 words
      const highlighted = container.querySelectorAll('.mushaf-word.mushaf-highlight-bg');
      expect(highlighted).toHaveLength(5);
    });

    it('does not highlight words from a different surah', () => {
      manager.highlightSurah(1, { style: 'background' });
      const surah2words = container.querySelectorAll<HTMLElement>(
        '.mushaf-word[data-surah="2"]'
      );
      surah2words.forEach((w) => {
        expect(w.classList.contains('mushaf-highlight-bg')).toBe(false);
      });
    });
  });

  // ── clearHighlight ────────────────────────────────────────────────────────

  describe('clearHighlight', () => {
    it('removes all highlight classes and data-highlighted', () => {
      manager.highlightWord(
        { location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: '' },
        { style: 'background' }
      );
      manager.highlightAyah(1, 2, { style: 'underline' });
      manager.clearHighlight();
      const anyHighlighted = container.querySelectorAll('[data-highlighted]');
      expect(anyHighlighted).toHaveLength(0);
    });

    it('removes only the specified type when called with a type', () => {
      manager.highlightWord(
        { location: '1:1:1', surah: 1, ayah: 1, word: 1, qpc: '' },
        { style: 'background' }
      );
      manager.highlightAyah(1, 2, { style: 'underline' });

      manager.clearHighlight('word');

      // Word highlight should be gone
      const w1 = container.querySelector<HTMLElement>(
        '.mushaf-word[data-surah="1"][data-ayah="1"][data-word="1"]'
      )!;
      expect(w1.classList.contains('mushaf-highlight-bg')).toBe(false);

      // Ayah highlight should remain
      const ayah2words = container.querySelectorAll<HTMLElement>(
        '.mushaf-ayah[data-surah="1"][data-ayah="2"] .mushaf-word'
      );
      ayah2words.forEach((w) => {
        expect(w.classList.contains('mushaf-highlight-underline')).toBe(true);
      });
    });
  });

  describe('bands, keys and persistence', () => {
    function lineContainer(): HTMLElement {
      // Two lines; ayah 1:1 spans both, with its end marker on line 2.
      const c = document.createElement('div');
      const l1 = document.createElement('div');
      l1.className = 'mushaf-line';
      l1.appendChild(makeAyahGroup(1, 1, 3));
      const l2 = document.createElement('div');
      l2.className = 'mushaf-line';
      const g = makeAyahGroup(1, 1, 0);
      g.appendChild(makeWord(1, 1, 4));
      const marker = document.createElement('span');
      marker.className = 'mushaf-ayah-marker';
      marker.setAttribute('data-surah', '1');
      marker.setAttribute('data-ayah', '1');
      g.appendChild(marker);
      l2.appendChild(g);
      c.append(l1, l2);
      document.body.appendChild(c);
      return c;
    }

    it('draws one continuous band per line for an ayah, including the end marker', () => {
      const c = lineContainer();
      const m = new HighlightManager(c);
      m.highlightAyah(1, 1, { style: 'background' });
      expect(c.querySelectorAll('.mushaf-hl')).toHaveLength(2);
      expect(c.querySelector('.mushaf-ayah-marker')!.getAttribute('data-highlighted')).toBe('background');
      c.remove();
    });

    it('keeps several highlights when distinct keys are used', () => {
      const c = lineContainer();
      const m = new HighlightManager(c);
      m.highlightWord({ surah: 1, ayah: 1, word: 1 }, { style: 'background', key: 'a' });
      m.highlightWord({ surah: 1, ayah: 1, word: 2 }, { style: 'background', key: 'b' });
      expect(c.querySelectorAll('.mushaf-hl')).toHaveLength(2);
      m.clearHighlight('a');
      expect(c.querySelectorAll('.mushaf-hl')).toHaveLength(1);
      c.remove();
    });

    it('re-applies highlights to freshly rendered DOM on refresh()', () => {
      const c = lineContainer();
      const m = new HighlightManager(c);
      m.highlightAyah(1, 1, { style: 'underline' });
      // Simulate a page re-render: replace the DOM entirely.
      const fresh = lineContainer();
      c.innerHTML = fresh.innerHTML;
      fresh.remove();
      expect(c.querySelectorAll('.mushaf-hl')).toHaveLength(0);
      m.refresh();
      expect(c.querySelectorAll('.mushaf-hl--underline')).toHaveLength(2);
      c.remove();
    });
  });

  it('groups all bands of one highlight into a single layer', () => {
    const c = document.createElement('div');
    const lines = document.createElement('div');
    lines.className = 'mushaf-lines';
    for (let i = 1; i <= 2; i++) {
      const l = document.createElement('div');
      l.className = 'mushaf-line';
      l.appendChild(makeAyahGroup(1, 1, 2));
      lines.appendChild(l);
    }
    c.appendChild(lines);
    const m = new HighlightManager(c);
    m.highlightAyah(1, 1, { style: 'background' });
    expect(c.querySelectorAll('.mushaf-hl-layer')).toHaveLength(1);
    expect(c.querySelectorAll('.mushaf-hl-layer .mushaf-hl')).toHaveLength(2);
    // consecutive lines join into one block
    expect(c.querySelector('.mushaf-hl--join-bottom')).not.toBeNull();
    expect(c.querySelector('.mushaf-hl--join-top')).not.toBeNull();
    m.clearHighlight();
    expect(c.querySelector('.mushaf-hl-layer')).toBeNull();
  });
});
