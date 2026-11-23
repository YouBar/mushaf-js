import type { Word, HighlightConfig } from '../types';
import { InkMeter, type Box } from '../utils/ink';
import { elementPosition } from '../utils/position';

type HighlightType = 'word' | 'ayah' | 'surah' | 'range' | 'juz' | 'custom';

type Target =
  | { kind: 'word'; surah: number; ayah: number; word: number }
  | { kind: 'ayah'; surah: number; ayah: number }
  | { kind: 'surah'; surah: number }
  | { kind: 'range'; from: number; to: number }
  | { kind: 'elements'; elements: HTMLElement[] };

interface Entry {
  key: string;
  type: HighlightType;
  target: Target;
  config: HighlightConfig;
}

const STATE_CLASS: Record<string, string> = {
  background: 'mushaf-highlight-bg',
  underline: 'mushaf-highlight-underline',
  border: 'mushaf-highlight-border',
  color: 'mushaf-highlight-color',
};

/** Styles drawn as an overlay band behind/under the text (one per line). */
const OVERLAY_STYLES = new Set(['background', 'underline', 'border']);

/**
 * Highlights are stored declaratively and repainted on demand, so they survive page
 * changes and re-renders. Bands are stored in % of the line width, so they survive resizing.
 */
/** Minimum band, as a fraction of the line slot (top / bottom inset). */
const MIN_BAND_INSET = 0.12;
/** Padding around the ink, in em. */
const PAD_X = 0.07;
const PAD_Y = 0.04;

export class HighlightManager {
  private container: HTMLElement;
  private entries = new Map<string, Entry>();
  private ink: InkMeter;
  private batchDepth = 0;
  private dirty = false;

  constructor(container: HTMLElement, ink: InkMeter = new InkMeter()) {
    this.container = container;
    this.ink = ink;
  }

  highlightWord(word: Pick<Word, 'surah' | 'ayah' | 'word'>, config?: HighlightConfig): void {
    this.set('word', { kind: 'word', surah: word.surah, ayah: word.ayah, word: word.word }, config);
  }

  highlightAyah(surah: number, ayah: number, config?: HighlightConfig): void {
    this.set('ayah', { kind: 'ayah', surah, ayah }, config);
  }

  highlightSurah(surah: number, config?: HighlightConfig): void {
    this.set('surah', { kind: 'surah', surah }, config);
  }

  /** Highlight every word and ayah marker between two word positions (inclusive). */
  highlightRange(from: number, to: number, config?: HighlightConfig): void {
    const [a, b] = from <= to ? [from, to] : [to, from];
    this.set('range', { kind: 'range', from: a, to: b }, config);
  }

  /** Run several highlight/clear calls with a single repaint at the end. */
  batch(fn: () => void): void {
    this.batchDepth++;
    try {
      fn();
    } finally {
      this.batchDepth--;
      if (this.batchDepth === 0 && this.dirty) this.refresh();
    }
  }

  /** Highlight arbitrary elements (not persisted across page changes). */
  highlightElements(type: HighlightType, elements: HTMLElement[], config?: HighlightConfig): void {
    this.set(type, { kind: 'elements', elements }, config);
  }

  /** Remove all highlights, or the one stored under `key` (defaults to the highlight type). */
  clearHighlight(keyOrType?: string): void {
    if (keyOrType === undefined) this.entries.clear();
    else this.entries.delete(keyOrType);
    this.requestRefresh();
  }

  /** Remove every highlight whose key starts with `prefix`. */
  clearHighlightsWithPrefix(prefix: string): void {
    for (const key of [...this.entries.keys()]) {
      if (key.startsWith(prefix)) this.entries.delete(key);
    }
    this.requestRefresh();
  }

  hasHighlight(keyOrType: string): boolean {
    return this.entries.has(keyOrType);
  }

  /** Repaint all highlights against the current DOM. */
  refresh(): void {
    this.dirty = false;
    this.unpaint();
    for (const entry of this.entries.values()) {
      if (entry.target.kind === 'elements' && !entry.target.elements.some((e) => e.isConnected)) {
        // Transient element highlights die with their page.
        this.entries.delete(entry.key);
        continue;
      }
      this.paint(entry);
    }
  }

  /** @deprecated kept for backwards compatibility; use refresh(). */
  reapplyHighlights(): void {
    this.refresh();
  }

  private set(type: HighlightType, target: Target, config?: HighlightConfig): void {
    const resolved: HighlightConfig = { ...config, style: config?.style ?? 'background' };
    const key = resolved.key ?? type;
    // Re-insert so the newest highlight paints on top.
    this.entries.delete(key);
    this.entries.set(key, { key, type, target, config: resolved });
    this.requestRefresh();
  }

  private requestRefresh(): void {
    if (this.batchDepth > 0) this.dirty = true;
    else this.refresh();
  }

  private resolve(target: Target): HTMLElement[] {
    const q = (sel: string) => Array.from(this.container.querySelectorAll<HTMLElement>(sel));
    switch (target.kind) {
      case 'word':
        return q(
          `.mushaf-word[data-surah="${target.surah}"][data-ayah="${target.ayah}"][data-word="${target.word}"]`
        );
      case 'ayah':
        return q(
          `.mushaf-ayah[data-surah="${target.surah}"][data-ayah="${target.ayah}"] > :is(.mushaf-word, .mushaf-ayah-marker)`
        );
      case 'surah':
        return q(`.mushaf-ayah[data-surah="${target.surah}"] > :is(.mushaf-word, .mushaf-ayah-marker)`);
      case 'range':
        return q('.mushaf-word, .mushaf-ayah-marker').filter((el) => {
          const p = elementPosition(el);
          return p !== null && p >= target.from && p <= target.to;
        });
      case 'elements':
        return target.elements.filter((e) => e.isConnected);
    }
  }

