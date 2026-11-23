<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import PromoCard from '../components/PromoCard.vue'
import TierTable from '../components/TierTable.vue'
import ModalDialog from '../components/ModalDialog.vue'
import { affiliate, copyText, enrollAffiliate } from '../lib/portal.js'
import { pushToast } from '../lib/ui.js'
import { SHARE_KIT } from '../data/affiliates.js'

/*
 * Account · Affiliates — live.
 *
 * The summary (code, referral count, commission totals in the three states)
 * and the commission list come from the CRM's affiliate ledger
 * (GET/POST /api/portal_api/portal/affiliate). A trader who is not in the
 * programme yet gets the become-an-affiliate CTA instead of a dashboard.
 * The referral link is this deployment's own origin with the code: the same
 * pattern the checkout's ?ref= capture reads. The commission TIER table is
 * still desk copy (no tiers endpoint) and is badged as demo data.
 */
const shareOpen = ref(false)
const joining = ref(false)
const joinError = ref('')

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

const referralLink = computed(() => {
  if (!affiliate.summary?.code) return ''
  return `${location.origin}/?ref=${affiliate.summary.code}`
})

const funnel = computed(() => {
  const s = affiliate.summary
  if (!s) return []
  return [
    { label: 'Funded referrals', value: String(s.referralsCount), meta: `lifetime, first-wins attribution`, tone: 'good', bar: Math.min(100, s.referralsCount * 5) },
    { label: 'Commission pending', value: money(s.pending), meta: 'waiting on the payout cycle', tone: '', bar: 0 },
    { label: 'Approved', value: money(s.approved), meta: 'cleared for the next cycle', tone: '', bar: 0 },
    { label: 'Paid to date', value: money(s.paid), meta: `${s.commissionPct}% of referred orders · ${s.currency}`, tone: 'alert', bar: 0 },
  ]
})

const STATUS_BADGE = {
  approved: 'badge--active',
  paid: 'badge--active',
  pending: 'badge--pending',
  reversed: 'badge--rejected',
}

async function becomeAffiliate() {
  joining.value = true
  joinError.value = ''
  try {
    await enrollAffiliate()
    pushToast({ tone: 'good', title: 'You are in the programme', msg: `Your referral code is ${affiliate.summary?.code}.` })
  } catch (err) {
    joinError.value = err?.message || 'Could not enroll right now. Please try again.'
  } finally {
    joining.value = false
  }
}

const copyLink = () => copyText(referralLink.value, 'Referral link copied')
const copyCode = () => copyText(affiliate.summary?.code || '', 'Referral code copied')

const asset = (name) =>
  pushToast({ tone: 'info', title: 'Asset pack queued', msg: `${name} downloads as a zip from the live portal.` })

const programmeTerms = () =>
  pushToast({ tone: 'info', title: 'Programme terms', msg: 'Affiliate terms live under Manage → Agreements.' })

const changeMethod = () =>
  pushToast({ tone: 'info', title: 'Payout methods', msg: 'Commission pays to the method set under Manage → Withdrawals.' })
</script>

