<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { Mushaf, type HighlightStyle, type Surah, type Word } from 'mushaf.js'
import { useMushaf } from '../useMushaf'

const STYLES: { style: HighlightStyle; label: string; color?: string }[] = [
  { style: 'background', label: 'Background' },
  { style: 'underline', label: 'Underline', color: '#2e7d32' },
  { style: 'border', label: 'Border', color: '#1565c0' },
  { style: 'color', label: 'Colour', color: '#c2410c' },
]

const el = ref<HTMLElement | null>(null)
const style = ref(STYLES[0])
const surahs = shallowRef<Surah[]>([])
const surahNo = ref(1)
const pageInput = ref(1)
const ayahInput = ref('2:255')
const word = shallowRef<Word | null>(null)
const ayahText = ref('')
const log = ref<{ id: number; name: string; detail: string }[]>([])
const marginMarkers = ref(true)
const pageHeader = ref(true)
let logId = 0

const hl = () => ({ style: style.value.style, color: style.value.color })
function emit(name: string, detail: string) {
  log.value.unshift({ id: ++logId, name, detail })
  log.value.length = Math.min(log.value.length, 40)
}

const config = {
  keyboardNavigation: true,
  onWordClick: (w: Word) => {
    mushaf.value?.highlightWord(w.surah, w.ayah, w.word, hl())
    word.value = w
    emit('onWordClick', `${w.location} ${w.text ?? ''}`)
  },
  onAyahClick: (a: { surah: number; ayah: number; words: Word[] }) => {
    mushaf.value?.highlightAyah(a.surah, a.ayah, hl())
    ayahText.value = a.words.filter((w) => !w.is_end_marker).map((w) => w.text).join(' ')
    emit('onAyahClick', `${a.surah}:${a.ayah} (${a.words.length} glyphs on this page)`)
  },
  onSurahClick: (s: Surah) => {
    mushaf.value?.highlightSurah(s.number, hl())
    emit('onSurahClick', `${s.number} ${s.name_simple}, ${s.verses_count} ayahs`)
  },
  onJuzClick: (j: { juz: number }) => emit('onJuzClick', `juz ${j.juz}`),
  onHizbClick: (h: { hizb: number }) => emit('onHizbClick', `hizb ${h.hizb}`),
  onRubClick: (r: { rub: number }) => emit('onRubClick', `rub ${r.rub}`),
  onPageChange: (p: number) => {
    pageInput.value = p
    const s = [...surahs.value].reverse().find((x) => x.start_page <= p)
    if (s) surahNo.value = s.number
    emit('onPageChange', String(p))
  },
  onKeyNav: (d: 'next' | 'prev') => emit('onKeyNav', d),
  onSwipe: (d: 'next' | 'prev') => emit('onSwipe', d),
}

const { mushaf, page, ready, error } = useMushaf(el, config, 1)

watch(ready, async (r) => {
  if (r && !surahs.value.length) surahs.value = (await mushaf.value?.getMetadata())?.surahs ?? []
})

async function run(fn: () => Promise<void> | void) {
  try {
    error.value = null
    await fn()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

const goPage = () => run(() => mushaf.value?.goToPage(Number(pageInput.value)))
const goSurah = () => run(() => mushaf.value?.goToSurah(Number(surahNo.value)))
const goAyah = () =>
  run(async () => {
    const m = /^\s*(\d+)\s*[:.]\s*(\d+)\s*$/.exec(ayahInput.value)
    if (!m) throw new Error('Enter an ayah as surah:ayah, e.g. 2:255')
    await mushaf.value?.goToAyah(Number(m[1]), Number(m[2]))
    mushaf.value?.highlightAyah(Number(m[1]), Number(m[2]), hl())
  })

// showMarginMarkers / showPageHeader are constructor options: rebuild the instance.
async function rebuild() {
  const p = page.value
  mushaf.value?.destroy()
  const m = new Mushaf({
    container: el.value!,
    ...config,
    keyboardNavigation: true,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    showMarginMarkers: marginMarkers.value,
    showPageHeader: pageHeader.value,
    onPageChange: (n) => { page.value = n; config.onPageChange(n) },
  })
  mushaf.value = m
  await m.init()
  await m.renderPage(p)
}
</script>

<template>
  <div class="demo playground">
    <div class="demo-bar">
      <button class="btn" :disabled="page >= 604" title="Next page (←)" @click="run(() => mushaf?.nextPage())">← Next</button>
      <input v-model.number="pageInput" class="field num" type="number" min="1" max="604" aria-label="Page" @keydown.enter="goPage" />
      <span class="label">/ 604</span>
      <button class="btn" :disabled="page <= 1" title="Previous page (→)" @click="run(() => mushaf?.previousPage())">Prev →</button>
      <select v-model="surahNo" class="field surah" aria-label="Surah" @change="goSurah">
        <option v-for="s in surahs" :key="s.number" :value="s.number">{{ s.number }}. {{ s.name_simple }}</option>
      </select>
      <input v-model="ayahInput" class="field ayah" aria-label="Ayah (surah:ayah)" @keydown.enter="goAyah" />
      <button class="btn" @click="goAyah">Go to ayah</button>
    </div>
    <div class="demo-bar">
      <span class="label">Highlight:</span>
      <button v-for="s in STYLES" :key="s.style" class="btn" :aria-pressed="style.style === s.style" @click="style = s">
        {{ s.label }}
      </button>
      <button class="btn" @click="mushaf?.clearHighlight()">Clear</button>
      <span class="spacer" />
      <label class="label"><input v-model="marginMarkers" type="checkbox" @change="rebuild" /> margin markers</label>
      <label class="label"><input v-model="pageHeader" type="checkbox" @change="rebuild" /> page header</label>
    </div>
    <p v-if="error" class="demo-error">{{ error }}</p>
    <div class="demo-body">
      <div class="demo-page"><div ref="el" /></div>
      <aside class="demo-side">
        <section>
          <h4>Word</h4>
          <template v-if="word">
            <p class="arabic big">{{ word.text }}</p>
            <p class="mono muted">surah {{ word.surah }} · ayah {{ word.ayah }} · word {{ word.word }}</p>
          </template>
          <p v-else class="muted">Click a word. Click ۝ for the ayah, a banner for the surah.</p>
        </section>
        <section v-if="ayahText">
          <h4>Ayah</h4>
          <p class="arabic">{{ ayahText }}</p>
        </section>
        <section>
          <h4>Events</h4>
          <ul class="log">
            <li v-for="e in log" :key="e.id" :title="e.detail"><b>{{ e.name }}</b> {{ e.detail }}</li>
          </ul>
        </section>
        <section>
          <p class="muted">Arrow keys turn pages; swipe on touch screens.</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.playground .demo-page .mushaf-container { max-width: 620px; }
.playground .demo-body { grid-template-columns: minmax(0, 1fr) 300px; }
.num { width: 64px; text-align: center; }
.ayah { width: 72px; text-align: center; }
.surah { max-width: 170px; }
.big { margin: 0; font-size: 30px; text-align: center; }
.arabic { font-size: 19px; margin: 0; }
@container (max-width: 820px) {
  .playground .demo-body { grid-template-columns: minmax(0, 1fr); }
}
</style>
