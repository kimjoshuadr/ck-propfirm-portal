<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import ModalDialog from './ModalDialog.vue'
import PromoCard from './PromoCard.vue'
import {
  fetchPrograms, platformName, quoteCheckout, startCheckout,
} from '../lib/api.js'
import { referralCode } from '../lib/portal.js'

/*
 * The "New challenge" flow — the one dialog the sidebar CTA, the Overview hero
 * and the offer cards all open (shell.challenge, via openChallenge()).
 *
 * Steps: pick the challenge MODEL (tab) → program → size variant → platform →
 * add-ons (exclusive groups collapse each other) → coupon / referral → a LIVE
 * quote from the CRM (POST /checkout/quote, re-quoted on every cart change) →
 * gateway (Stripe / PayPal) → POST /checkout → the gateway's redirectUrl.
 *
 * Amounts are never computed here: the CRM re-prices the cart server-side and
 * the checkout re-computes the same quote again, so what the dialog shows is
 * the quote's own lines/total. A rejected coupon (422) shows its message under
 * the coupon field; a 428 legal_acceptance_required shows the accept-first
 * banner linking to the Agreements page; a gateway failure (502) tells the
 * trader to try the other rail.
 */
const emit = defineEmits(['close'])

/* ----------------------------------------------------------- catalogue */

const loading = ref(true)
const loadError = ref('')
const programs = ref([])

const MODEL_LABELS = {
  two_step: '2-Step',
  one_step: '1-Step',
  instant: 'Instant',
}

const modelTabs = computed(() => {
  const seen = []
  for (const p of programs.value) {
    if (!seen.some((t) => t.key === p.model)) {
      seen.push({ key: p.model, label: MODEL_LABELS[p.model] || p.model })
    }
  }
  return seen
})

const activeModel = ref('')
const modelPrograms = computed(() => programs.value.filter((p) => p.model === activeModel.value))
const program = computed(() => modelPrograms.value.find((p) => p.id === programId.value) || modelPrograms.value[0] || null)

const programId = ref('')

/* ------------------------------------------------------------ the cart */

const variantId = ref('')
const variants = computed(() => program.value?.variants || [])
const variant = computed(() => variants.value.find((v) => v.id === variantId.value) || null)

const platform = ref('')
const platforms = computed(() => program.value?.platforms || [])

const chosenAddonIds = ref([])
const chosenAddons = computed(() =>
  (program.value?.addons || []).filter((a) => chosenAddonIds.value.includes(a.id)))

const coupon = ref('')
const gateway = ref('stripe')
const GATEWAYS = [
  { id: 'stripe', label: 'Stripe', note: 'Card, Apple Pay, Google Pay' },
  { id: 'paypal', label: 'PayPal', note: 'PayPal balance or card' },
]

/* --------------------------------------------------------------- quote */

const quote = ref(null)
const quoting = ref(false)
const quoteError = ref('')
const couponError = ref('')
const checkoutBusy = ref(false)
const checkoutError = ref('')
const legalRequired = ref(false)

let quoteTimer = 0

function scheduleQuote() {
  window.clearTimeout(quoteTimer)
  quoting.value = true // keep the row honest between a change and the fetch
  quoteTimer = window.setTimeout(refreshQuote, 350)
}

async function refreshQuote() {
  if (!variant.value) { quote.value = null; quoting.value = false; return }
  try {
    quote.value = await quoteCheckout({
      variantId: variant.value.id,
      addonIds: [...chosenAddonIds.value],
      couponCode: coupon.value.trim() || undefined,
      platform: platform.value || undefined,
    })
    quoteError.value = ''
    couponError.value = quote.value?.couponError
      ? `Code "${coupon.value.trim().toUpperCase()}" was not applied — ${humanCouponError(quote.value.couponError)}`
      : ''
  } catch (err) {
    if (err?.status === 422 && err?.code === 'addon_group_conflict') {
      quoteError.value = err.message
    } else {
      quoteError.value = err?.message || 'Could not price this cart.'
    }
  } finally {
    quoting.value = false
  }
}

