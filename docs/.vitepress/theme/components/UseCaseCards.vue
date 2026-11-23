<script setup lang="ts">
import { withBase } from 'vitepress'

const CASES = [
  {
    href: '/use-cases/memorization-tracker',
    title: 'Memorization tracker',
    body: 'Paint a student’s progress on the page: memorized, review and homework ranges, plus the exact words they slipped on.',
    api: 'highlightRange · batchHighlights · style: color',
    swatches: ['rgba(34,160,90,.55)', 'rgba(59,130,246,.5)', 'rgba(245,158,11,.6)', '#dc2626'],
  },
  {
    href: '/use-cases/assigning-ranges',
    title: 'Assigning ranges',
    body: 'A teacher taps a first and a last word to hand out the next lesson. Store it as two integers and draw it anywhere.',
    api: 'startSelection · onSelectionChange · wordPosition',
    swatches: ['#7c3aed', 'rgba(124,58,237,.3)'],
  },
  {
    href: '/use-cases/follow-along',
    title: 'Recitation follow-along',
    body: 'Move a cursor through the page word by word, the way an audio player would, and let readers tap to jump.',
    api: 'highlightWord · highlightAyah · keys',
    swatches: ['rgba(214,170,80,.45)', '#c2410c'],
  },
  {
    href: '/use-cases/bookmarks',
    title: 'Bookmarks',
    body: 'Tap an ayah to bookmark it with a colour tag. Highlights follow the reader across pages; the list jumps back.',
    api: 'onAyahClick · goToAyah · clearHighlight(key)',
    swatches: ['rgba(243,201,105,.8)', 'rgba(52,168,83,.55)', 'rgba(168,85,247,.5)'],
  },
]
</script>

<template>
  <div class="cases">
    <a v-for="c in CASES" :key="c.href" class="case" :href="withBase(c.href)">
      <div class="swatches">
        <span v-for="s in c.swatches" :key="s" :style="{ background: s }" />
      </div>
      <h3>{{ c.title }}</h3>
      <p>{{ c.body }}</p>
      <code>{{ c.api }}</code>
      <span class="go">Open demo →</span>
    </a>
  </div>
</template>

<style scoped>
.cases {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 20px 0;
}
.case {
  display: flex;
  flex-direction: column;
  padding: 20px 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none !important;
  transition: border-color 0.2s, transform 0.2s;
}
.case:hover { border-color: var(--vp-c-brand-1); transform: translateY(-2px); }
.swatches { display: flex; gap: 4px; margin-bottom: 12px; }
.swatches span { width: 22px; height: 8px; border-radius: 4px; }
h3 { margin: 0 0 6px !important; padding: 0 !important; border: 0 !important; font-size: 17px; font-weight: 700; color: var(--vp-c-text-1); }
p { flex: 1; margin: 0 0 12px !important; font-size: 14px; line-height: 1.6; color: var(--vp-c-text-2); }
code { align-self: flex-start; font-size: 12px !important; }
.go { margin-top: 12px; font-size: 13px; font-weight: 600; color: var(--vp-c-brand-1); }
@media (max-width: 640px) {
  .cases { grid-template-columns: minmax(0, 1fr); }
}
</style>
