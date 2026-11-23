<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { DEFAULT_DATA_BASE_URL, DEFAULT_FONTS_BASE_DIR, type Word } from 'mushaf.js'
import { useMushaf } from '../useMushaf'

// An open Mushaf: the odd page sits on the right, the even page on the left.
const right = ref<HTMLElement | null>(null)
const left = ref<HTMLElement | null>(null)
const picked = ref<{ ref: string; text: string } | null>(null)
const copied = ref(false)

function onWord(side: 'left' | 'right') {
  return (w: Word) => {
    const [mine, other] = side === 'right' ? [R.mushaf.value, L.mushaf.value] : [L.mushaf.value, R.mushaf.value]
    other?.clearHighlight()
    mine?.clearHighlight()
    mine?.highlightWord(w.surah, w.ayah, w.word)
    picked.value = { ref: `${w.surah}:${w.ayah}:${w.word}`, text: w.text ?? '' }
  }
}
function onAyah(side: 'left' | 'right') {
  return (a: { surah: number; ayah: number; words: Word[] }) => {
    const [mine, other] = side === 'right' ? [R.mushaf.value, L.mushaf.value] : [L.mushaf.value, R.mushaf.value]
    other?.clearHighlight()
    mine?.clearHighlight()
    mine?.highlightAyah(a.surah, a.ayah)
    picked.value = { ref: `${a.surah}:${a.ayah}`, text: a.words.filter((w) => !w.is_end_marker).map((w) => w.text).join(' ') }
  }
}

const shared = { swipeNavigation: false, showPageHeader: false }
const R = useMushaf(right, { ...shared, onWordClick: onWord('right'), onAyahClick: onAyah('right') }, 1)
const L = useMushaf(left, { ...shared, onWordClick: onWord('left'), onAyahClick: onAyah('left') }, 2)

const spread = computed(() => R.page.value)

const SPREADS = [
  { label: 'Al-Fātiḥah', page: 1 },
  { label: 'Āyat al-Kursī', page: 41, ayah: [2, 255] as const },
  { label: 'Juz ‘Amma', page: 581 },
  { label: 'The final pages', page: 603 },
]

// Each page is its own Mushaf instance and finishes loading on its own. To turn
// the spread as one, fade the book out, wait for BOTH pages, then fade back in.
const turning = ref(true) // hidden until the first spread has rendered
watch(
  () => R.ready.value && L.ready.value,
  (ok) => {
    if (!ok) return
    turning.value = false
    prefetchAround(1)
  },
)

// Warm the browser cache for nearby spreads, so most turns need no network.
const pad = (n: number) => String(n).padStart(3, '0')
const prefetched = new Set<number>()
function prefetch(page: number) {
  if (page < 1 || page > 604 || prefetched.has(page)) return
  prefetched.add(page)
  fetch(`${DEFAULT_DATA_BASE_URL}/${pad(page)}.json`).catch(() => prefetched.delete(page))
  fetch(`${DEFAULT_FONTS_BASE_DIR}/hafs/${pad(page)}.woff2`).catch(() => prefetched.delete(page))
}
function prefetchAround(p: number) {
  for (const q of [p + 2, p + 3, p - 2, p - 1]) prefetch(q)
}
function prefetchSpread(page: number) {
  const p = page % 2 ? page : page - 1
  prefetch(p)
  prefetch(p + 1)
}

let turnId = 0
async function open(page: number, ayah?: readonly [number, number]) {
  const p = Math.min(Math.max(page % 2 ? page : page - 1, 1), 603)
  const id = ++turnId
  picked.value = null
  turning.value = true
  const fadeOut = new Promise((r) => setTimeout(r, 160))
  await Promise.all([fadeOut, R.mushaf.value?.goToPage(p), L.mushaf.value?.goToPage(p + 1)])
  if (id !== turnId) return // a newer turn took over
  for (const m of [R.mushaf.value, L.mushaf.value]) {
    m?.batchHighlights(() => {
      m.clearHighlight()
      // Highlights are declarative: set it on both pages and it shows wherever the ayah is.
      if (ayah) m.highlightAyah(ayah[0], ayah[1])
    })
  }
  turning.value = false
  prefetchAround(p)
}

