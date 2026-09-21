<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import { FAQS } from '../../data/portal.js'

/* The search is real: it filters the knowledge base entries this prototype
   actually has, and each hit links to the FAQ section. */
const query = ref('')

const hits = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return FAQS.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q)).slice(0, 4)
})

const searching = computed(() => query.value.trim().length > 0)
</script>

<template>
  <section class="panel" data-od-id="overview-help">
    <div class="help">
      <span class="help__icon" aria-hidden="true"><AppIcon name="help" :size="22" /></span>
      <h3 class="help__title">Hey, need any help?</h3>
      <p class="help__sub">Browse the knowledge base and FAQs, or reach support directly for account-specific questions.</p>

      <label class="help__search">
        <AppIcon name="search" :size="16" />
        <input
          v-model="query"
          type="search"
          placeholder="Search our knowledge base…"
          aria-label="Search the knowledge base"
        />
      </label>

      <div v-if="searching" class="help__results">
        <a v-for="f in hits" :key="f.q" class="help__result" href="#help/faq">
          <b>{{ f.q }}</b>
          <span>{{ f.a }}</span>
        </a>
        <p v-if="!hits.length" class="help__sub" style="text-align:left">
          No match in the knowledge base — email support and we will answer directly.
        </p>
      </div>

      <div v-else class="help__pills">
        <a class="btn btn--ghost btn--sm" href="mailto:support@ckpropfirm.com">
          <AppIcon name="external" :size="15" />support@ckpropfirm.com
        </a>
        <a class="btn btn--ghost btn--sm" href="#help/support">
          <AppIcon name="users" :size="15" />Chat with us now
        </a>
      </div>
    </div>
  </section>
</template>
