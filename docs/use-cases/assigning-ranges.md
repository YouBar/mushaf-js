---
title: Assigning ranges
aside: false
description: Let users pick a word-level range on the page by tapping a start and an end word.
---

# Assigning ranges

A teacher hands out the next lesson by tapping where it starts and where it ends. Selection mode handles the taps, shows a live preview of the range under the pointer, and reports every change.

<SelectionDemo />

## How it works

1. `startSelection()` puts the page in selection mode. Word and ayah click callbacks pause.
2. The first tap sets `start`, the second sets `end` (the order of the taps does not matter). Tapping the start again undoes it; a third tap starts over.
3. `onSelectionChange` fires on each change. When `end` is set, save it and draw it as a normal keyed highlight.

```js
import { Mushaf, wordPosition } from 'mushaf.js'

let selection = null

const mushaf = new Mushaf({
  container: '#mushaf',
  selectionHighlight: { style: 'border', color: '#7c3aed' },
  onSelectionChange: (sel) => {
    selection = sel
    assignButton.disabled = !sel?.end
  },
})
await mushaf.init()
await mushaf.renderPage(604)

selectButton.onclick = () => mushaf.startSelection()

assignButton.onclick = async () => {
  const { start, end } = selection
  const { id } = await api.post('/assignments', {
    from: wordPosition(start), // 112001001
    to: wordPosition(end),     // 113005006
  })
  mushaf.highlightRange(start, end, { style: 'background', color: 'rgba(124,58,237,.26)', key: `task:${id}` })
  mushaf.setSelection(null)
}
```

Ranges are word-level and cross ayahs, surahs and pages. To restore a half-finished selection (for example when reopening a dialog), pass it back in: `mushaf.startSelection(previousSelection)`.

**API used:** [range selection](/api-reference#range-selection), [`highlightRange`](/api-reference#highlightrange-from-to-config-void), [`wordPosition`](/api-reference#highlightrange-from-to-config-void).
