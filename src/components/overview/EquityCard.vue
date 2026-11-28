<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import LineChart from '../LineChart.vue'
import { activeAccount } from '../../lib/portal.js'
import { money } from '../../lib/format.js'

/* The curve is the active account's own equity snapshots from the API (the
   account card's spark), so the chart and the number above it come from the
   same place. The dashed line is the account's starting balance. */
const account = computed(() => activeAccount.value || null)
const series = computed(() => (account.value?.spark?.length ? account.value.spark : [0, 0]))
const start = computed(() => series.value[0] ?? 0)
</script>

<template>
  <div class="kpi" data-od-id="overview-equity">
    <div class="kpi__head">
      <span class="kpi__dot" aria-hidden="true"></span>
      <span class="kpi__label">Equity</span>
      <span v-if="account" class="kpi__info" :title="`Simulated equity on ${account.label}, marked to the last session close.`" aria-hidden="true">
        <AppIcon name="info" :size="15" />
      </span>
    </div>

    <template v-if="account">
      <p class="kpi__balance">Balance: {{ money(account.balance) }}</p>

      <div class="kpi__value-row">
        <span class="kpi__rail" aria-hidden="true"></span>
        <span class="kpi__value">{{ money(account.equity) }}</span>
      </div>

      <div class="kpi__chart">
        <LineChart :values="series" :baseline="start" uid="equity" tone="violet" :view-box-height="120" />
      </div>
    </template>
    <p v-else class="kpi__balance">No account yet — a funded account appears here once it is provisioned.</p>
  </div>
</template>
