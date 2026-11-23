import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

const core = (p: string) => fileURLToPath(new URL(`../../packages/core/${p}`, import.meta.url))

export default defineConfig({
  title: 'mushaf.js',
  description: 'Render the Madani Mushaf in any web page, with word, ayah and surah level interaction.',
  cleanUrls: true,
  lastUpdated: true,
  // _-prefixed files are notes, not pages.
  srcExclude: ['**/_*.md'],

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#1a1917' }],
    ['meta', { property: 'og:title', content: 'mushaf.js' }],
    ['meta', { property: 'og:description', content: 'An interactive Madani Mushaf for the web: 604 pages, word-level clicks, highlights and range selection.' }],
    // The demos load page data and fonts from the CDN; warm the connection.
    ['link', { rel: 'preconnect', href: 'https://cdn.mushafjs.com', crossorigin: '' }],
    // The honorifics ﷺ and ﷻ, drawn in Amiri everywhere (system fonts differ or lack them); loads only those two glyphs.
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Amiri&text=%EF%B7%BA%EF%B7%BB&display=swap' }],
  ],

  vite: {
    resolve: {
      // Demos import the library source, so the site always shows the current code.
      alias: [
        { find: /^mushaf\.js\/styles$/, replacement: core('styles/mushaf.css') },
        { find: /^mushaf\.js$/, replacement: core('src/index.ts') },
      ],
    },
  },

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Docs', link: '/getting-started', activeMatch: '^/(?!demo|use-cases)' },
      { text: 'Use cases', link: '/use-cases/', activeMatch: '^/use-cases/' },
      { text: 'Playground', link: '/demo' },
      { text: 'API', link: '/api-reference' },
    ],

    sidebar: {
      '/use-cases/': [
        {
          text: 'Use cases',
          items: [
            { text: 'Overview', link: '/use-cases/' },
            { text: 'Memorization tracker', link: '/use-cases/memorization-tracker' },
            { text: 'Assigning ranges', link: '/use-cases/assigning-ranges' },
            { text: 'Recitation follow-along', link: '/use-cases/follow-along' },
            { text: 'Bookmarks', link: '/use-cases/bookmarks' },
          ],
        },
        { text: 'Playground', link: '/demo' },
      ],
      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Preface', link: '/preface' },
            { text: 'What is mushaf.js?', link: '/introduction' },
            { text: 'Getting started', link: '/getting-started' },
            { text: 'Configuration', link: '/configuration' },
            { text: 'API reference', link: '/api-reference' },
          ],
        },
        {
          text: 'Guides',
          items: [
            { text: 'Navigation', link: '/navigation' },
            { text: 'Highlighting', link: '/highlighting' },
            { text: 'Events', link: '/events' },
            { text: 'Fonts', link: '/fonts' },
            { text: 'Data', link: '/data' },
          ],
        },
        {
          text: 'Frameworks',
          items: [
            { text: 'Vue', link: '/vue' },
            { text: 'TypeScript', link: '/examples/typescript' },
            { text: 'Vanilla JS', link: '/examples/vanilla-js' },
          ],
        },
        {
          text: 'Use cases',
          collapsed: true,
          items: [
            { text: 'Memorization tracker', link: '/use-cases/memorization-tracker' },
            { text: 'Assigning ranges', link: '/use-cases/assigning-ranges' },
            { text: 'Recitation follow-along', link: '/use-cases/follow-along' },
            { text: 'Bookmarks', link: '/use-cases/bookmarks' },
            { text: 'Playground', link: '/demo' },
          ],
        },
      ],
    },

    search: { provider: 'local' },

    socialLinks: [{ icon: 'github', link: 'https://github.com/YouBar/mushaf-js' }],

    editLink: {
      pattern: 'https://github.com/YouBar/mushaf-js/edit/develop/docs/:path',
      text: 'Edit this page on GitHub',
    },

    outline: { level: [2, 3] },

    footer: {
      message: 'Qur’an data from <a href="https://qul.tarteel.ai/">QUL — Quranic Universal Library</a> by Tarteel. QPC V2 fonts © King Fahd Glorious Qur’an Printing Complex.',
      copyright: 'mushaf.js',
    },
  },
})
