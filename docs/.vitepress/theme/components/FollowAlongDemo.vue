<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { PageData, Word } from 'mushaf.js'
import { DEFAULT_DATA_BASE_URL } from 'mushaf.js'
import { useMushaf } from '../useMushaf'

const PAGES = [1, 582, 604]
const el = ref<HTMLElement | null>(null)
const words = ref<Word[]>([])
const index = ref(0)
const playing = ref(false)
const msPerWord = ref(650)
let timer: ReturnType<typeof setTimeout> | undefined

const { mushaf, page, ready, error } = useMushaf(el, {
  showMarginMarkers: false,
  onWordClick: (w: Word) => {
    // Tap a word to jump the cursor there.
    const i = words.value.findIndex((x) => x.location === w.location)
    if (i >= 0) index.value = i
  },
  onPageChange: (p) => loadWords(p),
}, 1)

/** Recited words of a page in reading order (ayah markers skipped). */
async function loadWords(p: number) {
  stop()
  const res = await fetch(`${DEFAULT_DATA_BASE_URL}/${String(p).padStart(3, '0')}.json`)
  const data: PageData = await res.json()
  words.value = data.lines.flatMap((l) => l.words ?? []).filter((w) => !w.is_end_marker)
  index.value = 0
}

const current = computed(() => words.value[index.value])

watch([current, ready], () => {
  const m = mushaf.value
  const w = current.value
  if (!m || !ready.value || !w) return
  m.batchHighlights(() => {
    m.highlightAyah(w.surah, w.ayah, { style: 'background', color: 'rgba(214,170,80,.24)', key: 'now:ayah' })
    m.highlightWord(w.surah, w.ayah, w.word, { style: 'color', color: '#c2410c', key: 'now:word' })
  })
})

function tick() {
  if (index.value >= words.value.length - 1) {
    playing.value = false
    return
  }
  index.value++
  timer = setTimeout(tick, msPerWord.value)
}
function play() {
  if (index.value >= words.value.length - 1) index.value = 0
  playing.value = true
  timer = setTimeout(tick, msPerWord.value)
}
function stop() {
  playing.value = false
  clearTimeout(timer)
}
onBeforeUnmount(stop)
</script>

<template>
  <div class="demo">
    <div class="demo-bar">
      <button class="btn primary" :disabled="!words.length" @click="playing ? stop() : play()">
        {{ playing ? 'Pause' : 'Play' }}
      </button>
      <button class="btn" :disabled="index === 0" @click="index--">Back</button>
      <button class="btn" :disabled="index >= words.length - 1" @click="index++">Forward</button>
      <label class="label" for="fa-speed">Speed</label>
      <input id="fa-speed" v-model.number="msPerWord" type="range" min="250" max="1200" step="50" dir="rtl" />
      <span class="spacer" />
      <span class="label">Page</span>
      <button
        v-for="p in PAGES"
        :key="p"
        class="btn"
        :aria-pressed="page === p"
        @click="mushaf?.goToPage(p)"
      >{{ p }}</button>
    </div>
    <p v-if="error" class="demo-error">{{ error }}</p>
    <div class="demo-body">
      <div class="demo-page"><div ref="el" /></div>
      <aside class="demo-side">
        <section>
          <h4>Now reciting</h4>
          <p class="arabic now">{{ current?.text ?? '…' }}</p>
          <p class="mono muted">{{ current?.location ?? '' }} · word {{ index + 1 }} of {{ words.length }}</p>
        </section>
        <section>
          <h4>Hook it to audio</h4>
          <p class="muted">
            Replace the timer with your player’s <code>timeupdate</code> event and a word-timing table,
            and the same two highlight calls follow real recitation.
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.now { margin: 0; font-size: 34px; text-align: center; min-height: 64px; }
input[type='range'] { width: 110px; accent-color: var(--vp-c-brand-1); }
</style>
