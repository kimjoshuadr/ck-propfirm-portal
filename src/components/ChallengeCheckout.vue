<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import ModalDialog from './ModalDialog.vue'
import { fetchLegalPending, fetchPrograms, quoteCheckout, startCheckout } from '../lib/api.js'
import { pushToast } from '../lib/ui.js'

/*
 * "New challenge" — one dialog, the whole flow:
 *
 * 1. tabs across challenge models, one program each;
 * 2. size variant (radio row);
 * 3. platform (from the program's allowed platforms);
 * 4. add-ons (exclusive groups collapse each other);
 * 5. coupon code + a LIVE quote — POST /checkout/quote whenever the cart
 *    moves; the total is always the server's;
 * 6. gateway (Stripe / PayPal) → POST /checkout → the gateway's redirectUrl.
 *
 * Server refusals surface inline: a 422 coupon rejection under the coupon
 * field with its machine code translated, an addon_group_conflict in the cart,
 * and a 428 legal_acceptance_required as the accept-first banner linking to
 * Manage → Agreements (checked up front via GET legal/pending too).
 */
const emit = defineEmits(['close'])

/* ------------------------------------------------------------ catalogue */

const loading = ref(true)
const loadError = ref('')
const programs = ref([])
const activeModel = ref('')

const MODEL_LABELS = { two_step: '2-Step', one_step: '1-Step', instant: 'Instant' }
const modelTabs = computed(() => {
  const seen = new Map()
  for (const p of programs.value) seen.set(p.model, MODEL_LABELS[p.model] || p.model)
  return [...seen].map(([key, label]) => ({ key, label }))
})

const program = computed(() =>
  programs.value.find((p) => p.model === activeModel.value) || programs.value[0] || null)

const variants = computed(() => program.value?.variants || [])
const variantId = ref('')
const variant = computed(() =>
  variants.value.find((v) => v.id === variantId.value) || variants.value[0] || null)

const platforms = computed(() => program.value?.platforms?.length ? program.value.platforms : ['mt5'])
const platform = ref('')

const addons = computed(() => program.value?.addons || [])
const addonIds = ref([])

const sizeLabel = (v) => (v?.accountSize ? `${Math.round(v.accountSize / 1000).toLocaleString('en-US')}K` : '—')

/* Exclusive groups collapse each other: the API would 422 the cart anyway
 * (addon_group_conflict), so the modal never asks for an impossible one. */
function toggleAddon(addon) {
  const group = (addon.exclusiveGroup || '').trim()
  if (!group) {
    addonIds.value = addonIds.value.includes(addon.id)
      ? addonIds.value.filter((id) => id !== addon.id)
      : [...addonIds.value, addon.id]
    return
  }
  const members = addons.value.filter((a) => (a.exclusiveGroup || '').trim() === group)
  const wasOn = addonIds.value.includes(addon.id)
  addonIds.value = addonIds.value.filter((id) => !members.some((m) => m.id === id))
  if (!wasOn) addonIds.value = [...addonIds.value, addon.id]
}

