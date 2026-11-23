/** Builds data/page-index.json: "surah:ayah" → page number (used by goToAyah). */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { PageData } from '../packages/core/src/types';

const DATA_DIR  = join(process.cwd(), 'data', 'pages');
const OUT_FILE  = join(process.cwd(), 'data', 'page-index.json');

if (!existsSync(DATA_DIR)) {
  console.error(`Data directory not found: ${DATA_DIR}`);
  console.error('Run scripts/build-page-data.ts first.');
  process.exit(1);
}

const index: Record<string, number> = {};

const files = readdirSync(DATA_DIR)
  .filter((f) => /^\d{3}\.json$/.test(f))
  .sort();

console.log(`Scanning ${files.length} page files…`);

for (const file of files) {
  const raw  = readFileSync(join(DATA_DIR, file), 'utf-8');
  const page = JSON.parse(raw) as PageData;

  for (const line of page.lines) {
    if (line.type !== 'ayah' || !line.words?.length) continue;

    for (const word of line.words) {
      const key = `${word.surah}:${word.ayah}`;
      if (!(key in index)) {
        index[key] = page.page;
      }
    }
  }
}

writeFileSync(OUT_FILE, JSON.stringify(index));
console.log(`Written ${Object.keys(index).length} entries to ${OUT_FILE}`);
