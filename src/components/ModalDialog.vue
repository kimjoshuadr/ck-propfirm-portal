<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  /* 'label' renders the heading as a small uppercase mono caption, which is
     what a date reads best as. */
  titleVariant: { type: String, default: 'default' },
})

const emit = defineEmits(['close'])
const shown = ref(false)

function requestClose() {
  shown.value = false
  setTimeout(() => emit('close'), 200)
}

function onKey(event) {
  if (event.key === 'Escape') requestClose()
}

onMounted(() => {
  requestAnimationFrame(() => { shown.value = true })
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="modal" :class="{ 'is-on': shown }" @click.self="requestClose">
    <div class="modal__box" role="dialog" aria-modal="true" :aria-label="title">
      <div class="modal__head">
        <div>
          <h3 :class="{ 'is-label': titleVariant === 'label' }">{{ title }}</h3>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
        <button class="icon-btn modal__close" aria-label="Close" @click="requestClose">
          <AppIcon name="close" :size="16" />
        </button>
      </div>
      <div class="modal__body"><slot /></div>
      <div class="modal__foot"><slot name="actions" /></div>
    </div>
  </div>
</template>
