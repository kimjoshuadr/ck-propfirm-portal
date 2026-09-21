<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import { analyticsFor } from '../../data/portal.js'
import { signedMoney } from '../../lib/format.js'
import { duration } from '../../lib/clock.js'

const props = defineProps({ account: { type: Object, required: true } })

const stats = computed(() => analyticsFor(props.account.number))

const round2 = (n) => Math.round(n * 100) / 100

/* Hold times, sized against the longest of the five. */
const holds = computed(() => {
  const h = stats.value.hold
  const max = Math.max(h.win, h.loss, h.avg, h.best, h.worst, 1)
  return [
    { label: 'Winning trades hold time', min: h.win, tone: 'good' },
    { label: 'Losing trades hold time', min: h.loss, tone: 'bad' },
    { label: 'Average hold time', min: h.avg, tone: '' },
    { label: `Best trade (${signedMoney(stats.value.best?.pnl || 0)})`, min: h.best, tone: 'good' },
    { label: `Worst trade (${signedMoney(stats.value.worst?.pnl || 0)})`, min: h.worst, tone: 'bad' },
  ].map((r) => ({ ...r, pct: (r.min / max) * 100 }))
})

/*
 * Results by instrument / strategy.
 *
 * This was a chart: one absolutely positioned bar per group, placed with a
 * computed `left`. Past three groups the bars overlapped, the labels ran into
 * one another ("GER30NAS100GBPJPY") and the zero axis sat at 50% of the box
 * whether or not any group was negative. A table cannot collide: the dimension
 * seg picks the grouping, the metric seg picks the column that carries the bar
 * and the sort it opens on, and every numeric header sorts on click.
 */
const dimension = ref('symbol')
const metric = ref('pnl')
const sortKey = ref('pnl')
const sortDir = ref('desc')

const DIMENSIONS = [
  { key: 'symbol', label: 'Instrument' },
  { key: 'tag', label: 'Strategy' },
]
const METRICS = [
  { key: 'pnl', label: 'Net PnL' },
  { key: 'trades', label: '# Trades' },
  { key: 'winRate', label: 'Win rate' },
]
const COLUMNS = [
  { key: 'trades', label: '# Trades' },
  { key: 'pnl', label: 'Net P&L' },
  { key: 'winRate', label: 'Win rate' },
  { key: 'avgWin', label: 'Avg win' },
  { key: 'avgLoss', label: 'Avg loss' },
]

/* The seg is the default sort; a header click overrides it without taking the
   bar away from the metric that is selected. */
function pickMetric(key) {
  metric.value = key
  sortKey.value = key
  sortDir.value = 'desc'
}

function sortBy(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
    return
  }
  sortKey.value = key
  sortDir.value = key === 'avgLoss' ? 'asc' : 'desc'
}

const rows = computed(() => {
  const map = new Map()
  stats.value.trades.forEach((t) => {
    const key = dimension.value === 'symbol' ? t.symbol : t.tag
    if (!map.has(key)) map.set(key, { label: key, trades: 0, pnl: 0, wins: 0, losses: 0, grossWin: 0, grossLoss: 0 })
    const g = map.get(key)
    g.trades += 1
    g.pnl = round2(g.pnl + t.pnl)
    if (t.pnl > 0) { g.wins += 1; g.grossWin = round2(g.grossWin + t.pnl) } else { g.losses += 1; g.grossLoss = round2(g.grossLoss + t.pnl) }
  })
  const list = [...map.values()].map((g) => ({
    ...g,
    winRate: g.trades ? Math.round((g.wins / g.trades) * 1000) / 10 : 0,
    avgWin: g.wins ? round2(g.grossWin / g.wins) : 0,
    avgLoss: g.losses ? round2(g.grossLoss / g.losses) : 0,
  }))
  const dir = sortDir.value === 'asc' ? 1 : -1
  return list.sort((a, b) => (a[sortKey.value] - b[sortKey.value]) * dir)
})

/* Every bar in the chosen column is drawn against that column's own peak, so
   the longest bar is the biggest mover whatever the metric happens to be. */
const barMax = computed(() => Math.max(...rows.value.map((r) => Math.abs(r[metric.value])), 1))
const barPct = (v) => Math.max(2, (Math.abs(v) / barMax.value) * 100)
const barTone = (key, v) => (key === 'pnl' ? (v >= 0 ? 'win' : 'loss') : 'neutral')

const format = (key, v) => {
  if (key === 'trades') return `${v}`
  if (key === 'winRate') return `${v.toFixed(1)}%`
  return signedMoney(v)
}
const tone = (key, v) => (key === 'trades' || key === 'winRate' ? '' : v >= 0 ? 'up' : 'down')
const sortState = (key) => (sortKey.value === key ? (sortDir.value === 'asc' ? 'ascending' : 'descending') : undefined)

