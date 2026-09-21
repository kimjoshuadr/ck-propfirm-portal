<script setup>
import { computed, watch } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { pushToast } from '../lib/ui.js'
import { route } from '../lib/router.js'

/*
 * Account · Support and FAQ.
 *
 * Both are redirections, and the reference draws them that way: a title, a line
 * under it, and one card with a mark, a heading, a sentence and a button that
 * opens the real thing. On the live portal that button leaves for the help
 * centre; this prototype has nowhere to go, so it says where it would go.
 *
 * The support desk and the ticket form that used to live here are gone with the
 * room — anything a trader needs answered is answered on the far side of these
 * two buttons.
 */
const SUPPORT_URL = 'support.ckpropfirm.com'
const FAQ_URL = 'ckpropfirm.com/faq'

const SECTIONS = {
  support: {
    key: 'support',
    title: 'Support',
    subtitle: 'Get help and contact our support team.',
    icon: 'headset',
    cardTitle: 'Support',
    cardBody: 'Reach our customer support team for help with your account.',
    cta: 'Open support',
    where: SUPPORT_URL,
  },
  faq: {
    key: 'faq',
    title: 'FAQ',
    subtitle: 'Answers to the most common questions.',
    icon: 'help',
    cardTitle: 'FAQ',
    cardBody: 'Browse answers to the questions we hear most often.',
    cta: 'Open FAQ',
    where: FAQ_URL,
  },
}

const tab = computed(() => (route.tab === 'faq' ? 'faq' : 'support'))
const section = computed(() => SECTIONS[tab.value])

/* The two sections are links, so the hash is the state — nothing to store. */
watch(() => route.tab, () => {}, { immediate: true })

function open() {
  pushToast({
    tone: 'info',
    title: section.value.cta,
    msg: `The live portal opens ${section.value.where} — this prototype keeps you inside it.`,
  })
}
</script>

<template>
  <div class="ov" data-od-id="help-page">
    <div class="page-head util-head" data-od-id="page-head-help">
      <div class="page-head__text">
        <div class="eyebrow">Account · Help</div>
        <h1>{{ section.title }}</h1>
        <p class="dim">{{ section.subtitle }}</p>
      </div>
    </div>

    <section class="panel hls-card" :data-od-id="`help-${section.key}`">
      <span class="hls-card__mark"><AppIcon :name="section.icon" :size="24" /></span>
      <h2 class="hls-card__title">{{ section.cardTitle }}</h2>
      <p class="hls-card__body">{{ section.cardBody }}</p>
      <button class="btn btn--ghost" :data-od-id="`help-open-${section.key}`" @click="open">
        <AppIcon name="external" :size="15" />{{ section.cta }}
      </button>
    </section>
  </div>
</template>
