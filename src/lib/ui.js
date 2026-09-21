import { reactive } from 'vue'

/*
 * Toast store. Module-level reactive state, so any component can push a toast
 * and the single <ToastStack> in App.vue renders it.
 */

let seq = 0
export const toasts = reactive([])

const GLYPH = { good: 'check', warn: 'alert', bad: 'close', info: 'spark' }

export function pushToast({ tone = 'info', title, msg, ms = 4200 } = {}) {
  const id = ++seq
  toasts.push({ id, tone, glyph: GLYPH[tone] || 'spark', title, msg })
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id)
    if (i > -1) toasts.splice(i, 1)
  }, ms)
}