  private paint(entry: Entry): void {
    const elements = this.resolve(entry.target);
    if (!elements.length) return;

    const { style, color, customClass } = entry.config;

    for (const el of elements) {
      const cls = STATE_CLASS[style];
      if (cls) el.classList.add(cls);
      if (style === 'custom' && customClass) {
        el.classList.add(customClass);
        el.dataset.hlCustom = [el.dataset.hlCustom, customClass].filter(Boolean).join(' ');
      }
      if (style === 'color' && color) el.style.color = color;
      el.dataset.highlighted = style;
    }

    if (OVERLAY_STYLES.has(style)) this.paintBands(entry, elements);
  }

  /**
   * One band per line around the glyphs' measured INK, not their boxes: QPC swashes and
   * harakat spill outside the box. Consecutive lines join into one block. All bands of a
   * highlight share one translucent layer, so overlapping bands keep a uniform colour.
   */
  private paintBands(entry: Entry, elements: HTMLElement[]): void {
    const byLine = new Map<HTMLElement, HTMLElement[]>();
    for (const el of elements) {
      const line = el.closest<HTMLElement>('.mushaf-line');
      if (!line) continue;
      const list = byLine.get(line) ?? [];
      list.push(el);
      byLine.set(line, list);
    }
    if (!byLine.size) return;

    const style = entry.config.style;
    // Underlines stay one bar per line at a consistent height; borders join
    // at the line boundary but are not extended past it (no crossing edges).
    const canJoin = style !== 'underline';
    const canOverlap = style === 'background';
    const joinsPrev = (line: HTMLElement) =>
      canJoin && line.previousElementSibling instanceof HTMLElement && byLine.has(line.previousElementSibling);
    const joinsNext = (line: HTMLElement) =>
      canJoin && line.nextElementSibling instanceof HTMLElement && byLine.has(line.nextElementSibling);

    const host = byLine.keys().next().value!.parentElement ?? this.container;
    const hr = host.getBoundingClientRect();

    const layer = document.createElement('div');
    layer.className = `mushaf-hl-layer mushaf-hl-layer--${style}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.dataset.key = entry.key;
    layer.dataset.type = entry.type;
    if (entry.config.color) {
      layer.style.setProperty('--mushaf-hl-color', entry.config.color);
      layer.classList.add('mushaf-hl-layer--custom-color');
    }

    for (const [line, els] of byLine) {
      const lr = line.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(line).fontSize) || 0;

      const ext: Box = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const ink = this.ink.inkBox(el);
        ext.left = Math.min(ext.left, r.left, ink.left);
        ext.right = Math.max(ext.right, r.right, ink.right);
        ext.top = Math.min(ext.top, ink.top);
        ext.bottom = Math.max(ext.bottom, ink.bottom);
      }

      const joinTop = joinsPrev(line);
      const joinBottom = joinsNext(line);

      const band = document.createElement('span');
      band.className = `mushaf-hl mushaf-hl--${style}`;
      if (joinTop) band.classList.add('mushaf-hl--join-top');
      if (joinBottom) band.classList.add('mushaf-hl--join-bottom');
      band.dataset.line = line.getAttribute('data-line') ?? '';

      if (hr.width > 0 && hr.height > 0 && lr.height > 0 && Number.isFinite(ext.left)) {
        const inkTop = ext.top - PAD_Y * fs;
        const inkBottom = ext.bottom + PAD_Y * fs;
        const minTop = lr.top + MIN_BAND_INSET * lr.height;
        const minBottom = lr.bottom - MIN_BAND_INSET * lr.height;

        let top = Math.min(inkTop, minTop);
        let bottom = Math.max(inkBottom, minBottom);
        if (joinTop) top = canOverlap ? Math.min(top, lr.top) : lr.top;
        if (joinBottom) bottom = canOverlap ? Math.max(bottom, lr.bottom) : lr.bottom;

        const left = ext.left - PAD_X * fs;
        const right = ext.right + PAD_X * fs;
        const pct = (v: number, total: number) => ((v / total) * 100).toFixed(4);
        band.style.left = `${pct(left - hr.left, hr.width)}%`;
        band.style.width = `${pct(Math.max(0, right - left), hr.width)}%`;
        band.style.top = `${pct(top - hr.top, hr.height)}%`;
        band.style.height = `${pct(Math.max(0, bottom - top), hr.height)}%`;
      }
      layer.appendChild(band);
    }

    host.insertBefore(layer, host.firstChild);
  }

  private unpaint(): void {
    this.container.querySelectorAll('.mushaf-hl-layer').forEach((b) => b.remove());
    this.container.querySelectorAll<HTMLElement>('[data-highlighted]').forEach((el) => {
      el.classList.remove(...Object.values(STATE_CLASS));
      if (el.dataset.hlCustom) {
        el.classList.remove(...el.dataset.hlCustom.split(' '));
        delete el.dataset.hlCustom;
      }
      el.style.removeProperty('color');
      delete el.dataset.highlighted;
    });
  }
}