const COUPON_HINTS = {
  inactive: 'the code is not active',
  not_started: 'the code is not live yet',
  expired: 'the code has expired',
  usage_limit: 'the code has been used up',
  per_trader_limit: 'you have already used this code',
  first_purchase_only: 'the code is only valid on a first purchase',
  not_applicable: 'the code does not apply to this size',
}

const humanCouponError = (code) => COUPON_HINTS[code] || 'it was rejected'

/* ------------------------------------------------------- cart mutations */

function pickProgram(p) {
  programId.value = p.id
  const vs = p.variants || []
  variantId.value = vs[0]?.id || ''
  const ps = p.platforms?.length ? p.platforms : ['mt5']
  platform.value = ps.includes(platform.value) ? platform.value : ps[0]
  /* Drop add-ons the new program does not stock. */
  const stocked = new Set((p.addons || []).map((a) => a.id))
  chosenAddonIds.value = chosenAddonIds.value.filter((id) => stocked.has(id))
}

function toggleAddon(addon) {
  const on = chosenAddonIds.value.includes(addon.id)
  if (on) {
    chosenAddonIds.value = chosenAddonIds.value.filter((id) => id !== addon.id)
    return
  }
  /* Exclusive groups: a second payout cadence cannot ride along — picking one
     quietly unpicks the other (the server would 422 the cart otherwise). */
  let ids = chosenAddonIds.value
  if (addon.exclusiveGroup) {
    ids = ids.filter((id) => {
      const other = (program.value?.addons || []).find((a) => a.id === id)
      return other?.exclusiveGroup !== addon.exclusiveGroup
    })
  }
  chosenAddonIds.value = [...ids, addon.id]
  scheduleQuote()
}

