<script setup>
import { toasts } from '../lib/ui.js'
import AppIcon from './AppIcon.vue'
</script>

<template>
  <TransitionGroup name="toast" tag="div" class="toasts">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast--${t.tone}`">
      <span class="toast__icon"><AppIcon :name="t.glyph" :size="18" /></span>
      <div>
        <div class="toast__title">{{ t.title }}</div>
        <div v-if="t.msg" class="toast__msg">{{ t.msg }}</div>
      </div>
    </div>
  </TransitionGroup>
</template>
