<script setup>
import { ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import PromoCard from '../components/PromoCard.vue'
import ReferralTable from '../components/ReferralTable.vue'
import TierTable from '../components/TierTable.vue'
import ModalDialog from '../components/ModalDialog.vue'
import { copyText } from '../lib/portal.js'
import { pushToast } from '../lib/ui.js'
import { FUNNEL, PAYOUT, REFERRAL, SHARE_KIT } from '../data/affiliates.js'

const shareOpen = ref(false)

const money = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

const copyLink = () => copyText(REFERRAL.link, 'Referral link copied')
const copyCode = () => copyText(REFERRAL.code, 'Referral code copied')

const asset = (name) =>
  pushToast({ tone: 'info', title: 'Asset pack queued', msg: `${name} downloads as a zip from the live portal.` })

const programmeTerms = () =>
  pushToast({ tone: 'info', title: 'Programme terms', msg: 'Affiliate terms v1.1 live under Manage → Agreements.' })

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
      <button class="btn btn--secondary" @click="shareOpen = true">Share link</button>
    </div>
  </div>

  <section class="card card--xl glow-card" style="margin-bottom:18px">
    <div class="card__body stack" style="gap:16px">
      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
        <div style="min-width:0;flex:1 1 320px">
          <div class="eyebrow">Your referral link</div>
          <h2 style="margin-top:8px">Your skill is our capital — share it</h2>
          <p class="dim" style="font-size:13.5px;margin-top:6px;max-width:62ch">
            Every trader who signs up through this link and funds an evaluation pays you.
            Attribution holds for {{ REFERRAL.attributionDays }} days after the click.
          </p>
        </div>
        <div class="stat" style="min-width:200px">
          <div class="stat__label">Referral code</div>
          <div class="stat__value" style="font-family:var(--mono);font-size:22px">{{ REFERRAL.code }}</div>
          <div class="stat__meta">{{ REFERRAL.attributionDays }}-day attribution window</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <label class="sr" for="refLink">Referral link</label>
        <input
          id="refLink"
          class="input"
          :value="REFERRAL.link"
          readonly
          style="flex:1 1 320px;font-family:var(--mono);font-size:13px"
        />
        <button class="btn btn--secondary" @click="copyLink">Copy link</button>
      </div>
    </div>
  </section>

  <div class="grid grid--cols-4" style="margin-bottom:18px">
    <div
      v-for="tile in FUNNEL"
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
      <ReferralTable />
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
            <div class="kv__row"><span class="kv__k">Available</span><span class="kv__v up">{{ money(PAYOUT.available) }}</span></div>
            <div class="kv__row"><span class="kv__k">Pending release</span><span class="kv__v">{{ money(PAYOUT.pending) }}</span></div>
            <div class="kv__row"><span class="kv__k">Next cycle</span><span class="kv__v">{{ PAYOUT.nextCycle }}</span></div>
            <div class="kv__row"><span class="kv__k">Method</span><span class="kv__v">{{ PAYOUT.method }}</span></div>
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

  <ModalDialog
    v-if="shareOpen"
    title="Share your referral link"
    :subtitle="`${REFERRAL.attributionDays}-day attribution from the first click.`"
    @close="shareOpen = false"
  >
    <div class="kv">
      <div class="kv__row"><span class="kv__k">Link</span><span class="kv__v">{{ REFERRAL.link }}</span></div>
      <div class="kv__row"><span class="kv__k">Code</span><span class="kv__v">{{ REFERRAL.code }}</span></div>
    </div>
    <div class="callout">
      <AppIcon name="spark" :size="17" />
      <div>Referred traders get {{ REFERRAL.discount }} off their first evaluation with your code.</div>
    </div>
    <template #actions>
      <button class="btn btn--ghost" @click="shareOpen = false">Close</button>
      <button class="btn btn--secondary" @click="copyCode">Copy code</button>
      <button class="btn btn--secondary" @click="copyLink">Copy link</button>
    </template>
  </ModalDialog>
</template>