const addonPriceLabel = (a) => {
  if (a.priceType === 'percent') return `${Number(a.priceValue).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
  return `$${Number(a.priceValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

/* --------------------------------------------------------------- quote */

const quote = ref(null)
const quoteBusy = ref(false)
const quoteError = ref('')

let quoteTimer = 0
function scheduleQuote() {
  window.clearTimeout(quoteTimer)
  quoteBusy.value = true
  quoteTimer = window.setTimeout(refreshQuote, 300)
}

async function refreshQuote() {
  if (!program.value || !variant.value) { quoteBusy.value = false; return }
  quoteBusy.value = true
  try {
    quote.value = await quoteCheckout({
      variantId: variant.value.id,
      addonIds: [...addonIds.value],
      couponCode: coupon.value.trim().toUpperCase() || undefined,
      platform: platform.value || undefined,
    })
    /* The quote's own coupon verdict wins over any stale local guess. */
    couponError.value = quote.value?.couponError
      ? couponHint(quote.value.couponError)
      : ''
  } catch (err) {
    quote.value = null
    quoteError.value = err?.message || 'Could not price this cart.'
  } finally {
    quoteBusy.value = false
  }
}

watch([variantId, platform, () => addonIds.value.slice().join(','), () => coupon.value.trim().toUpperCase()], () => {
  scheduleQuote()
})

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`

/* ------------------------------------------------------------- coupon */

const coupon = ref('')
const couponError = ref('')

const COUPON_HINTS = {
  inactive: 'This code is not active',
  expired: 'This code has expired',
  usage_limit: 'This code has reached its usage limit',
  per_trader_limit: 'You have already used this code',
  first_purchase_only: 'This code only applies to a first purchase',
  not_applicable: 'This code does not apply to this size',
}

const couponHint = (code) => COUPON_HINTS[code] || `Coupon rejected (${code})`

/* ------------------------------------------------------------ checkout */

const GATEWAYS = [
  { id: 'stripe', label: 'Stripe (card)' },
  { id: 'paypal', label: 'PayPal' },
]
const gateway = ref('stripe')
const checkoutBusy = ref(false)
const checkoutError = ref('')
const legalRequired = ref(false)

async function checkLegal() {
  try {
    const pending = await fetchLegalPending()
    legalRequired.value = pending.length > 0
  } catch { /* the checkout re-checks server-side anyway */ }
}

async function submit() {
  if (!variant.value || checkoutBusy.value) return
  checkoutBusy.value = true
  checkoutError.value = ''
  try {
    const result = await startCheckout({
      variantId: variant.value.id,
      addonIds: [...addonIds.value],
      couponCode: coupon.value.trim().toUpperCase() || undefined,
      platform: platform.value || undefined,
      gateway: gateway.value,
    })
    /* The gateway owns the next screen. */
    if (result?.redirectUrl) {
      window.location.href = result.redirectUrl
      return
    }
    pushToast({ tone: 'good', title: 'Order placed', msg: `Order ${result?.orderId ?? ''} — no gateway redirect came back; the account is reserved.` })
  } catch (err) {
    if (err?.status === 428) {
      legalRequired.value = true
      checkoutError.value = 'New or updated legal terms need your acceptance before this purchase — open Manage → Agreements.'
    } else if (err?.code === 'addon_group_conflict') {
      checkoutError.value = 'Those add-ons are mutually exclusive — keep one per group.'
    } else if (err?.status === 422 && err?.code) {
      couponError.value = couponHint(err.code)
    } else {
      checkoutError.value = err?.message || 'Could not start the checkout. Please try again.'
    }
  } finally {
    checkoutBusy.value = false
  }
}

/* ------------------------------------------------------------ lifecycle */

onMounted(async () => {
  try {
    programs.value = await fetchPrograms()
    activeModel.value = programs.value[0]?.model || ''
    variantId.value = program.value?.variants?.[0]?.id || ''
    platform.value = platforms.value[0] || 'mt5'
    loading.value = false
    await refreshQuote()
    checkLegal()
  } catch (err) {
    loadError.value = err?.message || 'Could not load the challenge catalogue.'
    loading.value = false
  }
})

onBeforeUnmount(() => window.clearTimeout(quoteTimer))
</script>

<template>
  <ModalDialog
    title="Choose your next challenge"
    subtitle="One-time fee · simulated evaluation · up to 100% profit split"
    @close="$emit('close')"
  >
    <p v-if="loading" class="dim" style="padding:14px 0">Loading the challenge catalogue…</p>

    <div v-else-if="loadError" class="callout callout--warn">
      <AppIcon name="alert" :size="17" />
      <div>{{ loadError }}</div>
    </div>

    <div v-else class="stack" style="gap:14px">
      <!-- 428 up front: the accept-first banner -->
      <div v-if="legalRequired" class="callout callout--warn" data-od-id="legal-required">
        <AppIcon name="shield" :size="17" />
        <div>
          New or updated legal terms need your acceptance before this purchase.
          <a href="#manage/agreements" @click="$emit('close')">Review them under Manage → Agreements</a>.
        </div>
      </div>

      <!-- 1 · model tabs -->
      <div v-if="modelTabs.length > 1" class="tabs" role="tablist" aria-label="Challenge model">
        <button
          v-for="t in modelTabs"
          :key="t.key"
          type="button"
          class="tab"
          role="tab"
          :class="{ 'is-current': t.key === activeModel }"
          :aria-selected="t.key === activeModel"
          @click="activeModel = t.key; variantId = variants[0]?.id || ''; platform = platforms[0] || 'mt5'; addonIds = []; scheduleQuote()"
        >{{ t.label }}</button>
      </div>

      <div v-if="program" class="stat-card__foot">
        {{ program.name }}<template v-if="program.tagline"> — {{ program.tagline }}</template>
      </div>

      <!-- 2 · size -->
      <div v-if="variants.length" class="table-wrap">
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
              <td class="cell-strong">{{ sizeLabel(v) }}</td>
              <td class="num dim">{{ program?.leverage ? `1:${program.leverage}` : '—' }}</td>
              <td class="num">
                <span v-if="v.salePrice != null && v.salePrice < v.listPrice" class="dim" style="text-decoration:line-through">{{ money(v.listPrice) }}</span>
                <span class="up">{{ money(v.salePrice ?? v.listPrice) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3 · platform -->
      <div v-if="platforms.length > 1" class="field">
        <label for="chk-platform">Platform</label>
        <select id="chk-platform" v-model="platform" class="select">
          <option v-for="p in platforms" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <p v-else class="stat-card__foot" style="margin-top:-6px">Runs on {{ platformName(platforms[0]) }}</p>

      <!-- 4 · add-ons (exclusive groups collapse each other) -->
      <div v-if="addons.length">
        <div class="stat-card__foot" style="margin-bottom:8px">Add-ons</div>
        <label
          v-for="a in addons"
          :key="a.id"
          class="check chk-addon"
          :title="a.exclusiveGroup ? 'Exclusive — another add-on in this group cannot ride along' : ''"
        >
          <input
            type="checkbox"
            :checked="addonIds.includes(a.id)"
            :disabled="checkoutBusy"
            @change="toggleAddon(a)"
          />
          <span style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">
            <b>{{ a.name }}</b>
            <span class="dim" style="font-size:12.5px">{{ a.description || addonPriceLabel(a) }}</span>
          </span>
        </label>
      </div>

      <!-- 5 · coupon + the live quote -->
      <div v-if="couponError" class="field" style="margin-bottom:-4px">
        <span class="field__error" style="display:block" data-od-id="coupon-error">{{ couponError }}</span>
      </div>

      <div class="field">
        <label for="chk-coupon">Coupon code</label>
        <input
          id="chk-coupon"
          v-model="coupon"
          class="input"
          :class="{ 'is-invalid': !!couponError }"
          placeholder="e.g. WELCOME10"
          autocomplete="off"
          :disabled="checkoutBusy"
          data-od-id="checkout-coupon"
        />
      </div>

      <div class="panel" style="box-shadow:none">
        <div class="panel__head">
          <span class="panel__title">Today's total</span>
          <span v-if="quoteBusy" class="stat-card__foot">Pricing…</span>
        </div>
        <div v-if="quote" class="kv" style="padding:0 2px 8px">
          <div v-for="(line, i) in quote.lines" :key="`${line.kind}-${line.refId}-${i}`" class="kv__row">
            <span class="kv__k">{{ line.kind === 'variant' ? `${program?.name || 'Challenge'} · ${sizeLabel(variant)}` : line.label }}</span>
            <span class="kv__v">{{ money(line.amount) }}</span>
          </div>
          <div v-if="quote.discount > 0" class="kv__row">
            <span class="kv__k">Discount</span>
            <span class="kv__v up">−{{ money(quote.discount) }}</span>
          </div>
          <div class="kv__row">
            <span class="kv__k"><b>Total</b></span>
            <span class="kv__v"><b>{{ money(quote.total) }} {{ quote.currency }}</b></span>
          </div>
        </div>
        <p v-else-if="quoteError" class="stat-card__foot" style="color:var(--red,#e5484d);padding:0 2px 8px">{{ quoteError }}</p>
      </div>

      <!-- 6 · gateway -->
      <div class="field">
        <label for="chk-gateway">Pay with</label>
        <div class="btn-row">
          <button
            v-for="g in GATEWAYS"
            :key="g.id"
            type="button"
            class="btn"
            :class="gateway === g.id ? 'btn--primary' : 'btn--ghost'"
            :aria-pressed="gateway === g.id"
            @click="gateway = g.id"
          >{{ g.label }}</button>
        </div>
      </div>

      <p v-if="checkoutError" class="stat-card__foot" style="color:var(--red,#e5484d)" role="alert" data-od-id="checkout-error">
        {{ checkoutError }}
      </p>
    </div>

    <template #actions>
      <button class="btn btn--ghost" @click="$emit('close')">Not now</button>
      <button
        class="btn btn--primary"
        :disabled="!quote || checkoutBusy || legalRequired"
        data-od-id="checkout-submit"
        @click="submit"
      >
        <AppIcon name="rocket" :size="15" />
        {{ quote ? `Start evaluation — ${money(quote.total)}` : 'Start evaluation' }}
      </button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.chk-addon { align-items: flex-start; }
.is-selected > td { background: rgba(112, 58, 215, 0.12); }
</style>
