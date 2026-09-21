<script setup>
import { computed } from 'vue'
import { iconSvg } from '../lib/icons.js'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 18 },
})

const svg = computed(() => iconSvg(props.name, props.size))
</script>

<template>
  <span class="ico" v-html="svg" />
</template>
