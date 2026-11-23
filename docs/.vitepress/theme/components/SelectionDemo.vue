<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import type { RangeSelection } from 'mushaf.js'
import { wordPosition } from 'mushaf.js'
import { useMushaf, refLabel } from '../useMushaf'

const COLORS = ['rgba(124,58,237,.26)', 'rgba(14,165,233,.28)', 'rgba(234,88,12,.28)', 'rgba(22,163,74,.28)']

const el = ref<HTMLElement | null>(null)
const selecting = ref(false)
const selection = shallowRef<RangeSelection | null>(null)
const assignments = ref<{ id: number; from: number; to: number; label: string; color: string }[]>([])
let nextId = 1

const { mushaf, error } = useMushaf(el, {
  showMarginMarkers: false,
  selectionHighlight: { style: 'border', color: '#7c3aed' },
  onSelectionChange: (sel) => {
    selection.value = sel
  },
}, 604)

const status = computed(() => {
  if (!selecting.value) return 'Press “Select a range” to start.'
  if (!selection.value) return 'Tap the first word.'
  if (!selection.value.end) return 'Now tap the last word (tap the first again to undo).'
  return 'Range ready. Assign it, or tap again to start over.'
})

function toggle() {
  const m = mushaf.value
  if (!m) return
  if (selecting.value) m.cancelSelection()
  else m.startSelection()
  selecting.value = m.isSelecting()
}

function assign() {
  const m = mushaf.value
  const sel = selection.value
  if (!m || !sel?.end) return
  // Store two integers: they sort in reading order and fit in any database.
  const from = wordPosition(sel.start)
  const to = wordPosition(sel.end)
  const color = COLORS[(nextId - 1) % COLORS.length]
  const id = nextId++
  m.highlightRange(sel.start, sel.end, { style: 'background', color, key: `task:${id}` })
  assignments.value.push({ id, from, to, color, label: `${refLabel(sel.start)} → ${refLabel(sel.end)}` })
  m.setSelection(null)
}

function remove(id: number) {
  mushaf.value?.clearHighlight(`task:${id}`)
  assignments.value = assignments.value.filter((a) => a.id !== id)
}
</script>

<template>
  <div class="demo">
    <div class="demo-bar">
      <button class="btn" :class="{ primary: !selecting }" @click="toggle">
        {{ selecting ? 'Stop selecting' : 'Select a range' }}
      </button>
      <button class="btn primary" :disabled="!selection?.end" @click="assign">Assign as homework</button>
      <span class="label">{{ status }}</span>
    </div>
    <p v-if="error" class="demo-error">{{ error }}</p>
    <div class="demo-body">
      <div class="demo-page"><div ref="el" /></div>
      <aside class="demo-side">
        <section>
          <h4>onSelectionChange</h4>
          <pre class="mono sel">{{ selection
            ? `start: ${refLabel(selection.start)}\nend:   ${selection.end ? refLabel(selection.end) : 'null'}`
            : 'null' }}</pre>
          <p v-if="selection?.end" class="mono muted">
            stored as {{ wordPosition(selection.start) }} → {{ wordPosition(selection.end) }}
          </p>
        </section>
        <section>
          <h4>Assignments</h4>
          <p v-if="!assignments.length" class="muted">None yet. Ranges may cross surahs, try 112 → 113.</p>
          <ul class="legend">
            <li v-for="a in assignments" :key="a.id">
              <span class="swatch" :style="{ background: a.color }" />
              <span class="mono">{{ a.label }}</span>
              <button class="btn x" :aria-label="`Remove ${a.label}`" @click="remove(a.id)">×</button>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.sel { margin: 0; padding: 8px 10px; border-radius: 6px; background: var(--vp-c-bg-soft); white-space: pre; }
.x { margin-left: auto; padding: 0 7px; line-height: 18px; }
</style>
