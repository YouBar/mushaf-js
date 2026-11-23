---
layout: home
title: mushaf.js
titleTemplate: Interactive Madani Mushaf for the web
---

<HomePage />

<div class="home-section">
<div class="vp-doc">

## Get started in three steps

**1. Install**

```bash
npm install mushaf.js
```

**2. Add a container**

```html
<link rel="stylesheet" href="node_modules/mushaf.js/dist/mushaf.min.css" />
<div id="mushaf"></div>
```

**3. Render a page**

```js
import { Mushaf } from 'mushaf.js'

const mushaf = new Mushaf({
  container: '#mushaf',
  onWordClick: (word) => mushaf.highlightWord(word.surah, word.ayah, word.word),
})

await mushaf.init()
await mushaf.renderPage(1)
```

That's it. Page data and fonts come from `cdn.mushafjs.com`, so there is nothing to host. [Read the guide →](/getting-started)

## What you can build

<UseCaseCards />

</div>
</div>

<style>
.home-section { max-width: 1152px; margin: 0 auto; padding: 8px 24px 64px; }
.home-section .vp-doc { max-width: 860px; }
.home-section h2 { border-top: 0; margin-top: 24px; }
@media (max-width: 640px) { .home-section { padding: 8px 16px 48px; } }
</style>