/* Sums the rows back up, so the footnote is the table's own total and can be
   checked against the account's closed-trade P&L. */
const totals = computed(() => ({
  groups: rows.value.length,
  trades: rows.value.reduce((t, r) => t + r.trades, 0),
  pnl: round2(rows.value.reduce((t, r) => t + r.pnl, 0)),
}))
</script>

<template>
  <div class="ov" data-od-id="account-analytics">
    <div class="acc-cols acc-cols--even">
      <section class="panel">
        <div class="panel__head"><span class="panel__title">Ticket size</span></div>
        <div class="table-wrap">
          <table class="data" style="min-width:520px">
            <thead>
              <tr><th>Ticket size</th><th class="num"># Trades</th><th class="num">Net PnL</th><th class="num">Win rate</th><th class="num">Avg PnL / trade</th></tr>
            </thead>
            <tbody>
              <tr v-for="b in stats.byTicket" :key="b.label">
                <td class="cell-strong">{{ b.label }}</td>
                <td class="num">{{ b.trades }}</td>
                <td class="num"><span :class="b.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(b.pnl) }}</span></td>
                <td class="num">{{ b.winRate }}%</td>
                <td class="num"><span :class="b.avgPnl >= 0 ? 'up' : 'down'">{{ signedMoney(b.avgPnl) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel__head">
          <span class="panel__title">Trade duration</span>
          <span class="panel__actions stat-card__foot">Longest hold {{ duration(stats.hold.longest) }}</span>
        </div>
        <div style="padding:18px">
          <div class="bar-list">
            <div v-for="r in holds" :key="r.label" class="bar-list__row">
              <div class="bar-list__top">
                <span>{{ r.label }}</span>
                <b :class="r.tone">{{ duration(r.min) }}</b>
              </div>
              <div class="meter" :class="r.tone ? `meter--${r.tone}` : ''">
                <i :style="{ width: `${r.pct.toFixed(1)}%` }"></i>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="panel">
      <div class="panel__head">
        <span class="panel__title">Results by {{ dimension === 'symbol' ? 'instrument' : 'strategy' }}</span>
        <div class="panel__actions">
          <div class="seg" role="tablist" aria-label="Group results by">
            <button
              v-for="d in DIMENSIONS"
              :key="d.key"
              type="button"
              class="seg__btn"
              :class="{ 'is-on': dimension === d.key }"
              role="tab"
              :aria-selected="dimension === d.key"
              @click="dimension = d.key"
            >{{ d.label }}</button>
          </div>
          <div class="seg" role="tablist" aria-label="Chart encoding">
            <button
              v-for="m in METRICS"
              :key="m.key"
              type="button"
              class="seg__btn"
              :class="{ 'is-on': metric === m.key }"
              role="tab"
              :aria-selected="metric === m.key"
              @click="pickMetric(m.key)"
            >{{ m.label }}</button>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table v-if="rows.length" class="data data--bars" style="min-width:860px">
          <thead>
            <tr>
              <th>{{ dimension === 'symbol' ? 'Instrument' : 'Strategy' }}</th>
              <th
                v-for="c in COLUMNS"
                :key="c.key"
                class="num is-sortable"
                :aria-sort="sortState(c.key)"
                :title="`Sort by ${c.label}`"
                @click="sortBy(c.key)"
              >
                <span class="th-sort">{{ c.label }}<AppIcon v-if="sortKey === c.key" :name="sortDir === 'asc' ? 'arrowUp' : 'arrowDown'" :size="12" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.label">
              <td class="cell-strong">{{ r.label }}</td>
              <td
                v-for="c in COLUMNS"
                :key="c.key"
                class="num"
                :class="[tone(c.key, r[c.key]), { 'has-bar': metric === c.key }]"
              >
                <span
                  v-if="metric === c.key"
                  class="cell-bar"
                  :class="`cell-bar--${barTone(c.key, r[c.key])}`"
                  aria-hidden="true"
                ><i :style="{ width: `${barPct(r[c.key])}%` }"></i></span>
                <span class="cell-val">{{ format(c.key, r[c.key]) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">No closed trades on this account yet.</p>
      </div>

      <div v-if="rows.length" class="panel__foot">
        <span>
          {{ totals.groups }} {{ dimension === 'symbol' ? (totals.groups === 1 ? 'instrument' : 'instruments') : (totals.groups === 1 ? 'strategy' : 'strategies') }}
          · {{ totals.trades }} closed trades · net
          <b :class="totals.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(totals.pnl) }}</b>
        </span>
      </div>
    </section>
  </div>
</template>
