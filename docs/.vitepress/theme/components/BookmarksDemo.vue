<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useMushaf } from '../useMushaf'

const TAGS = {
  favourite: { label: 'Favourite', color: 'rgba(243,201,105,.75)' },
  memorize: { label: 'To memorize', color: 'rgba(52,168,83,.40)' },
  reflect: { label: 'Reflect on', color: 'rgba(168,85,247,.32)' },
} as const
type Tag = keyof typeof TAGS
type Bookmark = { surah: number; ayah: number; tag: Tag }

const STORAGE = 'mushafjs-docs-bookmarks'
const el = ref<HTMLElement | null>(null)
const tag = ref<Tag>('favourite')
const bookmarks = ref<Bookmark[]>([
  { surah: 2, ayah: 255, tag: 'favourite' },
  { surah: 2, ayah: 286, tag: 'memorize' },
])

const key = (b: { surah: number; ayah: number }) => `bm:${b.surah}:${b.ayah}`

function toggle(surah: number, ayah: number) {
  const m = mushaf.value
  if (!m) return
  const i = bookmarks.value.findIndex((b) => b.surah === surah && b.ayah === ayah)
  if (i >= 0) {
    m.clearHighlight(key({ surah, ayah }))
    bookmarks.value.splice(i, 1)
  } else {
    const b = { surah, ayah, tag: tag.value }
    m.highlightAyah(surah, ayah, { style: 'background', color: TAGS[b.tag].color, key: key(b) })
    bookmarks.value.push(b)
  }
}

const { mushaf, ready, page, error } = useMushaf(el, {
  onWordClick: (w) => toggle(w.surah, w.ayah),
  onAyahClick: (a) => toggle(a.surah, a.ayah),
}, 42)

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) ?? 'null')
    if (Array.isArray(saved)) bookmarks.value = saved.filter((b) => b && b.tag in TAGS)
  } catch { /* storage unavailable: keep the defaults */ }
})

// Paint saved bookmarks once; highlights then persist across page turns by themselves.
watch(ready, (r) => {
  const m = mushaf.value
  if (!r || !m) return
  m.batchHighlights(() => {
    for (const b of bookmarks.value) m.highlightAyah(b.surah, b.ayah, { style: 'background', color: TAGS[b.tag].color, key: key(b) })
  })
})

watch(bookmarks, (list) => {
  try { localStorage.setItem(STORAGE, JSON.stringify(list)) } catch { /* ignore */ }
}, { deep: true })

const sorted = () => [...bookmarks.value].sort((a, b) => a.surah - b.surah || a.ayah - b.ayah)
</script>

<template>
  <div class="demo">
    <div class="demo-bar">
      <span class="label">Tag new bookmarks as:</span>
      <button v-for="(t, k) in TAGS" :key="k" class="btn" :aria-pressed="tag === k" @click="tag = k">
        <span class="swatch" :style="{ background: t.color }" />{{ t.label }}
      </button>
      <span class="spacer" />
      <button class="btn" :disabled="page >= 604" @click="mushaf?.nextPage()">← Next</button>
      <span class="label mono">p.{{ page }}</span>
      <button class="btn" :disabled="page <= 1" @click="mushaf?.previousPage()">Prev →</button>
    </div>
    <p v-if="error" class="demo-error">{{ error }}</p>
    <div class="demo-body">
      <div class="demo-page"><div ref="el" /></div>
      <aside class="demo-side">
        <section>
          <h4>Bookmarks · {{ bookmarks.length }}</h4>
          <p v-if="!bookmarks.length" class="muted">Tap any ayah to bookmark it. Tap again to remove.</p>
          <ul class="legend">
            <li v-for="b in sorted()" :key="key(b)">
              <span class="swatch" :style="{ background: TAGS[b.tag].color }" />
              <a href="#" @click.prevent="mushaf?.goToAyah(b.surah, b.ayah)">{{ b.surah }}:{{ b.ayah }}</a>
              <span class="count">{{ TAGS[b.tag].label }}</span>
            </li>
          </ul>
        </section>
        <section>
          <p class="muted">Bookmarks are kept in this browser. Click one to jump to its page.</p>
        </section>
      </aside>
    </div>
  </div>
</template>
