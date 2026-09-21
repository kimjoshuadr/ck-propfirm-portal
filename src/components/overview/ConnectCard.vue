<script setup>
import AppIcon from '../AppIcon.vue'
import { pushToast } from '../../lib/ui.js'

/* External hand-offs stay in the prototype: this build moves no data out, so
   the button confirms instead of deep-linking to a channel we do not own. */
const props = defineProps({
  image: { type: String, required: true },
  imageAlt: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  barLabel: { type: String, required: true },
  ctaLabel: { type: String, required: true },
  ctaIcon: { type: String, default: 'external' },
  title: { type: String, required: true },
  copy: { type: String, required: true },
  toast: { type: String, required: true },
  odId: { type: String, required: true },
})

function handoff() {
  pushToast({ tone: 'info', title: props.ctaLabel, msg: props.toast })
}
</script>

<template>
  <section class="connect" :data-od-id="odId">
    <div class="connect__media">
      <img :src="image" :width="width" :height="height" :alt="imageAlt" />
    </div>

    <div class="connect__body">
      <h2 class="connect__title">{{ title }}</h2>
      <p class="connect__copy">{{ copy }}</p>
    </div>

    <div class="connect__bar">
      <span>{{ barLabel }}</span>
      <button type="button" class="btn btn--ghost btn--sm" @click="handoff">
        <AppIcon :name="ctaIcon" :size="15" />{{ ctaLabel }}
      </button>
    </div>
  </section>
</template>
