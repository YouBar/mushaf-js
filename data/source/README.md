# Source data

All Qur'an data in this folder comes from **[QUL — Quranic Universal Library](https://qul.tarteel.ai/)**
by Tarteel. mushaf.js builds its page files from it (`npm run build-data`) and never edits these
files by hand.

| File | What it is |
|------|------------|
| `qpc-v2-15-lines.db` | Madani Mushaf layout (604 pages × 15 lines): which words sit on which line |
| `qpc-v2.json` | QPC V2 glyph code per word (rendered with the per-page fonts in `fonts/hafs/`) |
| `qpc-hafs-word-by-word.json` | Uthmani (Hafs) Unicode text per word |
| `quran-metadata-*.json` | Surahs, ayahs, juz, hizb, rub‘ and sajda positions |

Generated from these: `data/pages/`, `data/metadata.json`, `data/page-index.json` and
`data/quran-index.json`. See [docs/data.md](../../docs/data.md).
