<script setup>
import AppIcon from '../AppIcon.vue'
import LineChart from '../LineChart.vue'

/*
 * Promo copy on the canvas — no card, one glow, the curve bleeding off the
 * right edge. The backdrop keeps the demo equity series: it decorates the
 * Learn pitch and matches no live account on purpose.
 */
const DEMO_SERIES = [
  100000, 100420, 100180, 100640, 100890, 101240, 100980, 101360, 101120,
  101480, 101210, 101640, 101390, 101760, 101420, 101880, 101540, 101930, 101593,
]
const series = DEMO_SERIES
</script>

<template>
  <section class="floor" data-od-id="overview-trading-floor">
    <span class="floor__glow" aria-hidden="true"></span>
    <span class="floor__chart" aria-hidden="true">
      <span class="demo-badge" style="position:absolute;top:10px;right:12px;z-index:1">Demo data</span>
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
