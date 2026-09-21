<script setup>
import AppIcon from '../AppIcon.vue'
import LineChart from '../LineChart.vue'
import { EQUITY_CURVE } from '../../data/portal.js'

/* Promo copy on the canvas — no card, one glow, the curve bleeding off the
   right edge. The backdrop is this account's own balance series, not a quote. */
const series = EQUITY_CURVE.map((p) => p.v)
</script>

<template>
  <section class="floor" data-od-id="overview-trading-floor">
    <span class="floor__glow" aria-hidden="true"></span>
    <span class="floor__chart" aria-hidden="true">
      <LineChart :values="series" tone="violet" uid="floor" :view-box-height="90" />
    </span>

    <span class="floor__chip"><span class="badge__dot"></span>FPT Learn · free</span>
    <h3 class="floor__title">Learn the way prop firms test you</h3>
    <p class="floor__sub">Drawdown control, consistency rules and challenge psychology — the four pillars every challenge measures, taught from funded trader experience.</p>
    <div class="floor__actions">
      <a class="btn btn--ghost" href="#learn">
        <AppIcon name="book" :size="16" />Open FPT Learn
      </a>
    </div>
  </section>
</template>
