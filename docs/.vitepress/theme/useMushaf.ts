import { onBeforeUnmount, onMounted, ref, shallowRef, watch, type Ref } from 'vue'
import { useData } from 'vitepress'
import { Mushaf, type MushafConfig } from 'mushaf.js'

/**
 * Mounts a Mushaf into `el` on the client only (the library touches the DOM,
 * so it must not run during the static build), follows the site's dark mode
 * and destroys the instance on unmount.
 */
export function useMushaf(
  el: Ref<HTMLElement | null>,
  config: Omit<MushafConfig, 'container'> = {},
  startPage = 1,
) {
  const mushaf = shallowRef<Mushaf | null>(null)
  const page = ref(startPage)
  const ready = ref(false)
  const error = ref<string | null>(null)
  const { isDark } = useData()

  onMounted(async () => {
    try {
      if (!el.value) return
      const m = new Mushaf({
        container: el.value,
        // Several demos can share one page; only the playground uses arrow keys.
        keyboardNavigation: false,
        theme: isDark.value ? 'dark' : 'light',
        ...config,
        onPageChange: (p) => {
          page.value = p
          config.onPageChange?.(p)
        },
      })
      mushaf.value = m
      await m.init()
      await m.renderPage(startPage)
      ready.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error(err)
    }
  })

  watch(isDark, (dark) => mushaf.value?.setTheme(dark ? 'dark' : 'light'))

  onBeforeUnmount(() => {
    mushaf.value?.destroy()
    mushaf.value = null
  })

  return { mushaf, page, ready, error }
}

/** "78:5:4" style label for a word reference. */
export const refLabel = (r: { surah: number; ayah: number; word: number }) => `${r.surah}:${r.ayah}:${r.word}`
