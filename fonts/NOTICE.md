# Font & artwork notices

| File | Source | Licence / owner |
|------|--------|-----------------|
| `hafs/NNN.woff2` | QPC V2 per-page fonts (King Fahd Glorious Qur'an Printing Complex), via [QUL](https://qul.tarteel.ai/resources/font/249) | © King Fahd Complex |
| `QCF_BSML.woff2` | `QCF4_BSML` (basmala, surah-title and juz-title calligraphy) — converted to WOFF2 from the [`qcf_quran_plus`](https://pub.dev/packages/qcf_quran_plus) package (MIT) | © King Fahd Complex |
| `surah-banner.webp` | Surah header frame from [`qcf_quran_plus`](https://pub.dev/packages/qcf_quran_plus) (MIT, © 2026 Hussein), resized and converted to WebP | MIT |
| margin ornaments (embedded as SVG paths in `packages/core/src/assets/markerOrnaments.ts`) | Glyphs U+FC22 (`marker-half`) and U+FC23 (`marker-full`) of the `quran-common` font, [QUL "Juz name font"](https://qul.tarteel.ai/resources/font/459) | Free to use, via QUL |

`QCF_BSML.woff2` code points used by mushaf.js:

- `U+FAD5 U+FAD6 U+FAD7 U+FAD8` — بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
- `U+F100 + (surah − 1)` — calligraphic "سورة …" title for each of the 114 surahs
- `U+F1D8 + (juz − 1)` — calligraphic "الجزء …" title for each of the 30 juz
