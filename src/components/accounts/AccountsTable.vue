<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '../AppIcon.vue'
import { maxLossToday } from '../../data/portal.js'
import { ACCOUNTS } from '../../lib/portal.js'
import { account, copyText, favoriteState, isFavorite, toggleFavorite } from '../../lib/portal.js'
import { accountHref } from '../../lib/router.js'
import { money, signedMoney, signedPct } from '../../lib/format.js'

const props = defineProps({
  favoritesOnly: { type: Boolean, default: false },
  emptyTitle: { type: String, default: 'No accounts match these filters' },
  emptyHint: { type: String, default: 'Widen the status, stage or search filter to see your accounts again.' },
  odId: { type: String, default: 'accounts-table' },
})

/*
 * The two selects are the reference's filters, wired to real fields: status is
 * the account state, stage is the account kind. Sorting is on the value
 * columns; page size defaults to 10 like the reference.
 */
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'funded', label: 'Funded' },
  { value: 'breached', label: 'Breached' },
]

const STAGE_OPTIONS = [
  { value: 'all', label: 'All stages' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'funded', label: 'Funded' },
]

const query = ref('')
const status = ref('all')
const stage = ref('all')
const perPage = ref(10)
const page = ref(1)
const sortKey = ref('balance')
const sortDir = ref('desc')

const kind = (a) => (a.status === 'funded' ? 'funded' : 'evaluation')
const stageLabel = (a) => (kind(a) === 'funded' ? 'Funded' : 'Evaluation')

/* "Phase 1 · Evaluation" → "Phase 1"; "Funded · Payout cycle 3" → "Payout
   cycle 3", so the Phase cell never just repeats the Stage chip. */
const phaseLabel = (a) => {
  const [head, tail] = a.phase.split(' · ')
  return head === 'Funded' && tail ? tail : head
}

const badgeFor = (a) => (a.status === 'breached' ? 'badge--breached' : a.status === 'funded' ? 'badge--passed' : 'badge--active')

/* Reading favoriteState here keeps the computed reactive when the pin changes
   in the other tab or from a card's star. */
const rows = computed(() => {
  const pinned = favoriteState.ids
  const q = query.value.trim().toLowerCase()

  const filtered = ACCOUNTS.filter((a) => {
    if (props.favoritesOnly && !pinned.includes(a.id)) return false
    if (status.value !== 'all' && a.status !== status.value) return false
    if (stage.value !== 'all' && kind(a) !== stage.value) return false
    if (q && !`${a.label} ${a.plan} ${a.phase} ${a.status}`.toLowerCase().includes(q)) return false
    return true
  })

  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    const key = sortKey.value
    const va = key === 'account' ? a.label : a[key]
    const vb = key === 'account' ? b.label : b[key]
    if (va === vb) return 0
    return (va > vb ? 1 : -1) * dir
  })
})

const pinnedCount = computed(() => ACCOUNTS.filter((a) => favoriteState.ids.includes(a.id)).length)

/* Totals of the rows the filters are showing, not of every account — the
   headline figures should describe what is on screen. */
const totals = computed(() => {
  const list = rows.value
  const live = list.filter((a) => a.status !== 'breached')
  const balance = list.reduce((n, a) => n + a.balance, 0)
  const size = list.reduce((n, a) => n + a.size, 0)
  const pnl = list.reduce((n, a) => n + a.pnl, 0)
  const headroom = live.reduce((n, a) => n + Math.max(0, a.dailyLoss - maxLossToday(a.number)), 0)
  const evaluations = list.filter((a) => a.status === 'active').length
  const funded = list.filter((a) => a.status === 'funded').length
  const breached = list.filter((a) => a.status === 'breached').length

  return {
    count: list.length,
    balance,
    size,
    pnl,
    roi: size > 0 ? (pnl / size) * 100 : 0,
    headroom,
    live: live.length,
    breakdown: [
      evaluations ? `${evaluations} evaluation${evaluations === 1 ? '' : 's'}` : '',
      funded ? `${funded} funded` : '',
      breached ? `${breached} breached` : '',
    ].filter(Boolean).join(' · ') || 'Nothing matches these filters',
  }
})

const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / perPage.value)))
const paged = computed(() => rows.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
const rangeLabel = computed(() => {
  if (!rows.value.length) return '0 of 0'
  const from = (page.value - 1) * perPage.value + 1
  return `${from} – ${Math.min(from + paged.value.length - 1, rows.value.length)} of ${rows.value.length}`
})

/* Any filter change resets to the first page, otherwise the range can point
   past the end of the new result set. */
watch([query, status, stage, perPage, sortKey, sortDir, () => favoriteState.ids.length], () => { page.value = 1 })

function sortBy(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'account' ? 'asc' : 'desc'
  }
}

const ariaSort = (key) =>
  sortKey.value === key ? (sortDir.value === 'asc' ? 'ascending' : 'descending') : null

/* Rows open the account page; switching the active account moved to that
   page's header and the topbar switcher. */
function open(a) {
  window.location.hash = accountHref(a.number).slice(1)
}

/* Traders paste the number into platform logins and support tickets. */
const copy = (a) => copyText(a.number, 'Account number copied')
</script>

