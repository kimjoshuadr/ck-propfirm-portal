<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import LineChart from '../LineChart.vue'
import { ACCOUNTS, maxLossToday } from '../../data/portal.js'
import { activeAccount, copyText, isFavorite, toggleFavorite } from '../../lib/portal.js'
import { accountHref } from '../../lib/router.js'
import { money, signedMoney, signedPct } from '../../lib/format.js'
import { pushToast } from '../../lib/ui.js'

/*
 * The accounts rail.
 *
 * Three cards are fully in view at desktop and the fourth deliberately peeks
 * past the right edge — the rail is meant to be scrollable, so it should look
 * scrollable. Arrows, a drag-to-scroll track, ←/→ keys and edge fades all drive
 * the same scroll container; nothing here fakes a scroll.
 *
 * Every card is one link to that account (a stretched anchor behind the
 * content), so the card body finally does what it looks like it does. The star
 * and the two quick actions sit above that anchor as their own controls.
 *
 * Favourites float to the front of the rail. The sort is derived from the
 * reactive favourite set, so starring a card also moves it.
 */
defineProps({
  title: { type: String, default: 'Your accounts' },
  /* The All-accounts screen already is the end of the rail. */
  showAllTile: { type: Boolean, default: true },
})

const track = ref(null)
const atStart = ref(true)
const atEnd = ref(false)

/* Balance is the default reading; P&L rebases the same series on the account's
   own size so the curve sits on zero at the start. */
const curve = ref('balance')
const CURVES = [
  { key: 'balance', label: 'Balance' },
  { key: 'pnl', label: 'P&L' },
]

const accounts = computed(() => [...ACCOUNTS]
  .sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id))))

const step = (direction) => {
  const el = track.value
  if (!el) return
  el.scrollBy({ left: direction * Math.max(280, el.clientWidth * 0.62), behavior: 'smooth' })
}

function onScroll() {
  const el = track.value
  if (!el) return
  atStart.value = el.scrollLeft <= 4
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
}

/* Mouse drag. Touch keeps the browser's own scrolling — hijacking it would
   fight the page scroll for no gain. */
const dragging = ref(false)
let dragged = false
let startX = 0
let startScroll = 0

function onPointerDown(event) {
  if (event.pointerType !== 'mouse' || event.button !== 0) return
  dragging.value = true
  dragged = false
  startX = event.clientX
  startScroll = track.value.scrollLeft
}

function onPointerMove(event) {
  if (!dragging.value) return
  const dx = event.clientX - startX
  if (Math.abs(dx) > 6) {
    dragged = true
    track.value.scrollLeft = startScroll - dx
  }
}

const endDrag = () => { dragging.value = false }

/* A drag that ends over a card must not also open that card. */
function swallowClick(event) {
  if (!dragged) return
  event.preventDefault()
  event.stopPropagation()
  dragged = false
}

function onKeydown(event) {
  if (event.key === 'ArrowRight') { event.preventDefault(); step(1) }
  if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1) }
}

/* Objective rows are read, not audited — the cents only crowd the line. */
const whole = (n) => {
  const s = money(Math.abs(n)).replace(/\.00$/, '')
  return n < 0 ? `-${s}` : s
}

const tone = (a) => (a.status === 'breached' ? 'red' : a.status === 'funded' ? 'green' : 'violet')
const railClass = (a) => (a.status === 'breached' ? 'acct__rail--bad' : a.pnl >= 0 ? 'acct__rail--good' : 'acct__rail--bad')

const flag = (a) => {
  if (a.status === 'breached') return 'Breached'
  if (a.status === 'funded') return 'Funded'
  return a.phase.startsWith('Phase 2') ? 'Phase 2' : 'Phase 1'
}
const flagClass = (a) => (a.status === 'breached' ? 'acct__flag--bad' : 'acct__flag--good')

const series = (a) => (curve.value === 'pnl' ? a.spark.map((v) => v - a.size) : a.spark)
const baseline = (a) => (curve.value === 'pnl' ? [0] : [])

/* The card states the objectives that still apply to it: a funded account has
   no profit target and no minimum days, so it shows the one row that is live
   (its drawdown) rather than empty meters. */
function objectives(a) {
  const rows = []
  if (a.profitTarget > 0) {
    rows.push({
      key: 'target',
      label: 'Profit target',
      pct: (a.pnl / a.profitTarget) * 100,
      value: `${whole(a.pnl)} / ${whole(a.profitTarget)}`,
      bad: a.status === 'breached',
    })
  }
  rows.push({
    key: 'loss',
    label: 'Max loss used',
    pct: (a.maxLossUsed / a.maxLoss) * 100,
    value: `${whole(a.maxLossUsed)} / ${whole(a.maxLoss)}`,
    bad: a.maxLossUsed / a.maxLoss > 0.6,
  })
  if (a.minTradingDays > 0) {
    rows.push({
      key: 'days',
      label: 'Min trading days',
      pct: (a.tradingDays / a.minTradingDays) * 100,
      value: `${a.tradingDays} / ${a.minTradingDays}`,
      bad: false,
    })
  }
  return rows
}

const clamp = (n) => `${Math.max(0, Math.min(100, n))}%`

/* Daily-loss headroom, live for each account that can still trade. */
const headroom = (a) => Math.max(0, a.dailyLoss - maxLossToday(a.number))
const live = (a) => a.status !== 'breached'

function copyNumber(a) {
  copyText(a.number, `Account ${a.number} copied`)
}

