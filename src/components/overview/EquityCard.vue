<script setup>
import AppIcon from '../AppIcon.vue'
import LineChart from '../LineChart.vue'
import { EQUITY_CURVE } from '../../data/portal.js'
import { activeAccount } from '../../lib/portal.js'
import { money } from '../../lib/format.js'

/* The dashed line is this account's starting balance, so the curve reads
   against where the evaluation began rather than an arbitrary zero. */
const start = EQUITY_CURVE[0].v
const series = EQUITY_CURVE.map((p) => p.v)
</script>

<template>
  <div class="kpi" data-od-id="overview-equity">
    <div class="kpi__head">
      <span class="kpi__dot" aria-hidden="true"></span>
      <span class="kpi__label">Equity</span>
      <span class="kpi__info" :title="`Simulated equity on ${activeAccount.label}, marked to the last session close.`" aria-hidden="true">
        <AppIcon name="info" :size="15" />
      </span>
    </div>

    <p class="kpi__balance">Balance: {{ money(activeAccount.balance) }}</p>

    <div class="kpi__value-row">
      <span class="kpi__rail" aria-hidden="true"></span>
      <span class="kpi__value">{{ money(activeAccount.equity) }}</span>
    </div>

    <div class="kpi__chart">
      <LineChart :values="series" :baseline="start" uid="equity" tone="violet" :view-box-height="120" />
    </div>
  </div>
</template>
