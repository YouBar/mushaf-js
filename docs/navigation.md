---
title: Navigation
description: Page, surah, and ayah navigation methods plus touch and keyboard support.
---

# Navigation

mushaf.js provides several ways to navigate through the Quran: programmatic methods, touch gestures, and keyboard shortcuts.

---

## Programmatic navigation

### By page number

```js
await mushaf.renderPage(1);    // page 1 (Al-Fatihah)
await mushaf.renderPage(604);  // last page
await mushaf.goToPage(255);    // alias for renderPage
await mushaf.nextPage();
await mushaf.previousPage();
```

Page numbers are 1-based and must be in the range 1–604. An error is thrown for out-of-range values.

### By surah

```js
await mushaf.goToSurah(1);    // Al-Fatihah
await mushaf.goToSurah(2);    // Al-Baqarah
await mushaf.goToSurah(36);   // Ya-Sin
await mushaf.goToSurah(114);  // An-Nas
```

Navigates to the first page of the surah. Requires `metadata.json` to be available.

### By ayah

```js
await mushaf.goToAyah(1,   1);    // Al-Fatihah 1:1
await mushaf.goToAyah(2, 255);    // Ayat al-Kursi
await mushaf.goToAyah(36,  83);   // Ya-Sin last ayah
await mushaf.goToAyah(112,  1);   // Al-Ikhlas first ayah
```

Navigates to the page containing that ayah. Requires `page-index.json`:

```bash
npm run generate-index
```

---

## Tracking the current page

```js
mushaf.getCurrentPage();  // returns number

mushaf.getPageInfo();
// returns { page: number, totalPages: 604 }
```

Use the `onPageChange` callback to react to navigation:

```js
new Mushaf({
  onPageChange: (page) => {
    document.title = `Page ${page}`;
    updateProgressBar(page / 604);
  },
});
```

---

## Touch gestures

Touch navigation is built in — no setup required.

| Gesture | Action |
|---------|--------|
| Swipe **left** | Next page (page number increases) |
| Swipe **right** | Previous page (page number decreases) |

A swipe is registered when:
- The horizontal movement exceeds **50px**, and
- The horizontal movement is greater than the vertical movement (to avoid conflicts with scrolling)

This follows the RTL book convention: in a physical Madani mushaf, the next page is to the left.

### Intercepting swipes

```js
new Mushaf({
  onSwipe: (direction) => {
    // direction is 'next' or 'prev'
    // The library still navigates automatically.
    // Use this to update external state or analytics.
    analytics.track('mushaf_swipe', { direction });
  },
});
```

---

## Keyboard navigation

Keyboard navigation is built in — the library listens to `document.keydown`.

| Key | Action |
|-----|--------|
| `←` ArrowLeft | Next page (forward in RTL reading direction) |
| `→` ArrowRight | Previous page |

Key events are ignored when an `<input>`, `<textarea>`, or `<select>` element is focused, so search boxes and other form fields work normally.

### Intercepting key navigation

```js
new Mushaf({
  onKeyNav: (direction) => {
    // direction is 'next' or 'prev'
    // The library still navigates automatically.
    analytics.track('mushaf_key_nav', { direction });
  },
});
```

---

## Building a navigation UI

A minimal navigation bar:

```html
<div id="nav">
  <button id="prev">← Prev</button>
  <label>
    Page
    <input id="pageInput" type="number" min="1" max="604" value="1" style="width:60px" />
    / 604
  </label>
  <button id="next">Next →</button>

  <select id="surahSelect"></select>
</div>
```

```js
const mushaf = new Mushaf({
  container: '#mushaf',
  onPageChange: (page) => {
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

document.getElementById('prev').onclick  = () => mushaf.previousPage();
document.getElementById('next').onclick  = () => mushaf.nextPage();
document.getElementById('pageInput').onchange = (e) => {
  mushaf.goToPage(parseInt(e.target.value, 10));
};
select.onchange = (e) => {
  mushaf.goToSurah(parseInt(e.target.value, 10));
};
```
