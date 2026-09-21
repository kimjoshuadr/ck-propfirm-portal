<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '../AppIcon.vue'
import { analyticsFor, openPositionsFor, priceAt } from '../../data/portal.js'
import { money, shortDate, signedMoney } from '../../lib/format.js'
import { duration } from '../../lib/clock.js'

const props = defineProps({ account: { type: Object, required: true } })

const stats = computed(() => analyticsFor(props.account.number))
/* The view hangs off the account route (`?view=open`), so a position or a closed
   trade can be linked to directly. */
const wantsOpen = () => (typeof location === 'undefined' ? '' : location.hash).includes('view=open')
const side = ref(wantsOpen() ? 'open' : 'closed')

watch(side, (next) => {
  const base = location.hash.split('?')[0]
  history.replaceState(null, '', `${location.pathname}${base}?view=${next}`)
})

/* Live positions carry their own marks; a breached account has none. */
const openRows = computed(() => openPositionsFor(props.account.number))



const recent = computed(() => stats.value.trades.slice(0, 20))
const longShare = computed(() => (stats.value.long.trades / Math.max(1, stats.value.count)) * 100)
const arc = (v) => `${Math.min(100, Math.max(0, v))} 100`

/* 40-odd rooms of table would run past two screens, so the list starts short
   and expands on request. */
const PREVIEW = 12
const limit = ref(PREVIEW)
const rows = computed(() => stats.value.trades.slice(0, limit.value))
</script>