const addonPriceLabel = (a) =>
  a.priceType === 'percent'
    ? `${Number(a.priceValue).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
    : `$${Number(a.priceValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

/* ------------------------------------------------------------- actions */

function close() {
  emit('close')
}

const firstRefusal = computed(() => !variant.value || checkoutBusy.value || quoting.value)

async function submit() {
  if (!variant.value || checkoutBusy.value) return
  checkoutBusy.value = true
  checkoutError.value = ''
  legalRequired.value = false
  try {
    const result = await startCheckout({
      variantId: variant.value.id,
      addonIds: [...chosenAddonIds.value],
      couponCode: coupon.value.trim() || undefined,
      platform: platform.value || undefined,
      gateway: gateway.value,
      referralCode: referralCode() || undefined,
    })
    /* The gateway owns the next screen. */
    if (result?.redirectUrl) {
      location.href = result.redirectUrl
      return
    }
    checkoutError.value = 'The gateway did not return a payment session. Please try again.'
  } catch (err) {
    if (err?.status === 428) {
      legalRequired.value = true
      checkoutError.value = err.message || 'Accept the updated legal documents before continuing.'
    } else if (err?.status === 422 && err?.code === 'addon_group_conflict') {
      checkoutError.value = err.message
    } else {
      checkoutError.value = err?.message || 'Could not start the checkout. Please try again.'
    }
  } finally {
    checkoutBusy.value = false
  }
}

/* The size table opens on the best-value tier, like the table it replaces. */
function openBestVariant() {
  const best = [...variants.value].sort((a, b) => (a.accountSize - b.accountSize))
    .find((v) => v.salePrice != null) || variants.value[0]
  variantId.value = best?.id || ''
}

/* ----------------------------------------------------------- lifecycle */

onMounted(async () => {
  try {
    const list = await fetchPrograms()
    programs.value = list
    activeModel.value = modelTabs.value[0]?.key || ''
    programId.value = list.find((p) => p.model === activeModel.value)?.id || ''
    const ps = program.value?.platforms?.length ? program.value.platforms : ['mt5']
    platform.value = ps[0]
    openBestVariant()
    await refreshQuote()
    loading.value = false
  } catch (err) {
    loadError.value = err?.message || 'Could not load the challenge catalogue.'
    loading.value = false
  }
})

onBeforeUnmount(() => window.clearTimeout(quoteTimer))

/* Re-quote whenever the cart moves. */
watch([variantId, platform], () => scheduleQuote())
watch(chosenAddonIds, () => scheduleQuote())
watch(coupon, () => { if (coupon.value.trim().length >= 4 || !coupon.value.trim()) scheduleQuote() })
</script>

<template>
  <ModalDialog
    title="Choose your next challenge"
    subtitle="One-time fee · simulated evaluation. No hidden fees, no time limits, news trading allowed."
    @close="close"
  >
    <!-- catalogue levels -->
    <template v-if="loading">
      <p class="dim" style="padding:14px 0">Loading the challenge catalogue…</p>
    </template>

    <template v-else-if="loadError">
      <div class="callout callout--warn">
        <AppIcon name="alert" :size="17" />
        <div>{{ loadError }}</div>
      </div>
    </template>

    <template v-else>
      <div class="stack" style="gap:14px">
        <!-- 1 · model tabs -->
        <div class="seg" role="tablist" aria-label="Challenge model">
          <button
            v-for="t in modelTabs"
            :key="t.key"
            type="button"
            class="seg__btn"
            :class="{ 'is-on': activeModel === t.key }"
            role="tab"
            :aria-selected="activeModel === t.key"
            @click="activeModel = t.key; pickProgram(modelPrograms[0])"
          >{{ t.label }}</button>
        </div>

        <!-- 2 · program chips inside the model -->
        <div v-if="modelPrograms.length > 1" class="btn-row">
          <button
            v-for="p in modelPrograms"
            :key="p.id"
            type="button"
            class="btn"
            :class="p.id === program?.id ? 'btn--secondary' : 'btn--ghost'"
            @click="pickProgram(p)"
          >{{ p.name }}</button>
        </div>

        <!-- 3 · size table -->
        <div class="table-wrap">
          <table class="data" style="min-width:460px">
            <thead>
              <tr>
                <th>Size</th>
                <th class="num">Leverage</th>
                <th class="num">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="v in variants"
                :key="v.id"
                :class="{ 'is-selected': v.id === variantId }"
                style="cursor:pointer"
                @click="variantId = v.id"
              >
                <td class="cell-strong">{{ Math.round(v.accountSize / 1000) }}K</td>
                <td class="num dim">{{ program?.leverage ? `1:${program.leverage}` : '—' }}</td>
                <td class="num">
                  <span v-if="v.salePrice != null && v.salePrice < v.listPrice" class="dim" style="text-decoration:line-through">${{ v.listPrice.toFixed(2) }}</span>
                  <span class="up">${{ (v.salePrice ?? v.listPrice).toFixed(2) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 4 · platform -->
        <div class="field">
          <label for="chk-platform">Platform</label>
          <select id="chk-platform" v-model="platform" class="select">
            <option v-for="p in platforms" :key="p" :value="p">{{ platformName(p) }}</option>
          </select>
        </div>

        <!-- 5 · add-ons -->
        <div v-if="program?.addons?.length" class="field">
          <label>Add-ons</label>
          <div class="stack" style="gap:8px">
            <label
              v-for="a in program.addons"
              :key="a.id"
              class="check chk-addon"
              :title="a.exclusiveGroup ? 'Another add-on in this group is already selected' : ''"
            >
              <input
                type="checkbox"
                :checked="chosenAddonIds.includes(a.id)"
                @change="toggleAddon(a)"
              />
              <span style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
                <b>{{ a.name }}</b>
                <span class="dim" style="font-size:12.5px">{{ a.description || '' }}</span>
                <span class="mono" style="margin-left:auto">{{ addonPriceLabel(a) }}</span>
              </span>
            </label>
          </div>
        </div>

        <!-- 6 · coupon + referral -->
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
          <div class="field" :class="{ 'is-invalid': !!couponError }">
            <label for="chk-coupon">Coupon code</label>
            <input id="chk-coupon" v-model="coupon" class="input" placeholder="e.g. 10KFOR19" autocomplete="off" />
            <span v-if="couponError" class="field__error" style="display:block">{{ couponError }}</span>
          </div>
          <div class="field">
            <label for="chk-referral">Referral code</label>
            <input id="chk-referral" :value="referralCode() || ''" class="input" placeholder="Not referred? Leave blank" disabled />
          </div>
        </div>
        <p v-if="referralCode()" class="stat-card__foot" style="margin-top:-6px">
          Referred by code <b class="mono">{{ referralCode() }}</b> — captured from your link.
        </p>

        <!-- promo strip: the sale tiers, when one is on offer -->
        <PromoCard v-if="variant?.salePrice != null && variant.salePrice < variant.listPrice" />

        <!-- legal acceptance gate (428) -->
        <div v-if="legalRequired" class="callout callout--warn">
          <AppIcon name="shield" :size="17" />
          <div>
            <strong>One step first.</strong> A new or updated legal document needs your acceptance before this purchase.
            <a class="agr-link" href="#manage/agreements" @click="close">Review and accept under Agreements</a>.
          </div>
        </div>

        <!-- quote -->
        <div class="panel" style="box-shadow:none">
          <div class="panel__head">
            <span class="panel__title">Today's total</span>
            <span class="panel__actions">
              <span v-if="quoting" class="stat-card__foot">Pricing…</span>
              <span v-else-if="quote" class="mng-total">${{ quote.total.toFixed(2) }}</span>
            </span>
          </div>
          <div v-if="quote" class="kv" style="padding:0 2px 8px">
            <div v-for="line in quote.lines" :key="line.refId + line.kind" class="kv__row">
              <span class="kv__k">{{ line.label }}</span>
              <span class="kv__v">${{ line.amount.toFixed(2) }}</span>
            </div>
            <div v-if="quote.discount > 0" class="kv__row">
              <span class="kv__k">Discount{{ quote.couponError ? ' (not applied)' : '' }}</span>
              <span class="kv__v up">−${{ quote.discount.toFixed(2) }}</span>
            </div>
          </div>
          <p v-if="quoteError" class="stat-card__foot" style="color:var(--red,#e5484d)">{{ quoteError }}</p>
        </div>

        <!-- 7 · gateway -->
        <div class="field">
          <label>Pay with</label>
          <div class="btn-row">
            <button
              v-for="g in GATEWAYS"
              :key="g.id"
              type="button"
              class="btn"
              :class="gateway === g.id ? 'btn--secondary' : 'btn--ghost'"
              :aria-pressed="gateway === g.id"
              @click="gateway = g.id"
            >
              <AppIcon :name="g.id === 'stripe' ? 'check' : 'wallet'" :size="15" />
              {{ g.label }} <span class="dim" style="font-weight:400">· {{ g.note }}</span>
            </button>
          </div>
        </div>

        <p v-if="checkoutError" class="stat-card__foot" style="color:var(--red,#e5484d)" role="alert">{{ checkoutError }}</p>
      </div>
    </template>

    <template #actions>
      <button class="btn btn--ghost" @click="close">Not now</button>
      <button
        class="btn btn--primary"
        :disabled="loading || loadError || firstRefusal"
        data-od-id="checkout-submit"
        @click="submit"
      >
        <AppIcon name="rocket" :size="15" />
        {{ checkoutBusy ? 'Starting checkout…' : quote ? `Start evaluation — $${quote.total.toFixed(2)}` : 'Start evaluation' }}
      </button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.chk-addon { align-items: flex-start; }
.is-selected > td { background: color-mix(in oklab, #703ad7 14%, transparent) !important; }
.agr-link { color: var(--violet-text, #b18cff); text-decoration: underline; }
</style>