<template>
  <section class="panel" :data-od-id="odId">
    <div class="acct-filters">
      <label class="sr" for="acctSearch">Search your accounts</label>
      <input
        id="acctSearch"
        v-model="query"
        class="input acct-search"
        type="search"
        placeholder="Search your accounts"
      />

      <label class="sr" for="acctStatus">Filter by status</label>
      <select id="acctStatus" v-model="status" class="select">
        <option v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <label class="sr" for="acctStage">Filter by stage</label>
      <select id="acctStage" v-model="stage" class="select">
        <option v-for="o in STAGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <span class="acct-filters__note">
        <template v-if="favoritesOnly">{{ pinnedCount }} pinned · stars on any card add or remove one</template>
        <template v-else>Select a row to open that account</template>
      </span>
    </div>

    <div class="table-wrap">
      <table class="data data--roomy" style="min-width:940px">
        <thead>
          <tr>
            <th style="width:44px"><span class="sr">Favorite</span></th>
            <th :aria-sort="ariaSort('number')">
              <button type="button" class="th-btn" @click="sortBy('number')">
                Account number
                <AppIcon v-if="sortKey === 'number'" :name="sortDir === 'asc' ? 'arrowUp' : 'arrowDown'" :size="12" />
              </button>
            </th>
            <th :aria-sort="ariaSort('account')">
              <button type="button" class="th-btn" @click="sortBy('account')">
                Account
                <AppIcon v-if="sortKey === 'account'" :name="sortDir === 'asc' ? 'arrowUp' : 'arrowDown'" :size="12" />
              </button>
            </th>
            <th>Program</th>
            <th>Stage</th>
            <th>Phase</th>
            <th class="num" :aria-sort="ariaSort('balance')">
              <button type="button" class="th-btn" @click="sortBy('balance')">
                Balance
                <AppIcon v-if="sortKey === 'balance'" :name="sortDir === 'asc' ? 'arrowUp' : 'arrowDown'" :size="12" />
              </button>
            </th>
            <th class="num" :aria-sort="ariaSort('pnl')">
              <button type="button" class="th-btn" @click="sortBy('pnl')">
                P/L
                <AppIcon v-if="sortKey === 'pnl'" :name="sortDir === 'asc' ? 'arrowUp' : 'arrowDown'" :size="12" />
              </button>
            </th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="a in paged"
            :key="a.id"
            class="is-row"
            :class="{ 'is-highlight': a.id === account.activeId }"
            :aria-current="a.id === account.activeId"
            :data-od-id="`accounts-row-${a.id.toLowerCase()}`"
            tabindex="0"
            :aria-label="`Open ${a.label}, account ${a.number}`"
            @click="open(a)"
            @keydown.enter.prevent="open(a)"
            @keydown.space.prevent="open(a)"
          >
            <td>
              <button
                type="button"
                class="row-btn"
                :class="{ 'is-on': isFavorite(a.id) }"
                :aria-pressed="isFavorite(a.id)"
                :aria-label="`${isFavorite(a.id) ? 'Remove' : 'Add'} ${a.label} ${isFavorite(a.id) ? 'from' : 'to'} favorites`"
                @click.stop="toggleFavorite(a)"
              >
                <AppIcon name="star" :size="15" />
              </button>
            </td>
            <td>
              <span class="acct-num">
                <a class="mono" :href="accountHref(a.number)" @click.stop>{{ a.number }}</a>
                <button
                  type="button"
                  class="row-btn row-btn--copy"
                  :aria-label="`Copy account number ${a.number}`"
                  @click.stop="copy(a)"
                >
                  <AppIcon name="copy" :size="14" />
                </button>
              </span>
            </td>
            <td class="cell-strong">{{ a.label }}</td>
            <td class="dim">{{ a.plan }}</td>
            <td><span class="badge">{{ stageLabel(a) }}</span></td>
            <td class="dim">{{ phaseLabel(a) }}</td>
            <td class="num">{{ money(a.balance) }}</td>
            <td class="num">
              <span :class="a.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(a.pnl) }}</span>
            </td>
            <td>
              <span class="badge acct-status" :class="badgeFor(a)">
                <span class="badge__dot"></span>{{ a.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="rows.length" class="table-book" data-od-id="accounts-totals">
      <div class="grid grid--cols-4 portfolio">
        <div class="portfolio__cell">
          <span class="portfolio__k">Showing</span>
          <span class="portfolio__v">{{ totals.count }}</span>
          <span class="portfolio__meta">{{ totals.breakdown }}</span>
        </div>
        <div class="portfolio__cell">
          <span class="portfolio__k">Total balance</span>
          <span class="portfolio__v">{{ money(totals.balance) }}</span>
          <span class="portfolio__meta">Sum of the balances shown</span>
        </div>
        <div class="portfolio__cell">
          <span class="portfolio__k">Open P&amp;L</span>
          <span class="portfolio__v" :class="totals.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(totals.pnl) }}</span>
          <span class="portfolio__meta">{{ signedPct(totals.roi, 1) }} on {{ money(totals.size) }} of capital</span>
        </div>
        <div class="portfolio__cell">
          <span class="portfolio__k">Risk left today</span>
          <span class="portfolio__v">{{ money(totals.headroom) }}</span>
          <span class="portfolio__meta">Across {{ totals.live }} live account{{ totals.live === 1 ? '' : 's' }}</span>
        </div>
      </div>
    </div>

    <p v-if="!rows.length" class="empty">
      <strong>{{ emptyTitle }}</strong>{{ emptyHint }}
    </p>

    <div v-if="rows.length" class="acct-pager">
      <label class="sr" for="acctPerPage">Rows per page</label>
      <span>Rows per page</span>
      <select id="acctPerPage" v-model.number="perPage" class="select">
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>

      <span class="acct-pager__spacer">{{ rangeLabel }}</span>
      <button
        type="button"
        class="rail__arrow"
        :disabled="page <= 1"
        aria-label="Previous page"
        @click="page -= 1"
      >
        <AppIcon name="chevronLeft" :size="16" />
      </button>
      <button
        type="button"
        class="rail__arrow"
        :disabled="page >= pageCount"
        aria-label="Next page"
        @click="page += 1"
      >
        <AppIcon name="chevronRight" :size="16" />
      </button>
    </div>
  </section>
</template>
