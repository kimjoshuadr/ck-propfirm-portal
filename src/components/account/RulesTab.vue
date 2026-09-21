<script setup>
import AppIcon from '../AppIcon.vue'
import { money } from '../../lib/format.js'

const props = defineProps({ account: { type: Object, required: true } })

/* Every row is either a field we hold or a policy the brand states out loud
   (no hidden fees, no time limits, news trading allowed). */
const rules = () => [
  { label: 'Account size', value: money(props.account.size), note: 'Simulated capital, not real money.' },
  { label: 'Profit target', value: props.account.profitTarget ? money(props.account.profitTarget) : 'Not applicable on a funded account', note: 'No time limit to reach it.' },
  { label: 'Max loss', value: money(props.account.maxLoss), note: props.account.drawdownType === 'Static' ? 'Static — the floor never moves.' : 'Trailing lock arms above the starting balance.' },
  { label: 'Max daily loss', value: money(props.account.dailyLoss), note: 'Resets at 00:00 UTC.' },
  { label: 'Minimum trading days', value: props.account.minTradingDays ? `${props.account.minTradingDays} days` : 'None on a funded account', note: 'Days with at least one closed trade.' },
  { label: 'Drawdown type', value: props.account.drawdownType, note: 'Printed on the account card.' },
  { label: 'Inactivity', value: '30 days', note: 'An account with no trades for 30 days is paused, not closed.' },
  { label: 'Overnight positions', value: 'Allowed', note: 'Hold through the session close.' },
  { label: 'Weekend positions', value: 'Allowed', note: 'Nothing is force-closed on Friday.' },
  { label: 'News trading', value: 'Allowed', note: 'No restricted windows, no hidden fees.' },
  { label: 'Platform', value: props.account.platform, note: 'Credentials are issued at purchase.' },
]
</script>

<template>
  <div class="acc-cols acc-cols--even" data-od-id="account-rules">
    <section class="panel">
      <div class="panel__head">
        <span class="panel__title">Trading objectives</span>
        <span class="panel__actions"><span class="badge">{{ account.plan }}</span></span>
      </div>
      <div style="padding:6px 18px 18px">
        <div v-for="r in rules().slice(0, 6)" :key="r.label" class="obj-row">
          <div class="obj-row__top"><span>{{ r.label }}</span><span class="obj-row__value">{{ r.value }}</span></div>
          <div class="obj-row__note"><span>{{ r.note }}</span></div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel__head"><span class="panel__title">Permitted practice</span></div>
      <div style="padding:6px 18px 18px">
        <div v-for="r in rules().slice(6)" :key="r.label" class="obj-row">
          <div class="obj-row__top">
            <span>{{ r.label }}</span>
            <span class="obj-row__value" :class="{ up: r.value === 'Allowed' }">{{ r.value }}</span>
            <span v-if="r.value === 'Allowed'" class="obj-row__state obj-row__state--good"><AppIcon name="check" :size="15" /></span>
          </div>
          <div class="obj-row__note"><span>{{ r.note }}</span></div>
        </div>
      </div>
    </section>
  </div>
</template>
