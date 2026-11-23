import type { Line } from './Word';

export interface PageData {
  page: number;
  is_centered: boolean;
  juz: number;       // current juz at the start of this page
  lines: Line[];
}

/** "surah:ayah" → page number, used for goToAyah navigation */
export interface PageIndex {
  [key: string]: number;
}

export interface Surah {
  number: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: string;
  verses_count: number;
  start_page: number;
}

export interface Metadata {
  surahs: Surah[];
}