<template>
  <div class="ov" data-od-id="account-trades">
    <section class="panel">
      <div class="panel__head">
        <div class="seg" role="tablist" aria-label="Trade state">
          <button type="button" class="seg__btn" :class="{ 'is-on': side === 'open' }" role="tab" :aria-selected="side === 'open'" @click="side = 'open'">Open</button>
          <button type="button" class="seg__btn" :class="{ 'is-on': side === 'closed' }" role="tab" :aria-selected="side === 'closed'" @click="side = 'closed'">Closed</button>
        </div>
        <span class="panel__actions stat-card__foot">
          <b>{{ side === 'closed' ? stats.count : openRows.length }}</b>
          {{ side === 'closed' ? 'closed trades' : (openRows.length === 1 ? 'open position' : 'open positions') }}
        </span>
      </div>

      <div class="table-wrap">
        <table v-if="side === 'closed'" class="data data--striped" style="min-width:1220px">
          <thead>
            <tr>
              <th>Open time</th><th>Close time</th><th>Symbol</th><th>Side</th><th class="num">Volume</th>
              <th class="num">Entry</th><th class="num">Exit</th><th class="num">Profit</th>
              <th class="num">Commission</th><th class="num">Net PnL</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in rows" :key="t.id">
              <td class="dim mono">{{ shortDate(t.date) }} {{ t.openedAt }}</td>
              <td class="dim mono">{{ shortDate(t.date) }} {{ t.closedAt }}</td>
              <td class="cell-strong" :title="`${t.tag} · ${duration(t.holdMin)} · ${t.r.toFixed(1)}R`">{{ t.symbol }}</td>
              <td><span class="badge" :class="t.side === 'Buy' ? 'badge--active' : 'badge--breached'">{{ t.side }}</span></td>
              <td class="num">{{ t.lots.toFixed(2) }}</td>
              <td class="num mono">{{ priceAt(t.entry, t.symbol) }}</td>
              <td class="num mono">{{ priceAt(t.exit, t.symbol) }}</td>
              <td class="num"><span :class="t.profit >= 0 ? 'up' : 'down'">{{ signedMoney(t.profit) }}</span></td>
              <td class="num dim">−{{ money(t.commission) }}</td>
              <td class="num net"><span :class="t.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(t.pnl) }}</span></td>
              <td><span class="badge">Closed</span></td>
            </tr>
          </tbody>
        </table>

        <table v-else class="data data--striped" style="min-width:1180px">
          <thead>
            <tr>
              <th>Open time</th><th>Symbol</th><th>Side</th><th class="num">Volume</th>
              <th class="num">Closed volume</th><th class="num">Entry</th><th class="num">Current price</th>
              <th class="num">Unrealized PnL</th><th class="num">Commission</th><th class="num">Net PnL</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in openRows" :key="p.id">
              <td class="dim mono">{{ shortDate(p.openedDate) }} {{ p.openedAt }}</td>
              <td class="cell-strong">{{ p.symbol }}</td>
              <td><span class="badge" :class="p.side === 'Buy' ? 'badge--active' : 'badge--breached'">{{ p.side }}</span></td>
              <td class="num">{{ p.lots.toFixed(2) }}</td>
              <td class="num dim">{{ p.closedLots.toFixed(2) }}</td>
              <td class="num mono">{{ priceAt(p.entry, p.symbol) }}</td>
              <td class="num mono">{{ priceAt(p.current, p.symbol) }}</td>
              <td class="num"><span :class="p.unrealized >= 0 ? 'up' : 'down'">{{ signedMoney(p.unrealized) }}</span></td>
              <td class="num dim">−{{ money(p.commission) }}</td>
              <td class="num net"><span :class="p.net >= 0 ? 'up' : 'down'">{{ signedMoney(p.net) }}</span></td>
              <td><span class="badge badge--active"><span class="badge__dot"></span>Open</span></td>
            </tr>
          </tbody>
        </table>
        <p v-if="side === 'open' && !openRows.length" class="empty">
          <strong>No open positions</strong>
          <template v-if="account.status === 'breached'">This account was breached, so it holds nothing open.</template>
          <template v-else>The desk has nothing live on this account right now.</template>
        </p>
      </div>

      <div v-if="side === 'closed' && stats.count > PREVIEW" class="panel__foot">
        <button type="button" class="btn btn--ghost btn--sm" @click="limit = limit === PREVIEW ? stats.count : PREVIEW">
          {{ limit === PREVIEW ? `Show all ${stats.count} trades` : `Show the latest ${PREVIEW}` }}
        </button>
      </div>
    </section>

    <p v-if="side === 'open' && openRows.length" class="trades-note">
      Equity marks these positions at the current price, which is why it differs from balance by
      {{ signedMoney(openRows.reduce((t, p) => t + p.unrealized, 0)) }}. The commission line is the round-turn cost of closing them, not
      a charge already taken.
    </p>

    <div class="acc-grid-3">
      <section class="panel stat-card">
        <div class="stat-card__head">Average profit / average loss <AppIcon name="info" :size="14" /></div>
        <div class="gauge">
          <span class="gauge__ends">
            <span class="up mono">{{ money(stats.avgWin) }}</span>
            <span class="down mono">{{ money(stats.avgLoss) }}</span>
          </span>
          <svg class="gauge__svg" viewBox="0 0 180 110" aria-hidden="true">
            <path d="M14 100 A76 76 0 0 1 166 100" fill="none" stroke="var(--sunken)" stroke-width="14" stroke-linecap="round" />
            <path d="M14 100 A76 76 0 0 1 166 100" fill="none" stroke="var(--green)" stroke-width="14" stroke-linecap="round" pathLength="100" :stroke-dasharray="arc(stats.winRate)" />
            <text x="90" y="86" text-anchor="middle" fill="var(--fg)" style="font: 800 26px var(--display)">{{ stats.winRate }}%</text>
            <text x="90" y="102" text-anchor="middle" fill="var(--muted)" style="font: 11px var(--mono); letter-spacing:.12em">WIN RATE</text>
          </svg>
        </div>
        <div class="kv-inline kv-inline--ruled">
          <div class="kv-inline__row"><span>Winning trades</span><b class="up">{{ stats.wins }}</b></div>
          <div class="kv-inline__row"><span>Losing trades</span><b class="down">{{ stats.losses }}</b></div>
          <div class="kv-inline__row"><span>Avg profit</span><b class="up">{{ money(stats.avgWin) }}</b></div>
          <div class="kv-inline__row"><span>Avg loss</span><b class="down">{{ money(stats.avgLoss) }}</b></div>
          <div class="kv-inline__row"><span>Win rate</span><b>{{ stats.winRate }}%</b></div>
        </div>
      </section>

      <section class="panel stat-card">
        <div class="stat-card__head">Long vs short performance <AppIcon name="info" :size="14" /></div>
        <div class="side-split">
          <span class="side-split__long" :style="{ width: `${longShare}%` }"></span>
          <span class="side-split__short" :style="{ width: `${100 - longShare}%` }"></span>
        </div>
        <div class="ls-table">
          <div class="ls-table__row ls-table__row--head">
            <span>{{ longShare.toFixed(0) }}% on long · {{ (100 - longShare).toFixed(0) }}% on short</span>
            <span>On long</span><span>On short</span>
          </div>
          <div class="ls-table__row"><span>No of trades</span><b>{{ stats.long.trades }}</b><b>{{ stats.short.trades }}</b></div>
          <div class="ls-table__row">
            <span>Net PnL</span>
            <b :class="stats.long.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(stats.long.pnl) }}</b>
            <b :class="stats.short.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(stats.short.pnl) }}</b>
          </div>
          <div class="ls-table__row"><span>Win rate</span><b>{{ stats.long.winRate }}%</b><b>{{ stats.short.winRate }}%</b></div>
          <div class="ls-table__row"><span>Avg win</span><b class="up">{{ money(stats.long.avgWin) }}</b><b class="up">{{ money(stats.short.avgWin) }}</b></div>
          <div class="ls-table__row"><span>Avg loss</span><b class="down">{{ money(stats.long.avgLoss) }}</b><b class="down">{{ money(stats.short.avgLoss) }}</b></div>
        </div>
      </section>

      <section class="panel stat-card">
        <div class="stat-card__head">Streak analysis <AppIcon name="info" :size="14" /></div>
        <div class="acc-grid-2">
          <div class="aff__stat">
            <span>Longest win streak</span>
            <b>{{ stats.winStreak.count }}</b>
            <span class="up" style="margin-top:4px;display:block">{{ signedMoney(stats.winStreak.pnl) }}</span>
          </div>
          <div class="aff__stat">
            <span>Longest lose streak</span>
            <b>{{ stats.lossStreak.count }}</b>
            <span class="down" style="margin-top:4px;display:block">{{ signedMoney(stats.lossStreak.pnl) }}</span>
          </div>
        </div>
        <div class="aff__stat streak-current">
          <span>Current streak</span>
          <b :class="stats.current.winning ? 'up' : 'down'">
            {{ stats.current.count }} {{ stats.current.winning ? 'wins' : 'losses' }}
          </b>
          <span style="margin-top:4px;display:block" :class="stats.current.winning ? 'up' : 'down'">{{ signedMoney(stats.current.pnl) }}</span>
          <span class="streak-arrow" :class="stats.current.winning ? 'up' : 'down'" aria-hidden="true">
            {{ stats.current.winning ? '▲' : '▼' }}
          </span>
        </div>
        <span class="stat-card__foot">Last {{ recent.length }} trades</span>
        <div class="streak-list">
          <span v-for="t in recent" :key="t.id" class="streak-cell" :title="`${t.symbol} ${signedMoney(t.pnl)}`">
            <i :class="{ 'is-win': t.pnl >= 0 }"></i>
            <em>{{ t.pnl > 0 ? '+' : '' }}{{ Math.round(t.pnl) }}</em>
          </span>
        </div>
      </section>
    </div>
  </div>
</template>