function openPlatform(a) {
  pushToast({ tone: 'info', title: `Open ${a.platform}`, msg: 'No live terminal in this prototype — this is where it would launch.' })
}
</script>

<template>
  <section class="ov__zone" data-od-id="overview-accounts">
    <div class="sec">
      <div class="sec__body">
        <h2 class="sec__title">{{ title }}</h2>
        <p class="sec__sub">Every evaluation, verification and funded account you own — click a card to open it.</p>
      </div>
      <div class="sec__actions">
        <div class="seg seg--sm" role="group" aria-label="Curve">
          <button
            v-for="c in CURVES"
            :key="c.key"
            type="button"
            class="seg__btn"
            :class="{ 'is-on': curve === c.key }"
            :aria-pressed="curve === c.key"
            @click="curve = c.key"
          >{{ c.label }}</button>
        </div>
        <button type="button" class="rail__arrow" :disabled="atStart" aria-label="Previous accounts" @click="step(-1)">
          <AppIcon name="chevronLeft" :size="16" />
        </button>
        <button type="button" class="rail__arrow" :disabled="atEnd" aria-label="More accounts" @click="step(1)">
          <AppIcon name="chevronRight" :size="16" />
        </button>
      </div>
    </div>

    <div class="rail" :class="{ 'is-start': atStart, 'is-end': atEnd, 'is-dragging': dragging }">
      <span class="rail__fade rail__fade--start" aria-hidden="true" />
      <span class="rail__fade rail__fade--end" aria-hidden="true" />

      <div
        ref="track"
        class="rail__track"
        tabindex="0"
        role="group"
        aria-label="Your accounts — use the arrow keys to scroll"
        @scroll.passive="onScroll"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="endDrag"
        @pointerleave="endDrag"
        @click.capture="swallowClick"
        @keydown="onKeydown"
      >
        <article
          v-for="a in accounts"
          :key="a.id"
          class="acct"
          :class="{ 'is-active': activeAccount.id === a.id, 'is-breached': a.status === 'breached' }"
          :data-od-id="`overview-account-${a.id.toLowerCase()}`"
        >
          <!-- The whole card is this link; the controls below sit above it. -->
          <a
            class="acct__link"
            :href="accountHref(a.number)"
            :title="`Open ${a.label}`"
            :aria-label="`Open ${a.label}, account ${a.number}`"
          />

          <div class="acct__top">
            <button
              type="button"
              class="fav-btn"
              :class="{ 'is-on': isFavorite(a.id) }"
              :aria-pressed="isFavorite(a.id)"
              :aria-label="`${isFavorite(a.id) ? 'Remove' : 'Add'} ${a.label} ${isFavorite(a.id) ? 'from' : 'to'} favorites`"
              @click="toggleFavorite(a)"
            >
              <AppIcon name="star" :size="15" />
            </button>
            <span class="acct__names">
              <span class="acct__tag" :title="a.label">{{ a.label }}</span>
              <span class="acct__number">Account {{ a.number }}</span>
            </span>
          </div>

          <div class="acct__pnl">
            <span>P/L:</span>
            <b>{{ signedMoney(a.pnl) }}</b>
            <span class="delta" :class="a.roi >= 0 ? 'delta--up' : 'delta--down'">{{ signedPct(a.roi) }}</span>
            <span v-if="activeAccount.id === a.id" class="acct__live">active</span>
          </div>

          <div class="acct__value-row">
            <span class="acct__rail" :class="railClass(a)" aria-hidden="true" />
            <span class="acct__value">{{ money(a.balance) }}</span>
          </div>

          <div class="acct__chart">
            <LineChart
              :values="series(a)"
              :tone="tone(a)"
              :uid="`acct-${a.id}`"
              :view-box-height="70"
              :baseline="curve === 'pnl' ? 0 : null"
            />
            <span class="acct__flag" :class="flagClass(a)">{{ flag(a) }}</span>
          </div>

          <div class="acct__obj">
            <div v-for="row in objectives(a)" :key="row.key" class="acct__obj-row">
              <span class="acct__obj-k">{{ row.label }}</span>
              <span class="acct__obj-bar" :class="{ 'is-bad': row.bad, 'is-good': !row.bad }">
                <i :style="{ width: clamp(row.pct) }" />
              </span>
              <span class="acct__obj-v">{{ row.value }}</span>
            </div>
          </div>

          <div class="acct__foot">
            <span v-if="live(a)">Risk left today <b>{{ whole(headroom(a)) }}</b></span>
            <span v-else class="acct__foot-bad">No headroom — breach confirmed</span>
            <div class="acct__quick">
              <button type="button" class="acct__qbtn" title="Copy the account number" @click="copyNumber(a)">
                <AppIcon name="copy" :size="14" />
              </button>
              <button type="button" class="acct__qbtn" title="Open the platform" @click="openPlatform(a)">
                <AppIcon name="external" :size="14" />
              </button>
              <a class="acct__qbtn" :href="accountHref(a.number, 'rules')" title="Read the objectives">
                <AppIcon name="book" :size="14" />
              </a>
            </div>
          </div>
        </article>

        <a v-if="showAllTile" class="acct acct--all" href="#accounts" data-od-id="overview-all-accounts">
          <span class="acct__all-icon"><AppIcon name="accounts" :size="22" /></span>
          <span class="acct__all-title">All accounts</span>
          <span class="acct__all-sub">Filters, sorting and the full table — {{ accounts.length }} accounts</span>
          <span class="acct__all-go">Open<AppIcon name="chevronRight" :size="15" /></span>
        </a>
      </div>
    </div>
  </section>
</template>
