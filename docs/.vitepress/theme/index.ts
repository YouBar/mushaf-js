import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import 'mushaf.js/styles'
import './style.css'

import HomePage from './components/HomePage.vue'
import Playground from './components/Playground.vue'
import MemorizationDemo from './components/MemorizationDemo.vue'
import SelectionDemo from './components/SelectionDemo.vue'
import FollowAlongDemo from './components/FollowAlongDemo.vue'
import BookmarksDemo from './components/BookmarksDemo.vue'
import UseCaseCards from './components/UseCaseCards.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
    app.component('Playground', Playground)
    app.component('MemorizationDemo', MemorizationDemo)
    app.component('SelectionDemo', SelectionDemo)
    app.component('FollowAlongDemo', FollowAlongDemo)
    app.component('BookmarksDemo', BookmarksDemo)
    app.component('UseCaseCards', UseCaseCards)
  },
} satisfies Theme
