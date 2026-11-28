<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import ModalDialog from '../components/ModalDialog.vue'
import { ACCOUNTS, ORDERS, PAYOUTS, paidPayoutTotal, submitPayoutRequest } from '../lib/portal.js'
import { PAYOUT_METHOD_OPTIONS } from '../lib/api.js'
import { money } from '../lib/format.js'
import { pushToast } from '../lib/ui.js'
import { route } from '../lib/router.js'

/*
 * Account · Manage — Billing, Withdrawals and Payout methods.
 *
 * The three sidebar rows are one screen, and the hash picks which one: the head
 * follows the tab, so `#manage/billing` reads as a billing page rather than as
 * "payouts" with a tab lit. Billing carries the order history and nothing else —
 * the reference puts a payment-methods panel at the top of its billing page and
 * this portal never takes a card, so there is nothing to manage there.
 *
 * Withdrawals reads two ways: the funded accounts and what is due on each, then
 * the full request history. Both are derived from the payout ledger, and the
 * summary's foot reconciles them (paid to date + profit still on the account).
 */
const TABS = [
  { key: 'withdrawals', label: 'Withdrawals', hash: 'withdrawals' },
  { key: 'methods', label: 'Methods', hash: 'methods' },
  { key: 'billing', label: 'Billing', hash: 'billing' },
]

const HEAD = {
  withdrawals: {
    eyebrow: 'Account · Withdrawals',
    title: 'Withdrawals',
    body: 'Request a payout at the close of a cycle, follow it through review, and keep every receipt. Median settlement is 24 hours.',
  },
  methods: {
    eyebrow: 'Account · Payout methods',
    title: 'Payout methods',
    body: 'Where a payout can land, what each rail costs and how long it takes. One method is the default for new requests.',
  },
  billing: {
    eyebrow: 'Account · Billing',
    title: 'Billing',
    body: 'Every order you have placed with its receipt. Nothing is charged from this portal, and no card is stored here.',
  },
}

const tab = ref(TABS.some((t) => t.key === route.tab) ? route.tab : 'withdrawals')
const head = computed(() => HEAD[tab.value])

function select(key) {
  tab.value = key
  history.replaceState(null, '', `#manage/${key}`)
}

watch(() => route.tab, (next) => {
  if (TABS.some((t) => t.key === next)) tab.value = next
})

const round2 = (n) => Math.round(n * 100) / 100

/* --------------------------------------------------------------- withdrawals */

/* Live data: the store's PAYOUTS is the CRM's payout ledger for the signed-in
   trader; the funded accounts and their figures come from the account list. */
const paid = computed(() => PAYOUTS.filter((p) => p.status === 'paid'))
const inReview = computed(() => PAYOUTS.filter((p) => p.status === 'pending' || p.status === 'processing'))
const totalWithdrawn = computed(() => paidPayoutTotal())
const inReviewTotal = computed(() => inReview.value.reduce((n, p) => n + p.amount, 0))

const STATUS_BADGE = {
  paid: 'badge--active',
  approved: 'badge--active',
  pending: 'badge--pending',
  processing: 'badge--violet',
  requested: 'badge--pending',
  rejected: 'badge--rejected',
  cancelled: 'badge--rejected',
}

const filter = ref('')
const history = computed(() => {
  const needle = filter.value.trim().toLowerCase()
  if (!needle) return PAYOUTS
  return PAYOUTS.filter((p) => `${p.shortId} ${p.id} ${p.status} ${p.method} ${p.account} ${p.kind}`.toLowerCase().includes(needle))
})

const view = ref('summary')

/*
 * One row per funded account, every figure read from the payout ledger and the
 * account itself: what is on the account now, what the split makes that worth,
 * what has already been paid out, and when the last payout landed.
 */
const summary = computed(() => ACCOUNTS.filter((a) => a.status === 'funded').map((a) => {
  const mine = PAYOUTS.filter((p) => p.accountId === a.id)
  const settled = mine.filter((p) => p.status === 'paid')
  const split = (mine.find((p) => p.split) || {}).split || 90
  const withdrawn = round2(settled.reduce((n, p) => n + p.amount, 0))
  const last = settled.map((p) => p.settled).filter((d) => d && d !== '—').sort().at(-1) || '—'
  return {
    id: a.id,
    number: a.number,
    label: a.label,
    profit: a.pnl,
    split,
    share: round2((a.pnl * split) / 100),
    withdrawn,
    last,
    lifetime: round2(withdrawn + a.pnl),
  }
}))

