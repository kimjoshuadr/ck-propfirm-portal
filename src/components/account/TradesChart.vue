<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import LineChart from '../LineChart.vue'
import { tradesFor } from '../../data/portal.js'
import { money, shortDate } from '../../lib/format.js'

/*
 * The full chart card: a working toolbar over the balance path.
 *
 * Every control does something real to the same derived data — the trade log
 * cumulated from the account's starting balance.
 *   zoom −/+   step the visible window through 30 / 14 / 7 trailing days
 *   %          express the axis as a percentage of the starting balance
 *   [ ]        hug the data (drop the objective levels from the domain)
 *   Objectives show or hide the level bands
 *   Trades     per-trade path  ·  Daily  session closes
 */
const props = defineProps({ account: { type: Object, required: true } })

const WINDOWS = [
  { days: null, label: 'All' },
  { days: 30, label: '30D' },
  { days: 14, label: '14D' },
  { days: 7, label: '7D' },
]

const win = ref(0)
const asPct = ref(false)
const hug = ref(false)
const showObjectives = ref(true)
const mode = ref('trades')

const log = computed(() => [...tradesFor(props.account.number)].reverse())
const allDates = computed(() => [...new Set(log.value.map((t) => t.date))])
const windowDays = computed(() => WINDOWS[win.value].days)
const dates = computed(() => (windowDays.value ? allDates.value.slice(-windowDays.value) : allDates.value))
const inWindow = computed(() => new Set(dates.value))
const visible = computed(() => log.value.filter((t) => inWindow.value.has(t.date)))

const round2 = (n) => Math.round(n * 100) / 100

/* The path starts where the window starts, so a 7-day view does not pretend
   the account began 7 days ago. */
const base = computed(() => {
  const first = dates.value[0]
  const before = log.value.filter((t) => t.date < first).reduce((s, t) => s + t.pnl, 0)
  return round2(props.account.size + before)
})

const series = computed(() => {
  let balance = base.value
  if (mode.value === 'daily') {
    return dates.value.map((d) => {
      balance = round2(balance + visible.value.filter((t) => t.date === d).reduce((s, t) => s + t.pnl, 0))
      return balance
    })
  }
  return visible.value.map((t) => (balance = round2(balance + t.pnl)))
})

/* The equity chip only earns its place when it is not on top of the starting
   balance — otherwise two chips sit on the same line. */
const documentsEquity = computed(() =>
  Math.abs(props.account.equity - props.account.size) > props.account.size * 0.005)

const levels = computed(() => {
  const a = props.account
  const list = []
  if (a.profitTarget) list.push({ label: 'Profit target', value: a.size + a.profitTarget, tone: 'good' })
  list.push({ label: 'Starting balance', value: a.size, tone: 'info' })
  if (documentsEquity.value) list.push({ label: 'Equity', value: a.equity, tone: 'muted' })
  list.push({ label: 'Max daily loss', value: a.size - a.dailyLoss, tone: 'bad' })
  return list.map((l) => ({ ...l, shown: asPct.value ? pctOf(l.value) : l.value }))
})


const pctOf = (value) => round2(((value - props.account.size) / props.account.size) * 100)
const shown = (value) => (asPct.value ? pctOf(value) : value)