async function copy() {
  try {
    await navigator.clipboard.writeText('npm install mushaf.js')
    copied.value = true
    setTimeout(() => (copied.value = false), 1400)
  } catch { /* clipboard unavailable */ }
}

const FEATURES = [
  { n: 'Render', body: 'Pages look exactly like the printed Mushaf, in the browser.' },
  { n: 'Interact', body: 'Click a word, an ayah, a surah or a juz marker and get its details.' },
  { n: 'Highlight', body: 'Colour anything on the page, from one word to a whole range.' },
  { n: 'Select', body: 'Let users pick a range by tapping where it starts and ends.' },
]
</script>

<template>
  <div class="home">
    <section class="hero">
      <img class="mark" :src="withBase('/logo.svg')" alt="mushaf.js" width="88" height="88" />
      <h1>The Mushaf, as a component.</h1>
      <p class="lede">
        Render the Mushaf in your web app and interact with everything on the page:
        words, ayahs, surahs and more.
      </p>
      <div class="actions">
        <a class="cta primary" :href="withBase('/getting-started')">Get started</a>
        <a class="cta" :href="withBase('/demo')">Open the playground</a>
        <button class="cta install" type="button" :aria-label="'Copy install command'" @click="copy">
          <span class="muted">$</span> npm install mushaf.js
          <span class="copy">{{ copied ? 'copied' : 'copy' }}</span>
        </button>
      </div>

      <div class="book-wrap">
        <div class="book" :class="{ turning }" dir="rtl">
          <div class="leaf right"><div ref="right" /></div>
          <div class="leaf left"><div ref="left" /></div>
        </div>
        <p v-if="R.error.value || L.error.value" class="demo-error">Could not load the pages.</p>
      </div>

      <div class="below" dir="ltr">
        <div class="turn">
          <button class="arrow" :disabled="spread >= 603" aria-label="Next spread" @click="open(spread + 2)">←</button>
          <span class="mono muted">pages {{ spread }}–{{ spread + 1 }}</span>
          <button class="arrow" :disabled="spread <= 1" aria-label="Previous spread" @click="open(spread - 2)">→</button>
        </div>
        <div class="chips">
          <button
            v-for="s in SPREADS"
            :key="s.label"
            class="chip"
            :aria-pressed="spread === s.page"
            @pointerenter="prefetchSpread(s.page)"
            @click="open(s.page, s.ayah)"
          >{{ s.label }}</button>
        </div>
        <div class="caption" aria-live="polite">
          <template v-if="picked">
            <span class="mono">{{ picked.ref }}</span>
            <span class="arabic">{{ picked.text }}</span>
          </template>
          <span v-else class="muted">Tap any word, or an ayah marker ۝</span>
        </div>
      </div>
    </section>

    <section class="numbers">
      <div v-for="f in FEATURES" :key="f.n" class="num">
        <div class="n">{{ f.n }}</div>
        <p>{{ f.body }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home { max-width: 1152px; margin: 0 auto; padding: 0 24px; }

/* ── Hero: everything centred on one axis, the book is the picture ───────── */
.hero { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 56px 0 40px; }
.mark { width: 88px; height: 88px; margin-bottom: 18px; filter: drop-shadow(0 10px 18px rgba(19, 32, 66, 0.22)); }
h1 {
  margin: 0;
  max-width: 900px;
  font-size: 60px;
  line-height: 1.04;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--vp-c-text-1);
}
.lede { margin: 20px 0 0; max-width: 560px; font-size: 18px; line-height: 1.6; color: var(--vp-c-text-2); }
.actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 30px; }
.cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s, opacity 0.15s;
}
.cta:hover { border-color: var(--vp-c-text-3); }
.cta.primary { background: var(--vp-c-text-1); border-color: var(--vp-c-text-1); color: var(--vp-c-bg); }
.cta.primary:hover { opacity: 0.86; }
.cta.install { font-family: var(--vp-font-family-mono); font-size: 13px; font-weight: 500; }
.copy { margin-left: 4px; padding-left: 10px; border-left: 1px solid var(--vp-c-divider); font-family: var(--vp-font-family-base); font-size: 12px; color: var(--vp-c-text-3); }

