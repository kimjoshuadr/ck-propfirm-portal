<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { ACCOUNTS, NAV, PAGES, toggleSidebar } from '../lib/portal.js'
import { accountHref } from '../lib/router.js'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const query = ref('')
const cursor = ref(0)
const inputRef = ref(null)

function go(href) {
  window.location.href = href
}

/* Jump-to index: every page, every submenu leaf, actions and accounts. */
const pageMeta = {}
NAV.forEach((group) => group.items.forEach((item) => {
  if (item.children) {
    item.children.forEach((child) => {
      if (!pageMeta[child.page]) pageMeta[child.page] = { href: child.href, icon: item.icon }
    })
  } else {
    pageMeta[item.key] = { href: item.href, icon: item.icon }
  }
}))

const entries = []
const seen = new Set()

Object.entries(PAGES).forEach(([key, page]) => {
  const meta = pageMeta[key] || { href: '#overview', icon: 'spark' }
  seen.add(meta.href)
  entries.push({ label: page.title, hint: page.root.toLowerCase(), icon: meta.icon, run: () => go(meta.href) })
})

NAV.forEach((group) => group.items.forEach((item) => {
  if (!item.children) return
  item.children.forEach((child) => {
    if (seen.has(child.href)) return
    seen.add(child.href)
    entries.push({ label: child.label, hint: item.label.toLowerCase(), icon: item.icon, run: () => go(child.href) })
  })
}))

entries.push({ label: 'Sign out', hint: 'session', icon: 'logout', run: () => go('#login') })
entries.push({ label: 'Toggle sidebar', hint: 'layout', icon: 'menu', run: () => toggleSidebar() })
ACCOUNTS.forEach((a) => entries.push({
  label: `Account ${a.number} · ${a.label}`, hint: a.status, icon: 'accounts', run: () => go(accountHref(a.number)),
}))

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? entries.filter((e) => e.label.toLowerCase().includes(q)) : entries
})

watch(results, () => { cursor.value = 0 })

watch(() => props.open, (open) => {
  if (!open) return
  query.value = ''
  cursor.value = 0
  nextTick(() => inputRef.value?.focus())
})

function onKeydown(event) {
  if (event.key === 'ArrowDown') {
    cursor.value = Math.min(results.value.length - 1, cursor.value + 1)
    event.preventDefault()
  } else if (event.key === 'ArrowUp') {
    cursor.value = Math.max(0, cursor.value - 1)
    event.preventDefault()
  } else if (event.key === 'Enter') {
    results.value[cursor.value]?.run()
    emit('close')
  } else if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <div class="palette" :class="{ 'is-on': open }" @click.self="emit('close')">
    <div class="palette__box" role="dialog" aria-modal="true" aria-label="Command palette">
      <input
        ref="inputRef"
        v-model="query"
        class="palette__input"
        placeholder="Jump to a page, account or action…"
        autocomplete="off"
        @keydown="onKeydown"
      />
      <div class="palette__list">
        <div
          v-for="(entry, index) in results"
          :key="entry.label"
          class="palette__item"
          :class="{ 'is-active': index === cursor }"
          @click="entry.run(); emit('close')"
        >
          <AppIcon :name="entry.icon" :size="17" />
          <span>{{ entry.label }}</span>
          <small>{{ entry.hint }}</small>
        </div>
        <div v-if="results.length === 0" class="empty">No matches.</div>
      </div>
    </div>
  </div>
</template>
