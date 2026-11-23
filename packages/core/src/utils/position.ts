/**
 * Word position = surah × 1,000,000 + ayah × 1,000 + word: one integer per word in
 * reading order. The ayah-end marker is word `words_count + 1`.
 */

export interface WordRef {
  surah: number;
  ayah: number;
  word: number;
}

export function wordPosition(ref: WordRef): number {
  return ref.surah * 1_000_000 + ref.ayah * 1_000 + ref.word;
}

export function positionToRef(position: number): WordRef {
  return {
    surah: Math.floor(position / 1_000_000),
    ayah: Math.floor((position % 1_000_000) / 1_000),
    word: position % 1_000,
  };
}

/** Returns [from, to] in reading order. */
export function orderRefs(a: WordRef, b: WordRef): [WordRef, WordRef] {
  return wordPosition(a) <= wordPosition(b) ? [a, b] : [b, a];
}

/** Position of a rendered word or ayah-marker element, or null. */
export function elementPosition(el: Element): number | null {
  const surah = Number(el.getAttribute('data-surah'));
  const ayah = Number(el.getAttribute('data-ayah'));
  const word = Number(el.getAttribute('data-word'));
  if (!surah || !ayah || !word) return null;
  return wordPosition({ surah, ayah, word });
}
