<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import { LS } from '../../lib/portal.js'
import { PAYOUTS, paidPayoutTotal } from '../../lib/portal.js'
import { money } from '../../lib/format.js'

const hidden = ref(LS.get('ck.hideBalance', '0') === '1')
const total = computed(() => paidPayoutTotal())
const paidCount = computed(() => PAYOUTS.filter((p) => p.status === 'paid').length)

function toggle() {
  hidden.value = !hidden.value
  LS.set('ck.hideBalance', hidden.value ? '1' : '0')
}
</script>

<template>
  <div class="payout" data-od-id="overview-payouts">
    <div class="payout__stack">
      <span class="payout__back" aria-hidden="true"></span>

      <div class="payout__face">
        <div class="payout__brand">
          <span class="payout__wordmark">CK PROPFIRM</span>
          <span class="payout__label">Payouts</span>
        </div>

        <span class="payout__label">Total withdrawals</span>
        <span class="payout__amount" :class="{ 'payout__amount--hidden': hidden }">
          {{ hidden ? '••••••' : money(total) }}
        </span>

        <div class="payout__foot">
          <span class="payout__note">{{ paidCount }} payouts settled</span>
          <button type="button" class="btn btn--ghost btn--sm" :aria-pressed="hidden" @click="toggle">
            <AppIcon :name="hidden ? 'eye' : 'lock'" :size="15" />
            {{ hidden ? 'Show balance' : 'Hide balance' }}
          </button>
        </div>
      </div>

      <span class="payout__sliver" aria-hidden="true"></span>
    </div>
  </div>
</template>
