---
title: Memorization tracker
aside: false
description: Show a student's memorization progress and mistakes on the Mushaf page.
---

# Memorization tracker

A teacher wants to see, at a glance, what a student has memorized, what needs work, what is up for review, and which words went wrong last time. Each record is a range or a single word, painted as its own keyed layer.

<MemorizationDemo />

## How it works

Ranges are word-level, so a segment can start or end mid-ayah. Each one gets a `key`, so you can repaint the whole set at once with `clearHighlightsWithPrefix` and `batchHighlights` (one repaint, however many records). Mistakes use the `color` style: the glyphs themselves change colour, so they stay readable on top of a band.

```js
import { Mushaf } from 'mushaf.js'

const COLORS = {
  memorized: 'rgba(34,160,90,.30)',
  needsWork: 'rgba(225,29,72,.24)',
  review:    'rgba(59,130,246,.28)',
  homework:  'rgba(245,158,11,.38)',
}

const mushaf = new Mushaf({ container: '#mushaf' })
await mushaf.init()
await mushaf.goToSurah(78)

// e.g. from GET /students/42/progress
function paint({ segments, mistakes }) {
  mushaf.batchHighlights(() => {
    mushaf.clearHighlightsWithPrefix('seg:')
    mushaf.clearHighlightsWithPrefix('mis:')

    for (const s of segments) {
      mushaf.highlightRange(s.from, s.to, {
        style: 'background',
        color: COLORS[s.kind],
        key: `seg:${s.id}`,
      })
    }
    for (const m of mistakes) {
      mushaf.highlightWord(m.surah, m.ayah, m.word, {
        style: 'color',
        color: m.resolved ? '#16a34a' : '#dc2626',
        key: `mis:${m.id}`,
      })
    }
  })
}
```

A segment looks like `{ id: 1, kind: 'memorized', from: { surah: 78, ayah: 1, word: 1 }, to: { surah: 78, ayah: 11, word: 4 } }`. Word 4 of a three-word ayah is its end marker ۝, so the range ends on the marker.

Highlights live in mushaf.js, not in the DOM: turn the page and come back, and they are painted again.

## Storing ranges

Store each end as one integer with `wordPosition()`: `surah × 1,000,000 + ayah × 1,000 + word`. Integers sort in reading order, so "is this word inside a segment?" and "which segments overlap?" become plain `BETWEEN` queries.

```js
import { wordPosition, positionToRef } from 'mushaf.js'

wordPosition({ surah: 78, ayah: 11, word: 4 }) // 78011004
positionToRef(78011004)                        // { surah: 78, ayah: 11, word: 4 }
```

**API used:** [`highlightRange`](/api-reference#highlightrange-from-to-config-void), [`highlightWord`](/api-reference#highlightword-surah-ayah-word-config-void), [`batchHighlights`](/api-reference#batchhighlights-fn-void), [`clearHighlightsWithPrefix`](/api-reference#clearhighlightswithprefix-prefix-void), [highlight styles](/highlighting#highlight-styles).
