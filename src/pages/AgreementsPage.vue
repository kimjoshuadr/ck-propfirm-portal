<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { pushToast } from '../lib/ui.js'

/*
 * Account · Manage · Agreements.
 *
 * The reference's screen, in our colours: a title, a status filter and one
 * table — what the agreement is, whether it is signed, when it took effect, when
 * it was signed, and what you can do with it. Nothing else sits on the page;
 * the holder's details and the promo band that used to flank it were ours, not
 * the reference's.
 *
 * Only the affiliate terms are unsigned, and they are the one row with a real
 * action. Dates come from the account itself — this prototype opened on 14 Jun
 * 2026, the day the signed agreements took effect.
 */
const SIGNED_ON = '14 Jun 2026'

const AGREEMENTS = [
  {
    id: 'AGR-001',
    version: 'v4.2',
    title: 'Trader agreement',
    body: 'The master terms for every simulated evaluation and funded account — objectives, drawdown, scaling and what counts as a breach.',
    effective: SIGNED_ON,
    signedOn: SIGNED_ON,
    signed: true,
  },
  {
    id: 'AGR-002',
    version: 'v2.8',
    title: 'Payout terms',
    body: 'Profit split, payout cycles, eligible methods and the 24-hour median processing target. No hidden fees anywhere in the schedule.',
    effective: '—',
    signedOn: SIGNED_ON,
    signed: true,
  },
  {
    id: 'AGR-003',
    version: 'v1.9',
    title: 'Risk disclosure',
    body: 'Confirms you understand that every CK Propfirm account is simulated and no real capital is ever at stake in the evaluation environment.',
    effective: SIGNED_ON,
    signedOn: SIGNED_ON,
    signed: true,
  },
  {
    id: 'AGR-004',
    version: 'v1.3',
    title: 'Data processing addendum',
    body: 'How identity documents and trading data are stored, retained and deleted, and how to request an export.',
    effective: SIGNED_ON,
    signedOn: SIGNED_ON,
    signed: true,
  },
  {
    id: 'AGR-005',
    version: 'v1.1',
    title: 'Affiliate programme terms',
    body: 'Commission tiers, the 30-day attribution window and the payout schedule for referring traders.',
    effective: 'On signature',
    signedOn: '—',
    signed: false,
  },
]

const FILTERS = [
  { key: 'all', label: 'All statuses' },
  { key: 'signed', label: 'Signed' },
  { key: 'awaiting', label: 'Awaiting signature' },
]

const filter = ref('all')
const rows = computed(() => {
  if (filter.value === 'signed') return AGREEMENTS.filter((a) => a.signed)
  if (filter.value === 'awaiting') return AGREEMENTS.filter((a) => !a.signed)
  return AGREEMENTS
})

function view(a) {
  pushToast({ tone: 'info', title: a.title, msg: `${a.id} · ${a.version} — the full text opens in the live portal.` })
}

function download(a) {
  pushToast({ tone: 'info', title: `Download ${a.title}`, msg: 'This prototype bundles no PDF.' })
}

function signAffiliate() {
  pushToast({ tone: 'good', title: 'Affiliate terms signed', msg: 'Your referral link is live under Affiliates.' })
}
</script>

<template>
  <div class="ov" data-od-id="agreements-page">
    <div class="page-head util-head" data-od-id="page-head-agreements">
      <div class="page-head__text">
        <div class="eyebrow">Account · Agreements</div>
        <h1>Agreements</h1>
        <p class="dim">View and sign the legal agreements and contracts on your account.</p>
      </div>
    </div>

    <section class="panel" data-od-id="agreement-list">
      <div class="panel__head">
        <span class="panel__title">Your agreements</span>
        <span class="panel__actions">
          <label class="sr" for="agreementStatus">Filter by status</label>
          <select id="agreementStatus" v-model="filter" class="select agr-filter" data-od-id="agreement-status">
            <option v-for="f in FILTERS" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
        </span>
      </div>

      <div class="table-wrap">
        <table class="data data--striped" style="min-width:820px" data-table="agreements">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Effective date</th>
              <th>Signed date</th>
              <th class="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in rows" :key="a.id" :data-od-id="`agreement-${a.id.toLowerCase()}`">
              <td>
                <div class="agr-title">
                  <span class="cell-strong">{{ a.title }}</span>
                  <span class="mono-id">{{ a.id }} · {{ a.version }}</span>
                </div>
                <p class="agr-line">{{ a.body }}</p>
              </td>
              <td>
                <span class="badge" :class="a.signed ? 'badge--active' : 'badge--pending'">
                  <span class="badge__dot" />{{ a.signed ? 'signed' : 'awaiting signature' }}
                </span>
              </td>
              <td class="dim">{{ a.effective }}</td>
              <td class="dim">{{ a.signedOn }}</td>
              <td class="num">
                <div class="agr-actions">
                  <template v-if="a.signed">
                    <button class="btn btn--ghost btn--sm" @click="view(a)">View</button>
                    <button type="button" class="rail__arrow" :aria-label="`Download ${a.title}`" @click="download(a)">
                      <AppIcon name="download" :size="15" />
                    </button>
                  </template>
                  <button v-else class="btn btn--secondary btn--sm" @click="signAffiliate">Review &amp; sign</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!rows.length" class="empty">
        <strong>No agreements found</strong>Choose another status to see the rest of the file.
      </div>
    </section>
  </div>
</template>
