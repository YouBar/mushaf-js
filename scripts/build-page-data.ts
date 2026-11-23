/**
 * Builds data/pages/NNN.json (604 pages) from the QUL sources in data/source/.
 * See docs/data.md for the page format. Needs Node 22+ (node:sqlite).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const INPUT_DIR = join(process.cwd(), 'data', 'source');
const OUTPUT_DIR = join(process.cwd(), 'data', 'pages');

const load = <T = Record<string, any>>(name: string): T =>
  JSON.parse(readFileSync(join(INPUT_DIR, name), 'utf-8'));

interface WordEntry {
  location: string;
  surah: number;
  ayah: number;
  word: number;
  qpc: string;
  text: string | null;
  is_end_marker?: true;
}

const wbwText = new Map<string, string>(
  Object.entries(load('qpc-hafs-word-by-word.json')).map(([loc, e]) => [loc, e.text]),
);

const wordById = new Map<number, WordEntry>();
for (const e of Object.values(load('qpc-v2.json'))) {
  wordById.set(Number(e.id), {
    location: e.location,
    surah: Number(e.surah),
    ayah: Number(e.ayah),
    word: Number(e.word),
    qpc: e.text,
    text: wbwText.get(e.location) ?? null,
  });
}

const surahMeta = load('quran-metadata-surah-name.json');
const ayahMeta = Object.values(load('quran-metadata-ayah.json'));

const juzStart = new Map<string, number>();
const hizbStart = new Map<string, number>();
const rubStart = new Map<string, number>();
const sajdaType = new Map<string, string>();
for (const j of Object.values(load('quran-metadata-juz.json'))) juzStart.set(j.first_verse_key, j.juz_number);
for (const h of Object.values(load('quran-metadata-hizb.json'))) hizbStart.set(h.first_verse_key, h.hizb_number);
for (const r of Object.values(load('quran-metadata-rub.json'))) rubStart.set(r.first_verse_key, r.rub_number);
for (const s of Object.values(load('quran-metadata-sajda.json'))) sajdaType.set(s.verse_key, s.sajdah_type);

// The ayah-end marker is the word after the ayah's real words.
const wordCount = new Map<string, number>();
const endMarkers = new Set<string>();
for (const a of ayahMeta) {
  wordCount.set(a.verse_key, a.words_count);
  endMarkers.add(`${Number(a.surah_number)}:${Number(a.ayah_number)}:${Number(a.words_count) + 1}`);
}

const db = new DatabaseSync(join(INPUT_DIR, 'qpc-v2-15-lines.db'), { readOnly: true });
const pageNumbers = db
  .prepare('SELECT DISTINCT page_number FROM pages ORDER BY page_number')
  .all()
  .map((row) => Number(row.page_number));
const linesOf = db.prepare('SELECT * FROM pages WHERE page_number = ? ORDER BY line_number');

mkdirSync(OUTPUT_DIR, { recursive: true });

let currentJuz = 1;

for (const pageNumber of pageNumbers) {
  const rows = linesOf.all(pageNumber) as Record<string, any>[];
  const isCentered = rows.every((row) => Boolean(row.is_centered));
  let pageJuz = currentJuz;
  const lines: Record<string, unknown>[] = [];

  for (const row of rows) {
    const lineNumber = row.line_number;

    if (row.line_type === 'surah_name') {
      const s = surahMeta[String(row.surah_number)];
      lines.push({
        line: lineNumber,
        type: 'surah_name',
        surah: row.surah_number,
        name_arabic: s.name_arabic,
        name_simple: s.name_simple,
        revelation_place: s.revelation_place,
        verses_count: s.verses_count,
        bismillah_pre: s.bismillah_pre,
      });
    } else if (row.line_type === 'basmallah') {
      lines.push({ line: lineNumber, type: 'basmala' });
    } else if (row.line_type === 'ayah') {
      const words: WordEntry[] = [];
      if (row.first_word_id != null && row.last_word_id != null) {
        for (let id = Number(row.first_word_id); id <= Number(row.last_word_id); id++) {
          const w = wordById.get(id);
          if (!w) continue;
          const entry: WordEntry = { ...w };
          if (endMarkers.has(`${w.surah}:${w.ayah}:${w.word}`)) entry.is_end_marker = true;
          words.push(entry);
        }
      }

      const line: Record<string, unknown> = {
        line: lineNumber,
        type: 'ayah',
        surah: words.length ? words[0].surah : (row.surah_number || 0),
        centered: Boolean(row.is_centered),
        words,
      };

      // juz/hizb/rub: the line where the ayah starts; sajda: the line with its last word.
      const seen = new Set<string>();
      for (const w of words) {
        const key = `${w.surah}:${w.ayah}`;
        if (!seen.has(key)) {
          seen.add(key);
          if (w.word === 1) {
            if (juzStart.has(key)) {
              line.juz_start = juzStart.get(key);
              currentJuz = juzStart.get(key)!;
              if (!lines.some((l) => l.type === 'ayah')) pageJuz = currentJuz;
            }
            if (hizbStart.has(key)) line.hizb_start = hizbStart.get(key);
            if (rubStart.has(key)) line.rub_start = rubStart.get(key);
          }
        }
        if (sajdaType.has(key) && w.word === (wordCount.get(key) ?? 0)) line.sajda = sajdaType.get(key);
      }

      lines.push(line);
    }
  }

  const page = { page: pageNumber, is_centered: isCentered, juz: pageJuz, lines };
  writeFileSync(join(OUTPUT_DIR, `${String(pageNumber).padStart(3, '0')}.json`), JSON.stringify(page));
}

db.close();
console.log(`${pageNumbers.length} pages written to data/pages/`);
