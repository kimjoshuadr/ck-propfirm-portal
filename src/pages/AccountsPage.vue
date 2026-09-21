<script setup>
import { ref, watch } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import AccountsCarousel from '../components/overview/AccountsCarousel.vue'
import AccountsTable from '../components/accounts/AccountsTable.vue'
import CertificatesPanel from '../components/accounts/CertificatesPanel.vue'
import { route } from '../lib/router.js'
import { pushToast } from '../lib/ui.js'

/*
 * All accounts — the same rail the Overview uses, then tabs over the three
 * views. The tab is seeded from the route so the nav's Favorites and
 * Certificates entries deep-link here, and switching in place keeps the hash
 * honest without a reload.
 */
const TABS = [
  { key: 'all', label: 'All accounts' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'certificates', label: 'Certificates' },
]

const tab = ref(TABS.some((t) => t.key === route.tab) ? route.tab : 'all')

/* The sidebar's Favorites and Certificates entries jump by hash, which swaps
   the page in place — so follow the route when it changes underneath us. */
watch(() => route.tab, (next) => {
  if (TABS.some((t) => t.key === next)) tab.value = next
})

function exportCsv() {
  pushToast({
    tone: 'info',
    title: 'Export CSV',
    msg: 'The live portal writes the filtered table to a file; this prototype keeps everything on-screen.',
  })
}

function select(key) {
  tab.value = key
  const hash = key === 'all' ? '#accounts' : `#accounts/${key}`
  history.replaceState(null, '', `${location.pathname}${hash}`)
}
</script>

<template>
  <div class="ov">
    <div class="page-head util-head" data-od-id="page-head-accounts">
      <div class="page-head__text">
        <div class="eyebrow">Main · Accounts</div>
        <h1>All accounts</h1>
        <p class="dim">
          Every evaluation, verification and funded account you hold. Open a card or a row to see that
          account's objectives, trades and calendar — the figures below the table follow your filters.
        </p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--ghost" @click="exportCsv">
          <AppIcon name="download" :size="15" />Export CSV
        </button>
      </div>
    </div>

    <AccountsCarousel :show-all-tile="false" />

    <section class="ov__zone" data-od-id="accounts-view">
      <div class="tabs" role="tablist" aria-label="Account views">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          class="tab"
          role="tab"
          :aria-selected="tab === t.key"
          :data-od-id="`accounts-tab-${t.key}`"
          @click="select(t.key)"
        >{{ t.label }}</button>
      </div>

      <div v-if="tab === 'all'" role="tabpanel">
        <AccountsTable />
      </div>

      <div v-else-if="tab === 'favorites'" role="tabpanel">
        <AccountsTable
          favorites-only
          od-id="favorites-table"
          empty-title="No favorites yet"
          empty-hint="Tap the star on any account card or row to pin it here."
        />
      </div>

      <CertificatesPanel v-else role="tabpanel" />
    </section>
  </div>
</template>
