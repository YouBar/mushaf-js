---
title: Recitation follow-along
aside: false
description: Move a highlight through the page word by word, in sync with a timer or audio.
---

# Recitation follow-along

Highlight the ayah being recited and the exact word inside it, and let the reader tap a word to jump there. The demo uses a timer; with audio you drive the same two calls from the player.

<FollowAlongDemo />

## How it works

Two keyed highlights do the work: a soft band on the current ayah and the `color` style on the current word. Because each has a fixed key, every call replaces the previous one; `batchHighlights` makes the pair repaint once.

```js
import { Mushaf, DEFAULT_DATA_BASE_URL } from 'mushaf.js'

const mushaf = new Mushaf({
  container: '#mushaf',
  onWordClick: (w) => seek(words.findIndex((x) => x.location === w.location)),
})
await mushaf.init()
await mushaf.renderPage(1)

// The recited words of the page, in reading order.
const page = await fetch(`${DEFAULT_DATA_BASE_URL}/001.json`).then((r) => r.json())
const words = page.lines.flatMap((l) => l.words ?? []).filter((w) => !w.is_end_marker)

function show(w) {
  mushaf.batchHighlights(() => {
    mushaf.highlightAyah(w.surah, w.ayah, { style: 'background', color: 'rgba(214,170,80,.24)', key: 'now:ayah' })
    mushaf.highlightWord(w.surah, w.ayah, w.word, { style: 'color', color: '#c2410c', key: 'now:word' })
  })
}
```

### With audio

Most recitation sources publish word timings (start and end in ms per word). Look up the word for the current time and call `show()`:

```js
audio.addEventListener('timeupdate', () => {
  const ms = audio.currentTime * 1000
  const i = timings.findIndex((t) => ms >= t.start && ms < t.end)
  if (i !== -1 && i !== current) show(words[(current = i)])
})
```

Turn the page when the recitation moves past it with `mushaf.goToAyah(surah, ayah)`.

**API used:** [`highlightAyah`](/api-reference#highlightayah-surah-ayah-config-void), [`highlightWord`](/api-reference#highlightword-surah-ayah-word-config-void), [`batchHighlights`](/api-reference#batchhighlights-fn-void), [page data](/data).
