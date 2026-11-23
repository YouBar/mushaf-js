<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Word } from 'mushaf.js'
import { useMushaf } from '../useMushaf'

type Kind = 'memorized' | 'needsWork' | 'review' | 'homework'

const LAYERS: Record<Kind, { label: string; color: string }> = {
  memorized: { label: 'Memorized', color: 'rgba(34,160,90,.30)' },
  needsWork: { label: 'Needs work', color: 'rgba(225,29,72,.24)' },
  review: { label: 'Review', color: 'rgba(59,130,246,.28)' },
  homework: { label: 'Homework', color: 'rgba(245,158,11,.38)' },
}

// What your backend would return for one student (An-Naba, page 582).
// Positions are word-level; the ayah marker is word `words + 1`.
const segments: { id: number; kind: Kind; from: Ref3; to: Ref3 }[] = [
  { id: 1, kind: 'memorized', from: { surah: 78, ayah: 1, word: 1 }, to: { surah: 78, ayah: 11, word: 4 } },
  { id: 2, kind: 'needsWork', from: { surah: 78, ayah: 12, word: 1 }, to: { surah: 78, ayah: 16, word: 3 } },
  { id: 3, kind: 'review', from: { surah: 78, ayah: 17, word: 1 }, to: { surah: 78, ayah: 25, word: 4 } },
  { id: 4, kind: 'homework', from: { surah: 78, ayah: 26, word: 1 }, to: { surah: 78, ayah: 30, word: 6 } },
]
const mistakes = [
  { id: 1, at: { surah: 78, ayah: 6, word: 3 }, note: 'Wrong ḥarakah', resolved: true },
  { id: 2, at: { surah: 78, ayah: 14, word: 4 }, note: 'Skipped the word', resolved: false },
  { id: 3, at: { surah: 78, ayah: 15, word: 2 }, note: 'Pronunciation (makhraj)', resolved: false },
  { id: 4, at: { surah: 78, ayah: 19, word: 3 }, note: 'Madd too short', resolved: false },
]
type Ref3 = { surah: number; ayah: number; word: number }

const MISTAKE = '#dc2626'
const RESOLVED = '#16a34a'

const visible = reactive<Record<Kind | 'mistakes', boolean>>({
  memorized: true, needsWork: true, review: true, homework: true, mistakes: true,
})
const selected = ref<(typeof mistakes)[number] | null>(null)
const el = ref<HTMLElement | null>(null)

const { mushaf, ready, error } = useMushaf(el, {
  showMarginMarkers: false,
  onWordClick: (w: Word) => {
    selected.value = mistakes.find((m) => m.at.surah === w.surah && m.at.ayah === w.ayah && m.at.word === w.word) ?? null
  },
}, 582)

function paint() {
  const m = mushaf.value
  if (!m) return
  // One repaint for everything, however many records there are.
  m.batchHighlights(() => {
    m.clearHighlightsWithPrefix('seg:')
    m.clearHighlightsWithPrefix('mis:')
    for (const s of segments) {
      if (!visible[s.kind]) continue
      m.highlightRange(s.from, s.to, { style: 'background', color: LAYERS[s.kind].color, key: `seg:${s.id}` })
    }
    if (!visible.mistakes) return
    for (const mi of mistakes) {
      m.highlightWord(mi.at.surah, mi.at.ayah, mi.at.word, {
        style: 'color',
        color: mi.resolved ? RESOLVED : MISTAKE,
        key: `mis:${mi.id}`,
      })
    }
  })
}

watch([ready, visible], () => ready.value && paint(), { deep: true })

const openCount = computed(() => mistakes.filter((m) => !m.resolved).length)
const ayahs = (s: (typeof segments)[number]) => `${s.from.ayah}–${s.to.ayah}`
</script>

<template>
  <div class="demo">
    <div class="demo-bar">
      <span class="label">Layers:</span>
      <button
        v-for="(l, k) in LAYERS"
        :key="k"
        class="btn"
        :aria-pressed="visible[k]"
        @click="visible[k] = !visible[k]"
      >
        <span class="swatch" :style="{ background: l.color }" />{{ l.label }}
      </button>
      <button class="btn" :aria-pressed="visible.mistakes" @click="visible.mistakes = !visible.mistakes">
        <span class="swatch" :style="{ background: MISTAKE }" />Mistakes
      </button>
    </div>
    <p v-if="error" class="demo-error">{{ error }}</p>
    <div class="demo-body">
      <div class="demo-page"><div ref="el" /></div>
      <aside class="demo-side">
        <section>
          <h4>An-Naba · student progress</h4>
          <ul class="legend">
            <li v-for="s in segments" :key="s.id">
              <span class="swatch" :style="{ background: LAYERS[s.kind].color }" />
              {{ LAYERS[s.kind].label }}
              <span class="count">78:{{ ayahs(s) }}</span>
            </li>
          </ul>
        </section>
        <section>
          <h4>Mistakes · {{ openCount }} open</h4>
          <ul class="legend">
            <li v-for="m in mistakes" :key="m.id">
              <span class="swatch" :style="{ background: m.resolved ? RESOLVED : MISTAKE }" />
              {{ m.note }}
              <span class="count">{{ m.at.ayah }}:{{ m.at.word }}</span>
            </li>
          </ul>
        </section>
        <section>
          <h4>Clicked word</h4>
          <p v-if="selected" class="mono">
            {{ selected.resolved ? 'Resolved' : 'Open' }} mistake: {{ selected.note }}
          </p>
          <p v-else class="muted">Click a red or green word to see the note.</p>
        </section>
      </aside>
    </div>
  </div>
</template>