const summaryTotals = computed(() => summary.value.reduce((t, r) => ({
  profit: round2(t.profit + r.profit),
  share: round2(t.share + r.share),
  withdrawn: round2(t.withdrawn + r.withdrawn),
  lifetime: round2(t.lifetime + r.lifetime),
}), { profit: 0, share: 0, withdrawn: 0, lifetime: 0 }))

/* --------------------------------------------- payout request (New request) */

const requestOpen = ref(false)
const requestBusy = ref(false)
const requestError = ref('')
const requestForm = ref({ tradingAccountId: '', method: 'paypal', destination: '' })

function openRequest() {
  const funded = ACCOUNTS.filter((a) => a.status === 'funded')
  const settledTypes = new Set(['paid', 'approved'])
  /* Preselect the funded account with no open request, else the first one. */
  const free = funded.find((a) => !inReview.value.some((p) => p.accountId === a.id && !settledTypes.has(p.status)))
  requestForm.value = { tradingAccountId: free?.id || funded[0]?.id || '', method: 'paypal', destination: '' }
  requestError.value = ''
  requestOpen.value = true
}

const requestAccount = computed(() =>
  ACCOUNTS.find((a) => a.id === requestForm.value.tradingAccountId) || null)

/* The destination field's prompt follows the chosen rail. */
const requestHint = computed(() =>
  PAYOUT_METHOD_OPTIONS.find((m) => m.id === requestForm.value.method)?.hint || '')