<template>
  <div class="page-head">
    <div class="page-head__text">
      <div class="eyebrow">Account · Affiliates</div>
      <h1 style="margin-top:8px">Affiliates</h1>
      <p class="dim" style="margin-top:8px;max-width:70ch">
        Refer a trader, get paid when they fund. One link, one dashboard, no tiers of fine print.
        Commission lands in the same payout cycle as your trading profits.
      </p>
    </div>
    <div class="page-head__actions">
      <button class="btn btn--ghost" @click="programmeTerms">Programme terms</button>
      <button v-if="affiliate.enrolled" class="btn btn--secondary" @click="shareOpen = true">Share link</button>
    </div>
  </div>

  <!-- Not yet in the programme: the CTA is the page. -->
  <section v-if="affiliate.loaded && !affiliate.enrolled" class="card card--xl glow-card" style="margin-bottom:18px">
    <div class="card__body stack" style="gap:14px">
      <div class="eyebrow">Affiliate programme</div>
      <h2>Your skill is our capital — share it</h2>
      <p class="dim" style="font-size:13.5px;max-width:62ch">
        Enroll to get your referral code. Every trader who signs up through your link and funds an
        evaluation pays you commission, tracked here and paid on the trading payout cycle.
      </p>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="btn btn--primary" :disabled="joining" data-od-id="become-affiliate" @click="becomeAffiliate">
          <AppIcon name="users" :size="15" />{{ joining ? 'Enrolling…' : 'Become an affiliate' }}
        </button>
        <span v-if="joinError" class="stat-card__foot" style="color:var(--red,#e5484d)" role="alert">{{ joinError }}</span>
      </div>
    </div>
  </section>

  <template v-else-if="affiliate.enrolled && affiliate.summary">
    <section class="card card--xl glow-card" style="margin-bottom:18px">
      <div class="card__body stack" style="gap:16px">
        <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
          <div style="min-width:0;flex:1 1 320px">
            <div class="eyebrow">Your referral link</div>
            <h2 style="margin-top:8px">Your skill is our capital — share it</h2>
            <p class="dim" style="font-size:13.5px;margin-top:6px;max-width:62ch">
              Every trader who signs up through this link and funds an evaluation pays you.
              Attribution is lifetime first-wins: the first code a trader uses, keeps them.
            </p>
          </div>
          <div class="stat" style="min-width:200px">
            <div class="stat__label">Referral code</div>
            <div class="stat__value" style="font-family:var(--mono);font-size:22px">{{ affiliate.summary.code }}</div>
            <div class="stat__meta">{{ affiliate.summary.status }} · {{ affiliate.summary.commissionPct }}% commission</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <label class="sr" for="refLink">Referral link</label>
          <input
            id="refLink"
            class="input"
            :value="referralLink"
            readonly
            style="flex:1 1 320px;font-family:var(--mono);font-size:13px"
          />
          <button class="btn btn--secondary" @click="copyLink">Copy link</button>
        </div>
      </div>
    </section>

    <div class="grid grid--cols-4" style="margin-bottom:18px">
      <div
        v-for="tile in funnel"
        :key="tile.label"
        class="stat"
        :class="tile.tone ? `stat--${tile.tone}` : null"
      >
        <div class="stat__label">{{ tile.label }}</div>
        <div class="stat__value">{{ tile.value }}</div>
        <div v-if="tile.bar" class="stat__bar"><i :style="{ width: `${tile.bar}%` }"></i></div>
        <div class="stat__meta">{{ tile.meta }}</div>
      </div>
    </div>

    <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(300px,0.9fr);align-items:start">
      <div class="stack">
        <!-- Commissions — the CRM's ledger, newest first. -->
        <section class="card card--flush">
          <div class="card__head">
            <h3>Commissions</h3>
            <div class="card__actions">
              <span class="stat-card__foot">{{ affiliate.commissions.length }} on record</span>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data" data-table="commissions">
              <thead>
                <tr>
                  <th>Recorded</th>
                  <th class="num">Order total</th>
                  <th class="num">Your commission</th>
                  <th class="num">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in affiliate.commissions" :key="c.id">
                  <td class="dim">{{ c.createdLabel }}</td>
                  <td class="num">{{ money(c.orderTotal) }}</td>
                  <td class="num up">{{ money(c.commission) }}</td>
                  <td>
                    <span class="badge" :class="STATUS_BADGE[c.status] || ''"><span class="badge__dot" />{{ c.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="!affiliate.commissions.length" class="empty">
            <strong>No commissions yet</strong>Share your link — every funded referral lands on this table.
          </div>
        </section>

        <TierTable />
      </div>

      <div class="stack">
        <section class="card">
          <div class="card__head">
            <h3>Commission payout</h3>
            <div class="card__actions">
              <span class="badge badge--pending"><span class="badge__dot"></span>next cycle</span>
            </div>
          </div>
          <div class="card__body stack" style="gap:14px">
            <div class="kv">
              <div class="kv__row"><span class="kv__k">Approved</span><span class="kv__v up">{{ money(affiliate.summary.approved) }}</span></div>
              <div class="kv__row"><span class="kv__k">Pending release</span><span class="kv__v">{{ money(affiliate.summary.pending) }}</span></div>
              <div class="kv__row"><span class="kv__k">Paid to date</span><span class="kv__v">{{ money(affiliate.summary.paid) }}</span></div>
              <div class="kv__row"><span class="kv__k">Currency</span><span class="kv__v">{{ affiliate.summary.currency }}</span></div>
            </div>
            <div class="callout callout--proof">
              <AppIcon name="check" :size="17" />
              <div>Commission pays on the same schedule as trading payouts — no separate wait.</div>
            </div>
            <button class="btn btn--ghost btn--block btn--sm" @click="changeMethod">Change payout method</button>
          </div>
        </section>

        <section class="card">
          <div class="card__head"><h3>Share kit</h3></div>
          <div class="card__body stack" style="gap:12px">
            <p class="dim" style="font-size:13.5px">
              Banners, payout receipts and story frames the CK Fam actually uses.
              No redrawn marks — these are the brand files.
            </p>
            <div class="btn-row">
              <button
                v-for="name in SHARE_KIT"
                :key="name"
                class="btn btn--ghost btn--sm"
                @click="asset(name)"
              >
                {{ name }}
              </button>
            </div>
          </div>
        </section>

        <PromoCard />
      </div>
    </div>
  </template>

  <p v-else class="dim" style="padding:14px 0">Loading your affiliate dashboard…</p>

  <ModalDialog
    v-if="shareOpen"
    title="Share your referral link"
    subtitle="Lifetime first-wins attribution from the first code used."
    @close="shareOpen = false"
  >
    <div class="kv">
      <div class="kv__row"><span class="kv__k">Link</span><span class="kv__v">{{ referralLink }}</span></div>
      <div class="kv__row"><span class="kv__k">Code</span><span class="kv__v">{{ affiliate.summary.code }}</span></div>
    </div>
    <div class="callout">
      <AppIcon name="spark" :size="17" />
      <div>The code also rides along at checkout: a referred trader's first evaluation attributes to you even when they buy on the CRM's own domain.</div>
    </div>
    <template #actions>
      <button class="btn btn--ghost" @click="shareOpen = false">Close</button>
      <button class="btn btn--secondary" @click="copyCode">Copy code</button>
      <button class="btn btn--secondary" @click="copyLink">Copy link</button>
    </template>
  </ModalDialog>
</template>
