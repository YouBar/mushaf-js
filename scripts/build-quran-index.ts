/**
 * Builds data/quran-index.json, a compact index for progress maths:
 *   surahs[i] = { n, name, arabic, words: [real words per ayah] }
 *   juz / hizb / rub / pages[i] = [start_position, end_position]
 * Positions: surah * 1_000_000 + ayah * 1_000 + word; 999 = end of the ayah.
 * Run after build-page-data (pages are read from data/pages/).
 */
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'data', 'source');
const OUT = join(process.cwd(), 'data', 'quran-index.json');

const load = (name: string): Record<string, any> => JSON.parse(readFileSync(join(SRC, name), 'utf-8'));
const pos = (s: number, a: number, w: number) => s * 1_000_000 + a * 1_000 + w;
const verse = (key: string) => key.split(':').map(Number) as [number, number];

const names = load('quran-metadata-surah-name.json');
const words = new Map<number, Map<number, number>>();
for (const a of Object.values(load('quran-metadata-ayah.json'))) {
  const surah = Number(a.surah_number);
  if (!words.has(surah)) words.set(surah, new Map());
  words.get(surah)!.set(Number(a.ayah_number), Number(a.words_count));
}

const surahs = [];
for (let n = 1; n <= 114; n++) {
  const counts = words.get(n)!;
  surahs.push({
    n,
    name: names[n].name_simple,
    arabic: names[n].name_arabic,
    words: Array.from({ length: counts.size }, (_, i) => counts.get(i + 1)!),
  });
}

const ranges = (file: string, field: string) => {
  const data = load(file);
  return Array.from({ length: Object.keys(data).length }, (_, i) => {
    const item = data[i + 1];
    if (Number(item[field]) !== i + 1) throw new Error(`${file}: unexpected ${field} at ${i + 1}`);
    return [pos(...verse(item.first_verse_key), 1), pos(...verse(item.last_verse_key), 999)];
  });
};

const pages = [];
for (let p = 1; p <= 604; p++) {
  const page = JSON.parse(readFileSync(join(process.cwd(), 'data', 'pages', `${String(p).padStart(3, '0')}.json`), 'utf-8'));
  const ws = page.lines.flatMap((l: any) => l.words ?? []);
  const first = ws[0];
  const last = ws[ws.length - 1];
  pages.push([pos(first.surah, first.ayah, first.word), pos(last.surah, last.ayah, last.word)]);
}

const index = {
  version: 1,
  totalWords: surahs.reduce((sum, s) => sum + s.words.reduce((a, b) => a + b, 0), 0),
  surahs,
  juz: ranges('quran-metadata-juz.json', 'juz_number'),
  hizb: ranges('quran-metadata-hizb.json', 'hizb_number'),
  rub: ranges('quran-metadata-rub.json', 'rub_number'),
  pages,
};

writeFileSync(OUT, JSON.stringify(index));
console.log(
  `data/quran-index.json: ${Math.floor(statSync(OUT).size / 1024)} KB, ${index.totalWords} words, `
  + `${index.juz.length} juz, ${index.hizb.length} hizb, ${index.rub.length} rub, ${pages.length} pages`,
);
