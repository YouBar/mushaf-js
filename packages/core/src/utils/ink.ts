/**
 * Real ink geometry of QPC glyphs via canvas TextMetrics. The calligraphy spills outside
 * the advance box (19% of words horizontally, 8% above their line), so DOM boxes clip it.
 */

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface GlyphMetrics {
  /** All values in em (measured at REF_SIZE and divided). */
  inkLeft: number;      // ink extends this far left of the advance-box origin
  inkRight: number;     // ink right edge, from the advance-box origin
  inkAscent: number;    // ink top above the baseline
  inkDescent: number;   // ink bottom below the baseline
  fontAscent: number;   // font ascent used by CSS layout
  fontDescent: number;
}

const REF_SIZE = 100;

type Ctx = OffscreenCanvasRenderingContext2D;

export class InkMeter {
  private ctx: Ctx | null | undefined;
  private cache = new Map<string, GlyphMetrics>();

  private getCtx(): Ctx | null {
    if (this.ctx !== undefined) return this.ctx;
    this.ctx = null;
    // OffscreenCanvas is available in all evergreen browsers; absent in jsdom/SSR.
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        this.ctx = new OffscreenCanvas(8, 8).getContext('2d', { willReadFrequently: true }) as Ctx | null;
      } catch {
        this.ctx = null;
      }
    }
    return this.ctx;
  }

  private metrics(fontFamily: string, text: string): GlyphMetrics | null {
    const key = `${fontFamily}\u0000${text}`;
    const hit = this.cache.get(key);
    if (hit) return hit;

    const ctx = this.getCtx();
    if (!ctx) return null;

    ctx.font = `${REF_SIZE}px ${fontFamily}`;
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(text);
    const g: GlyphMetrics = {
      inkLeft: m.actualBoundingBoxLeft / REF_SIZE,
      inkRight: m.actualBoundingBoxRight / REF_SIZE,
      inkAscent: m.actualBoundingBoxAscent / REF_SIZE,
      inkDescent: m.actualBoundingBoxDescent / REF_SIZE,
      fontAscent: (m.fontBoundingBoxAscent ?? REF_SIZE * 0.8) / REF_SIZE,
      fontDescent: (m.fontBoundingBoxDescent ?? REF_SIZE * 0.2) / REF_SIZE,
    };
    this.cache.set(key, g);
    return g;
  }

  /**
   * Offset (em) of the glyph's ink centre below the centre of a `lineHeightEm` line box;
   * translate by its negative to centre the ink optically. 0 if unknown.
   */
  inkCenterOffsetEm(fontFamily: string, text: string, lineHeightEm = 1): number {
    const g = this.metrics(fontFamily, text);
    if (!g) return 0;
    const baseline = (lineHeightEm - (g.fontAscent + g.fontDescent)) / 2 + g.fontAscent;
    const inkCenter = baseline - (g.inkAscent - g.inkDescent) / 2;
    return inkCenter - lineHeightEm / 2;
  }

  /** Viewport ink box of a word/marker element (its own box if metrics are unavailable). */
  inkBox(el: HTMLElement): Box {
    const r = el.getBoundingClientRect();
    const box: Box = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    const text = el.textContent ?? '';
    if (!text || typeof getComputedStyle === 'undefined') return box;

    const cs = getComputedStyle(el);
    const fs = viewportFontSize(el, r, cs);
    const g = this.metrics(cs.fontFamily, text);
    if (!g || !fs) return box;

    // CSS centres the font's ascent+descent inside the line box (half-leading).
    const baseline = r.top + (r.height - (g.fontAscent + g.fontDescent) * fs) / 2 + g.fontAscent * fs;
    return {
      left: r.left - g.inkLeft * fs,
      right: r.left + g.inkRight * fs,
      top: baseline - g.inkAscent * fs,
      bottom: baseline + g.inkDescent * fs,
    };
  }

  /** Does the glyph of `el` have ink within `radius` px of (x, y)? null if unknown. */
  hasInkAt(el: HTMLElement, x: number, y: number, radius = 2): boolean | null {
    const ctx = this.getCtx();
    if (!ctx || typeof getComputedStyle === 'undefined') return null;
    const text = el.textContent ?? '';
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const fs = viewportFontSize(el, r, cs);
    const g = this.metrics(cs.fontFamily, text);
    if (!g || !fs || !text) return null;
    const baseline = r.top + (r.height - (g.fontAscent + g.fontDescent) * fs) / 2 + g.fontAscent * fs;
    const size = radius * 2 + 1;
    const canvas = ctx.canvas as OffscreenCanvas;
    if (canvas.width < size || canvas.height < size) {
      canvas.width = Math.max(canvas.width, size);
      canvas.height = Math.max(canvas.height, size);
    }
    ctx.clearRect(0, 0, size, size);
    ctx.font = `${fs}px ${cs.fontFamily}`;
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000';
    // Draw so that viewport point (x, y) lands at canvas pixel (radius, radius).
    ctx.fillText(text, r.left - x + radius, baseline - y + radius);
    const data = ctx.getImageData(0, 0, size, size).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 40) return true;
    }
    return false;
  }
}

/**
 * Font size in viewport px: scaled by rendered/layout height, so CSS `zoom` and
 * transforms keep ink geometry and getBoundingClientRect() in one coordinate space.
 */
function viewportFontSize(el: HTMLElement, rect: DOMRect, cs: CSSStyleDeclaration): number {
  const fs = parseFloat(cs.fontSize);
  const layoutHeight = el.offsetHeight;
  return layoutHeight > 0 && rect.height > 0 ? fs * (rect.height / layoutHeight) : fs;
}

export function containsPoint(b: Box, x: number, y: number): boolean {
  return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
}
