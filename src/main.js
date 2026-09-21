import { createApp } from 'vue'
import App from './App.vue'

// Shared design system — the static prototype's stylesheet, untouched.
import '../assets/fonts/fonts.css'
import '../assets/css/app.css'
// Bridges only: icon wrapper, in-flow menus, toast transitions.
import './styles/vue.css'
// Vue-only product styles for the ported screens — Overview and All accounts
// (every token still comes from app.css).
import './styles/product.css'

const app = createApp(App)

/*
 * Click-outside directive used by the topbar menus and the command palette.
 * A timeout keeps the opening click from immediately closing the panel.
 */
app.directive('click-outside', {
  mounted(el, binding) {
    el.__outside__ = (event) => {
      if (el.contains(event.target)) return
      /* The top bar has two menus side by side, each with this directive. Their
         toggles are inside the other's host, so without this line the first
         menu to open was closed by the second one's handler on the same click —
         which is why the user menu never appeared at all. */
      if (event.target.closest?.('.menu-host')) return
      binding.value(event)
    }
    setTimeout(() => document.addEventListener('click', el.__outside__), 0)
  },
  unmounted(el) {
    document.removeEventListener('click', el.__outside__)
    delete el.__outside__
  },
})

app.mount('#app')