const domain = computed(() => {
  const values = [base.value, ...series.value.map((v) => v)]
  if (!hug.value && showObjectives.value) values.push(...levels.value.map((l) => l.value))
  if (!hug.value) values.push(base.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max(1, (max - min) * 0.08)
  return [shown(min - pad), shown(max + pad)]
})

const axis = computed(() => {
  const [min, max] = domain.value
  return [max, min + (max - min) * 0.66, min + (max - min) * 0.33, min]
})

/* Labels sit on the right edge so they never fight the level chips on the
   left. */
const topOf = (value) => {
  const [min, max] = domain.value
  return `${(((max - value) / (max - min || 1)) * 100).toFixed(2)}%`
}

const label = (value) => (asPct.value ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : money(value))

const BOX = 340
const placed = computed(() => {
  const [min, max] = domain.value
  const span = max - min || 1
  const rows = levels.value
    .filter(() => showObjectives.value)
    .sort((a, b) => b.shown - a.shown)
    .map((l) => ({ ...l, y: ((max - l.shown) / span) * BOX, tagY: 0 }))
  let floor = -Infinity
  rows.forEach((r) => { r.tagY = Math.max(r.y, floor + 26); floor = r.tagY })
  const over = rows.length ? rows[rows.length - 1].tagY - BOX : 0
  if (over > 0) rows.forEach((r) => { r.tagY -= over })
  return rows
})

const atNewest = computed(() => win.value === 0)
const atOldest = computed(() => win.value === WINDOWS.length - 1)
const zoom = (dir) => { if (dir < 0 && !atNewest.value) win.value -= 1; if (dir > 0 && !atOldest.value) win.value += 1 }
</script>

<template>
  <section class="panel" data-od-id="account-chart">
    <div class="chart-tools">
      <div class="chart-tools__icons">
        <button type="button" class="tool" :disabled="atNewest" aria-label="Zoom in" @click="zoom(-1)">
          <AppIcon name="zoomIn" :size="16" />
        </button>
        <button type="button" class="tool" :disabled="atOldest" aria-label="Zoom out" @click="zoom(1)">
          <AppIcon name="zoomOut" :size="16" />
        </button>
        <button type="button" class="tool" :class="{ 'is-on': asPct }" :aria-pressed="asPct" aria-label="Percentage axis" @click="asPct = !asPct">
          <AppIcon name="percent" :size="16" />
        </button>
        <button type="button" class="tool" :class="{ 'is-on': hug }" :aria-pressed="hug" aria-label="Fit to data" @click="hug = !hug">
          <AppIcon name="fit" :size="16" />
        </button>
      </div>

      <span class="chart-tools__group">
        <span class="chart-tools__label">Objectives:</span>
        <label class="switch">
          <input type="checkbox" :checked="showObjectives" aria-label="Show objective levels" @change="showObjectives = !showObjectives" />
          <span class="switch__track"></span>
        </label>
      </span>

      <span class="chart-tools__group chart-tools__group--end">
        <span class="chart-tools__label">Chart:</span>
        <div class="seg">
          <button type="button" class="seg__btn" :class="{ 'is-on': mode === 'trades' }" :aria-pressed="mode === 'trades'" @click="mode = 'trades'">
            <AppIcon name="candles" :size="14" />Trades
          </button>
          <button type="button" class="seg__btn" :class="{ 'is-on': mode === 'daily' }" :aria-pressed="mode === 'daily'" @click="mode = 'daily'">
            <AppIcon name="layers" :size="14" />Daily
          </button>
        </div>
      </span>
    </div>

    <div class="chart-frame">
      <div class="chart-plot">
        <LineChart :values="series" :domain="domain" :pad="0" :view-box-height="100" :tone="account.status === 'breached' ? 'red' : 'violet'" uid="acct-trades" />

        <span class="chart-dot" :style="{ top: topOf(shown(series.length ? series[series.length - 1] : base)) }" aria-hidden="true"></span>

        <div class="band-chart__levels">
          <div
            v-for="l in placed"
            :key="l.label"
            class="band-chart__level"
            :class="`band-chart__level--${l.tone}`"
            :style="{ top: `${l.y.toFixed(1)}px` }"
          >
            <span class="band-chart__tag" :style="{ top: `${(l.tagY - l.y).toFixed(1)}px` }">
              {{ label(l.shown) }} · {{ l.label }}
            </span>
          </div>
        </div>

        <div class="chart-axis">
          <span v-for="v in axis" :key="v" :style="{ top: topOf(v) }">{{ label(v) }}</span>
        </div>
      </div>

      <div class="chart-foot">
        <span>{{ shortDate(dates[0]) }}</span>
        <span class="chart-foot__hint">
          {{ WINDOWS[win].label }} · {{ mode === 'trades' ? `${visible.length} trades` : `${dates.length} sessions` }}
        </span>
        <span>{{ shortDate(dates[dates.length - 1]) }}</span>
      </div>
    </div>
  </section>
</template>