/* The open book */
.book-wrap { position: relative; width: 100%; max-width: 900px; margin-top: 56px; }
.book-wrap::before {
  /* a soft pool of light under the book */
  content: '';
  position: absolute;
  inset: 8% -6% -6%;
  background: radial-gradient(closest-side, var(--hero-glow), transparent);
  z-index: 0;
  pointer-events: none;
}
.book {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 6px;
  box-shadow: 0 30px 60px -20px rgba(28, 22, 12, 0.28), 0 2px 6px rgba(28, 22, 12, 0.08);
  overflow: hidden;
  text-align: initial;
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.book.turning { opacity: 0; transform: scale(0.992); }
.dark .book { box-shadow: 0 0 0 1px var(--vp-c-divider), 0 30px 60px -20px rgba(0, 0, 0, 0.7); }
.leaf { position: relative; min-width: 0; }
/* The pages meet at the spine: no outer frames, a shaded gutter instead. */
.leaf :deep(.mushaf-container) { max-width: none; padding: 0; --mushaf-page-shadow: none; }
.leaf :deep(.mushaf-page) { border: 0; }
.leaf::after { content: ''; position: absolute; top: 0; bottom: 0; width: 40px; pointer-events: none; }
.leaf.right::after { left: 0; background: linear-gradient(to right, rgba(40, 28, 10, 0.11), transparent); }
.leaf.left::after { right: 0; background: linear-gradient(to left, rgba(40, 28, 10, 0.11), transparent); }
.dark .leaf.right::after { background: linear-gradient(to right, rgba(0, 0, 0, 0.45), transparent); }
.dark .leaf.left::after { background: linear-gradient(to left, rgba(0, 0, 0, 0.45), transparent); }

.below { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 22px; }
.turn { display: flex; align-items: center; gap: 14px; font-size: 13px; }
.arrow {
  width: 34px;
  height: 34px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.arrow:hover:not(:disabled) { border-color: var(--vp-c-text-3); }
.arrow:disabled { opacity: 0.35; cursor: default; }
.chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.chip {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  background: transparent;
  cursor: pointer;
}
.chip:hover { color: var(--vp-c-text-1); }
.chip[aria-pressed='true'] { color: var(--vp-c-text-1); border-color: var(--vp-c-text-1); }
.caption { display: flex; align-items: baseline; justify-content: center; gap: 12px; min-height: 40px; max-width: 100%; font-size: 14px; }
.caption .arabic { font-size: 22px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Numbers instead of a feature-card grid ─────────────────────────────── */
.numbers {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  margin: 32px 0 24px;
}
.num { padding: 28px 24px; }
.num + .num { border-left: 1px solid var(--vp-c-divider); }
.n { font-size: 28px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
.t { margin-top: 6px; font-size: 14px; font-weight: 600; }
.num p { margin: 10px 0 0; font-size: 14px; line-height: 1.6; color: var(--vp-c-text-2); }

@media (max-width: 900px) {
  .numbers { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .num:nth-child(3) { border-left: 0; }
  .num:nth-child(n + 3) { border-top: 1px solid var(--vp-c-divider); }
}
@media (max-width: 680px) {
  .home { padding: 0 16px; }
  .hero { padding-top: 32px; }
  h1 { font-size: 40px; }
  .lede { font-size: 16px; }
  /* One page on phones: the right-hand (odd) page. */
  .book { grid-template-columns: 1fr; }
  .leaf.left { display: none; }
  .leaf.right::after { display: none; }
  .numbers { grid-template-columns: minmax(0, 1fr); }
  .num + .num { border-left: 0; border-top: 1px solid var(--vp-c-divider); }
}
</style>
