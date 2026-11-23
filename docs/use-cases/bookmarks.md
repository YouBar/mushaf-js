---
title: Bookmarks
aside: false
description: Bookmark ayahs with colour tags; highlights follow the reader across pages.
---

# Bookmarks

Tap an ayah to bookmark it with a tag; tap it again to remove it. The list on the side jumps to any bookmark, on any page. This demo opens on Ayat al-Kursi (2:255); 2:286 is a few pages further.

<BookmarksDemo />

## How it works

Every bookmark is a highlight with its own key, `bm:surah:ayah`. Toggling is `highlightAyah` or `clearHighlight(key)`. You set highlights once: mushaf.js repaints them whenever their page is shown, so bookmarks on other pages appear as the reader gets there.

```js
import { Mushaf } from 'mushaf.js'

const TAGS = {
  favourite: 'rgba(243,201,105,.75)',
  memorize:  'rgba(52,168,83,.40)',
  reflect:   'rgba(168,85,247,.32)',
}
const bookmarks = new Map(JSON.parse(localStorage.getItem('bookmarks') ?? '[]'))
let tag = 'favourite'

const key = (surah, ayah) => `bm:${surah}:${ayah}`

function toggle(surah, ayah) {
  const k = key(surah, ayah)
  if (bookmarks.has(k)) {
    bookmarks.delete(k)
    mushaf.clearHighlight(k)
  } else {
    bookmarks.set(k, { surah, ayah, tag })
    mushaf.highlightAyah(surah, ayah, { style: 'background', color: TAGS[tag], key: k })
  }
  localStorage.setItem('bookmarks', JSON.stringify([...bookmarks]))
}

const mushaf = new Mushaf({
  container: '#mushaf',
  onWordClick: (w) => toggle(w.surah, w.ayah),
  onAyahClick: (a) => toggle(a.surah, a.ayah),
})
await mushaf.init()

// Paint saved bookmarks once, then open on the first one.
for (const [k, b] of bookmarks) mushaf.highlightAyah(b.surah, b.ayah, { style: 'background', color: TAGS[b.tag], key: k })
await mushaf.goToAyah(2, 255)
```

**API used:** [`highlightAyah`](/api-reference#highlightayah-surah-ayah-config-void), [`clearHighlight`](/api-reference#clearhighlight-keyortype-void), [`goToAyah`](/api-reference#gotoayah-surah-number-ayah-number-promise-void), [events](/events).
