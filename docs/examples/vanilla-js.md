---
title: Vanilla JS Example
description: Using mushaf.js with plain HTML and JavaScript.
---

# Vanilla JS Example

A complete, self-contained HTML page demonstrating the full mushaf.js feature set.

## Minimal example

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>mushaf.js</title>
  <link rel="stylesheet" href="/node_modules/mushaf.js/dist/mushaf.min.css" />
</head>
<body>
  <div id="mushaf"></div>

  <script type="module">
    import { Mushaf } from '/node_modules/mushaf.js/dist/index.mjs';

    const mushaf = new Mushaf({
      container: '#mushaf',
    });

    await mushaf.init();
    await mushaf.renderPage(1);
  </script>
</body>
</html>
```

## Full example with controls

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>mushaf.js — Full Demo</title>
  <link rel="stylesheet" href="/node_modules/mushaf.js/dist/mushaf.min.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; background: #f0ece4; font-family: system-ui, sans-serif; direction: ltr; }

    nav {
      display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
      padding: 8px 16px; background: #fff; border-bottom: 1px solid #ddd;
    }
    nav button { padding: 6px 14px; cursor: pointer; }
    nav input[type=number] { width: 70px; padding: 4px; text-align: center; }
    nav select { padding: 4px; }

    #info {
      padding: 10px 16px; background: #fffde7;
      border-bottom: 1px solid #f9a825; font-size: 0.9em;
      min-height: 36px;
    }

    #mushaf { max-width: 760px; margin: 24px auto; padding: 0 16px; }
  </style>
</head>
<body>

  <nav>
    <button id="btnPrev">← Prev</button>
    <input id="pageInput" type="number" min="1" max="604" value="1" />
    <span style="color:#666">/ 604</span>
    <button id="btnNext">Next →</button>

    <select id="surahSelect"></select>

    <input id="ayahSurah" type="number" min="1" max="114" value="2" style="width:55px" placeholder="S" />
    <input id="ayahNum"   type="number" min="1" value="255" style="width:60px" placeholder="A" />
    <button id="btnGoAyah">Go to Ayah</button>

    <button id="btnClear">Clear</button>
  </nav>

  <div id="info">Click any word or ayah marker for details.</div>
  <div id="mushaf"></div>

  <script type="module">
    import { Mushaf } from '/node_modules/mushaf.js/dist/index.mjs';

    const mushaf = new Mushaf({
      container: '#mushaf',

      wordHighlight: { style: 'background', color: '#fff176' },
      ayahHighlight: { style: 'underline',  color: '#4caf50' },

      onWordClick(word, element) {
        document.getElementById('info').textContent =
          `Word: Surah ${word.surah}, Ayah ${word.ayah}, Word ${word.word}`;
        mushaf.highlightWord(word.surah, word.ayah, word.word);
      },

      onAyahClick(ayah) {
        document.getElementById('info').textContent =
          `Ayah ${ayah.surah}:${ayah.ayah} — ${ayah.words.length} words`;
        mushaf.highlightAyah(ayah.surah, ayah.ayah);
      },

      onSurahClick(surah) {
        document.getElementById('info').textContent =
          `Surah ${surah.number}: ${surah.name_simple} (${surah.name_arabic})`;
      },

      onPageChange(page) {
        document.getElementById('pageInput').value = page;
      },
    });

    await mushaf.init();
    await mushaf.renderPage(1);

    // Populate surah dropdown
    const meta = await mushaf.getMetadata();
    const select = document.getElementById('surahSelect');
    meta.surahs.forEach(({ number, name_simple, name_arabic }) => {
      const opt = document.createElement('option');
      opt.value = number;
      opt.textContent = `${number}. ${name_simple} (${name_arabic})`;
      select.appendChild(opt);
    });

    // Wire up controls
    document.getElementById('btnPrev').onclick  = () => mushaf.previousPage();
    document.getElementById('btnNext').onclick  = () => mushaf.nextPage();
    document.getElementById('btnClear').onclick = () => mushaf.clearHighlight();

    document.getElementById('pageInput').onchange = (e) =>
      mushaf.goToPage(parseInt(e.target.value, 10));

    select.onchange = (e) =>
      mushaf.goToSurah(parseInt(e.target.value, 10));

    document.getElementById('btnGoAyah').onclick = () =>
      mushaf.goToAyah(
        parseInt(document.getElementById('ayahSurah').value, 10),
        parseInt(document.getElementById('ayahNum').value, 10),
      );
  </script>
</body>
</html>
```