async function submitRequest() {
  if (requestBusy.value) return
  const { tradingAccountId, method, destination } = requestForm.value
  if (!tradingAccountId || !destination.trim()) {
    requestError.value = 'Choose the account and fill in the destination.'
    return
  }
  requestBusy.value = true
  requestError.value = ''
  try {
    const result = await submitPayoutRequest({ tradingAccountId, method, destination: destination.trim() })
    requestOpen.value = false
    pushToast({
      tone: 'good',
      title: 'Payout requested',
      msg: `${money(result?.payout?.amount ?? 0)} is in review${result?.payout?.dueBy ? ` · due by ${new Date(result.payout.dueBy).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}.`,
    })
  } catch (err) {
    /* Ineligibility comes back 422 with the desk's message + a stable code —
       show exactly that; anything else keeps the form open with the error. */
    requestError.value = err?.message || 'Could not request the payout. Please try again.'
  } finally {
    requestBusy.value = false
  }
}

/* ------------------------------------------------------------------- methods */

/* Two rails, the two the desk actually pays out on. */
const METHODS = [
  { id: 'risepay', name: 'RisePay', icon: 'wallet', note: 'Instant e-wallet · recommended for PH and SEA', fee: 'Free', eta: 'Under 24h', def: true },
  { id: 'crypto', name: 'Crypto', icon: 'coin', note: 'USDT on the TRC-20 or ERC-20 network', fee: 'Network only', eta: 'Under 2h', def: false },
]

const methods = ref(METHODS.map((m) => ({ ...m })))

function setDefault(method) {
  methods.value = methods.value.map((m) => ({ ...m, def: m.name === method.name }))
  pushToast({ tone: 'good', title: 'Default updated', msg: `${method.name} is now your payout method.` })
}

function editMethod(method) {
  pushToast({ tone: 'info', title: `Edit ${method.name}`, msg: `${method.kind} · ${method.note}. This prototype stores no payout details.` })
}

/* ------------------------------------------------------------------- billing */

/* Live orders — the CRM's sales orders for this trader (GET /orders), loaded
   through the store like the payouts above. `paymentStatus` is the honest
   charge state; the workflow status alone says nothing about the money. */
const ORDER_STATUS_BADGE = {
  paid: 'badge--active',
  unpaid: 'badge--pending',
  pending: 'badge--pending',
  partial: 'badge--violet',
  refunded: 'badge--rejected',
  cancelled: 'badge--rejected',
}

const BILLING_FILTERS = [
  { key: 'all', label: 'All statuses' },
  { key: 'paid', label: 'Paid' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'partial', label: 'Partially paid' },
]

const billingFilter = ref('all')
const perPage = ref(10)
const page = ref(1)

const billingRows = computed(() => (billingFilter.value === 'all'
  ? ORDERS
  : ORDERS.filter((o) => o.status === billingFilter.value)))

const billingPage = computed(() => billingRows.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
const rangeLabel = computed(() => {
  if (!billingRows.value.length) return '0 of 0'
  const first = (page.value - 1) * perPage.value + 1
  const last = Math.min(page.value * perPage.value, billingRows.value.length)
  return `${first} – ${last} of ${billingRows.value.length}`
})

watch([billingFilter, perPage], () => { page.value = 1 })

function invoice(order) {
  pushToast({ tone: 'info', title: `Invoice ${order.id}`, msg: `${order.date} · ${money(order.total)}` })
}

/* -------------------------------------------------------------------- shared */

/* The "New request" button opens the payout request dialog (see the
   withdrawals script block). */

</script>

<template>
  <div class="ov" data-od-id="payouts-page">
    <div class="page-head util-head" data-od-id="page-head-manage">
      <div class="page-head__text">
        <div class="eyebrow">{{ head.eyebrow }}</div>
        <h1>{{ head.title }}</h1>
        <p class="dim">{{ head.body }}</p>
      </div>
      <div class="page-head__actions">
        <template v-if="tab === 'withdrawals'">
          <button class="btn btn--ghost" @click="select('methods')">Payout methods</button>
          <button class="btn btn--ghost" data-od-id="request-payout-cta" @click="openRequest">
            <AppIcon name="plus" :size="15" />New request
          </button>
        </template>
      </div>
    </div>

    <section v-if="tab === 'withdrawals'" class="panel util-gap" data-od-id="total-withdrawn">
      <div class="panel__head">
        <span class="panel__title">Total withdrawn</span>
        <span class="panel__actions">
          <span class="stat-card__foot">
            {{ paid.length }} settlements · {{ money(inReviewTotal) }} in review
          </span>
          <span class="mng-total">{{ money(totalWithdrawn) }}</span>
        </span>
      </div>
    </section>

    <div class="tabs" role="tablist" aria-label="Manage views">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        class="tab"
        role="tab"
        :aria-selected="tab === t.key"
        :data-od-id="`manage-tab-${t.key}`"
        @click="select(t.key)"
      >{{ t.label }}</button>
    </div>

    <!-- Withdrawals: what is due, then what has been paid. -->
    <template v-if="tab === 'withdrawals'">
      <div class="seg util-gap" role="tablist" aria-label="Withdrawal view" style="margin-top:18px">
        <button
          type="button"
          class="seg__btn"
          :class="{ 'is-on': view === 'summary' }"
          :aria-selected="view === 'summary'"
          role="tab"
          data-od-id="withdrawal-view-summary"
          @click="view = 'summary'"
        >Profit summary</button>
        <button
          type="button"
          class="seg__btn"
          :class="{ 'is-on': view === 'history' }"
          :aria-selected="view === 'history'"
          role="tab"
          data-od-id="withdrawal-view-history"
          @click="view = 'history'"
        >History</button>
      </div>

      <section v-if="view === 'summary'" class="panel" data-od-id="profit-summary">
        <div class="panel__head">
          <span class="panel__title">Profit summary</span>
          <span class="panel__actions">
            <span class="stat-card__foot">{{ summary.length }} funded {{ summary.length === 1 ? 'account' : 'accounts' }}</span>
          </span>
        </div>

        <div v-if="summary.length" class="table-wrap">
          <table class="data data--striped" style="min-width:900px" data-table="profit-summary">
            <thead>
              <tr>
                <th>Account</th>
                <th class="num">Profit on account</th>
                <th class="num">Profit share</th>
                <th class="num">Your share</th>
                <th class="num">Total withdrawn</th>
                <th>Last withdrawal</th>
                <th>Next window</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in summary" :key="r.id">
                <td class="cell-strong">
                  <a class="mono mng-link" :href="`#account/${r.number}`">{{ r.number }}</a>
                  <span class="mng-label">{{ r.label }}</span>
                </td>
                <td class="num">{{ money(r.profit) }}</td>
                <td class="num">{{ r.split }}%</td>
                <td class="num up">{{ money(r.share) }}</td>
                <td class="num">{{ money(r.withdrawn) }}</td>
                <td class="dim">{{ r.last }}</td>
                <td class="dim">On request</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-else class="empty">
          <strong>No funded accounts</strong>
          A payout becomes available once an evaluation is funded.
        </p>

        <div v-if="summary.length" class="panel__foot">
          <span class="stat-card__foot">
            Paid to date <b>{{ money(summaryTotals.withdrawn) }}</b> plus
            <b>{{ money(summaryTotals.profit) }}</b> still on the {{ summary.length === 1 ? 'account' : 'accounts' }}
            makes <b>{{ money(summaryTotals.lifetime) }}</b> earned in total; your share of what is open is
            <b>{{ money(summaryTotals.share) }}</b>.
          </span>
        </div>
      </section>

      <section v-else class="panel" data-od-id="payout-history">
        <div class="panel__head">
          <span class="panel__title">Payout history</span>
          <span class="panel__actions">
            <label class="sr" for="payoutFilter">Filter payouts</label>
            <input id="payoutFilter" v-model="filter" class="input search-input pg-filter" placeholder="Filter by reference or status" />
          </span>
        </div>

        <div class="table-wrap">
          <table class="data data--striped" style="min-width:860px" data-table="payouts">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Account</th>
                <th class="num">Amount</th>
                <th>Method</th>
                <th class="num">Split</th>
                <th>Requested</th>
                <th>Settled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in history" :key="p.id">
                <td class="mono-id" :title="p.id">{{ p.shortId }}</td>
                <td class="cell-strong">{{ p.account }}</td>
                <td class="num">{{ p.amount ? money(p.amount) : '—' }}</td>
                <td>{{ p.method }}</td>
                <td class="num">{{ p.split ? `${p.split}%` : '—' }}</td>
                <td class="dim">{{ p.requested }}</td>
                <td class="dim">{{ p.settled }}</td>
                <td>
                  <span class="badge" :class="STATUS_BADGE[p.status]" :title="p.rejectReason || ''">
                    <span class="badge__dot" />{{ p.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!history.length" class="empty">
          <strong>No payouts match</strong>Clear the filter to see the full history.
        </div>
      </section>
    </template>

    <!-- Payout methods: one panel, one row per rail. -->
    <section v-else-if="tab === 'methods'" class="panel" style="margin-top:18px" data-od-id="method-list">
      <div class="panel__head">
        <span class="panel__title">Payout methods</span>
        <span class="panel__actions">
          <span class="stat-card__foot">The default is used for new requests</span>
        </span>
      </div>

      <div
        v-for="m in methods"
        :key="m.id"
        class="mth-row"
        :class="{ 'is-default': m.def }"
        :data-od-id="`method-${m.id}`"
      >
        <span class="mth-row__mark"><AppIcon :name="m.icon" :size="20" /></span>

        <span class="mth-row__id">
          <b>{{ m.name }}</b>
          <span>{{ m.note }}</span>
        </span>

        <span class="mth-row__facts">
          <span class="mth-row__fact"><em>Fee</em><b>{{ m.fee }}</b></span>
          <span class="mth-row__fact"><em>Settlement</em><b>{{ m.eta }}</b></span>
        </span>

        <span class="mth-row__actions">
          <span v-if="m.def" class="badge badge--passed"><span class="badge__dot" />default</span>
          <button v-else type="button" class="btn btn--ghost btn--sm" @click="setDefault(m)">Set as default</button>
          <button type="button" class="btn btn--ghost btn--sm" @click="editMethod(m)">Edit details</button>
        </span>
      </div>

      <div class="panel__foot">
        <span class="stat-card__foot">
          Payouts route to the name on your verified account. Changing a method never changes an approved request.
        </span>
      </div>
    </section>

    <!-- Billing: the orders and their receipts, and nothing to do with cards. -->
    <section v-else class="panel" data-od-id="billing-history">
      <div class="panel__head">
        <span class="panel__title">Billing history</span>
        <span class="panel__actions">
          <label class="sr" for="billingStatus">Filter by status</label>
          <select id="billingStatus" v-model="billingFilter" class="select mng-filter" data-od-id="billing-status">
            <option v-for="f in BILLING_FILTERS" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
        </span>
      </div>

      <div class="table-wrap">
        <table class="data data--striped" style="min-width:760px" data-table="orders">
          <thead>
            <tr>
              <th>Date</th>
              <th>Order</th>
              <th>Amount</th>
              <th>Status</th>
              <th class="num">Receipt</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in billingPage" :key="o.id">
              <td class="dim">{{ o.date }}</td>
              <td class="mono-id">{{ o.id }}</td>
              <td class="num">{{ money(o.total) }}</td>
              <td>
                <span class="badge" :class="ORDER_STATUS_BADGE[o.status] || 'badge--pending'">
                  <span class="badge__dot" />{{ o.status }}
                </span>
              </td>
              <td class="num">
                <button type="button" class="rail__arrow mng-invoice" :aria-label="`Download receipt for order ${o.id}`" @click="invoice(o)">
                  <AppIcon name="download" :size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!billingRows.length" class="empty">
        <template v-if="billingFilter === 'all'"><strong>No orders yet</strong>Every order you place at checkout appears here with its receipt.</template>
        <template v-else><strong>Nothing with that status</strong>Choose another status to see the orders behind it.</template>
      </div>

      <div class="mng-pager">
        <label class="sr" for="billingPerPage">Rows per page</label>
        <span>Rows per page</span>
        <select id="billingPerPage" v-model.number="perPage" class="select">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>

        <span class="mng-pager__spacer">{{ rangeLabel }}</span>
        <button type="button" class="rail__arrow" :disabled="page <= 1" aria-label="Previous page" @click="page -= 1">
          <AppIcon name="chevronLeft" :size="16" />
        </button>
        <button type="button" class="rail__arrow" :disabled="page >= Math.ceil(billingRows.length / perPage)" aria-label="Next page" @click="page += 1">
          <AppIcon name="chevronRight" :size="16" />
        </button>
      </div>
    </section>

    <!-- Payout request: account + rail + destination; the desk's eligibility
       errors (422 + their own message) show inside the dialog. -->
  <ModalDialog
    v-if="requestOpen"
    title="Request a payout"
    subtitle="At the close of a cycle, on your share of the account's profit."
    @close="requestOpen = false"
  >
    <div class="stack" style="gap:12px">
      <div class="field">
        <label for="po-account">Funded account</label>
        <select id="po-account" v-model="requestForm.tradingAccountId" class="select" data-od-id="payout-account">
          <option disabled value="">Choose an account</option>
          <option v-for="a in ACCOUNTS.filter((x) => x.status === 'funded')" :key="a.id" :value="a.id">
            {{ a.number }} · {{ a.label }} — profit {{ money(a.pnl) }}
          </option>
        </select>
        <p v-if="!ACCOUNTS.some((x) => x.status === 'funded')" class="stat-card__foot">
          No funded accounts yet — a payout opens up once an evaluation is funded.
        </p>
      </div>

      <div class="field">
        <label for="po-method">Method</label>
        <select id="po-method" v-model="requestForm.method" class="select" data-od-id="payout-method">
          <option v-for="m in PAYOUT_METHOD_OPTIONS" :key="m.id" :value="m.id">{{ m.label }}</option>
        </select>
        <span class="stat-card__foot">{{ requestHint }}</span>
      </div>

      <div class="field">
        <label for="po-destination">Destination</label>
        <input
          id="po-destination"
          v-model="requestForm.destination"
          class="input"
          :placeholder="requestHint"
          autocomplete="off"
          data-od-id="payout-destination"
        />
      </div>

      <p v-if="requestError" class="stat-card__foot" style="color:var(--red,#e5484d)" role="alert" data-od-id="payout-error">
        {{ requestError }}
      </p>

      <div class="callout">
        <AppIcon name="check" :size="17" />
        <div>Requests are reviewed within one business day; the median settlement is under 24 hours after approval.</div>
      </div>
    </div>

    <template #actions>
      <button class="btn btn--ghost" @click="requestOpen = false">Cancel</button>
      <button
        class="btn btn--primary"
        :disabled="requestBusy || !requestForm.tradingAccountId || !requestForm.destination.trim()"
        data-od-id="payout-submit"
        @click="submitRequest"
      >{{ requestBusy ? 'Submitting…' : 'Submit request' }}</button>
    </template>
  </ModalDialog>
  </div>
</template>
