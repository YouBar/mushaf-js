/**
 * A single word as it appears in the output page JSON.
 * `location` format: "surah:ayah:word" e.g. "1:2:3"
 */
export interface Word {
  location: string;
  surah: number;
  ayah: number;
  word: number;          // word index within the ayah (1-based)
  qpc: string;           // QPC v2 glyph character(s) for page-specific font rendering
  text?: string | null;  // Uthmani Unicode text for this word (ayah number for end markers)
  is_end_marker?: boolean; // true for the ayah-end glyph (۝ or ۩ for sajda)
}

/** A line within a page. */
export interface Line {
  line: number;
  type: 'surah_name' | 'basmala' | 'ayah';

  // surah_name fields
  surah?: number;
  name_arabic?: string;
  name_simple?: string;
  revelation_place?: string;
  verses_count?: number;
  bismillah_pre?: boolean;

  // ayah fields
  words?: Word[];
  /** From the QUL layout DB: centred line (e.g. pages 1–2, short closing lines); else justified. */
  centered?: boolean;

  // margin markers — present only on the line where the marker first appears
  juz_start?: number;
  hizb_start?: number;
  rub_start?: number;

  // sajda — present on the line containing the last word of the sajda verse
  sajda?: 'obligatory' | 'optional' | 'required';
}

/** Emitted by EventHandler when an ayah marker is clicked. */
export interface AyahMarker {
  surah: number;
  ayah: number;
  element: HTMLElement;
}

/** Parse a location string "surah:ayah:word" into its components. */
export function parseLocation(location: string): { surah: number; ayah: number; word: number } {
  const parts = location.split(':').map(Number);
  return { surah: parts[0] ?? 0, ayah: parts[1] ?? 0, word: parts[2] ?? 0 };
}
