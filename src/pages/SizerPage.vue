<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { INSTRUMENTS, analyticsFor, maxLossToday } from '../data/portal.js'
import { money as fmtMoney } from '../lib/format.js'
import { activeAccount, copyText } from '../lib/portal.js'

/*
 * Tools · Position size calculator.
 *
 * The arithmetic is the whole point, so it is written once and echoed in the
 * panels beside it: money risked per lot = stop × pip size × contract size, and
 * the position is the risk budget divided by that. The deposit currency only
 * chooses the symbol — there is no FX conversion, which the warning line says
 * out loud when the deposit differs from the pair's quote currency.
 *
 * The page is built from the same parts as the rest of the portal — page head,
 * panels, stat cards, the seg control, kv-inline — rather than the bespoke
 * `card`/`psz-*` chrome it carried while it was the last page ported from the
 * static prototype. Its own styles live in product.css with the other pages'.
 */
const SYMBOL = { USD: '$', EUR: '€', GBP: '£' }

/* The reference opens on EUR/USD, USD, 100,000 at 2% over 200 pips. */
const DEFAULT = INSTRUMENTS.find((i) => i.symbol === 'EURUSD') || INSTRUMENTS[0]

const symbol = ref(DEFAULT.symbol)
const currency = ref('USD')
const balance = ref(100000)
const stop = ref(200)
const risk = ref(2)
const mode = ref('pct')
const pip = ref(DEFAULT.pip)
const contract = ref(DEFAULT.contract)

const instrument = computed(() => INSTRUMENTS.find((i) => i.symbol === symbol.value) || DEFAULT)

const ccy = computed(() => SYMBOL[currency.value] || '$')
const money = (n) => `${ccy.value}${fmtMoney(Math.abs(n)).replace('$', '')}`
const num = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const trim = (n) => num(n, 2).replace(/\.?0+$/, '')
const positive = (v) => Math.max(0, Number.parseFloat(v) || 0)

const quote = computed(() => (instrument.value.symbol.length === 6
  ? instrument.value.symbol.slice(3)
  : instrument.value.symbol))

const defaultsAreIntact = computed(() => (
  Number(pip.value) === instrument.value.pip && Number(contract.value) === instrument.value.contract
))

/* Picking an instrument re-fills the two contract fields; both stay editable. */
function pickInstrument() {
  pip.value = instrument.value.pip
  contract.value = instrument.value.contract
}

function resetContract() {
  pickInstrument()
}

const result = computed(() => {
  const bal = positive(balance.value)
  const r = positive(risk.value)
  const riskAmount = mode.value === 'pct' ? (bal * r) / 100 : r
  const riskPct = bal > 0 ? (riskAmount / bal) * 100 : 0
  const perLot = positive(stop.value) * positive(pip.value) * positive(contract.value)
  const lots = perLot > 0 ? riskAmount / perLot : 0
  return {
    bal,
    riskAmount,
    riskPct,
    perLot,
    lots,
    units: lots * positive(contract.value),
    atRisk: perLot > 0 ? lots * perLot : 0,
    pipValue: positive(pip.value) * positive(contract.value),
  }
})

/* One honest line for the cases the reference leaves blank. */
const warning = computed(() => {
  const { perLot, bal, riskAmount } = result.value
  if (perLot <= 0) return 'Enter a stop loss, pip size and contract size above zero to size a position.'
  if (mode.value === 'pct' && bal <= 0) return 'Enter an account balance to size from a percentage.'
  if (bal > 0 && riskAmount > bal) return 'That risk is larger than the whole account balance.'
  if (quote.value !== currency.value) {
    return `Pip values are priced in ${quote.value}; no FX conversion is applied to your ${currency.value} deposit.`
  }
  return ''
})

/* The field changes meaning with the toggle, so carry the value over. */
function setMode(next) {
  if (next === mode.value) return
  if (next === 'amt') risk.value = Number(((result.value.bal * positive(risk.value)) / 100).toFixed(2))
  else risk.value = Number(trim(result.value.bal > 0 ? (positive(risk.value) / result.value.bal) * 100 : 0))
  mode.value = next
}

function useActive() {
  balance.value = activeAccount.value.balance
}

/*
 * The one check a generic sizer cannot make: this risk sits inside a prop-firm
 * account, and both of that account's loss limits are already partly spent.
 * Every figure here is read from the account itself, so a position cannot be
 * "within budget" on this page and a breach on the account page.
 */
const limits = computed(() => {
  const account = activeAccount.value
  const spent = maxLossToday(account.number)
  const used = analyticsFor(account.number).maxDrawdown
  const remainingDaily = Math.max(0, account.dailyLoss - spent)
  const remainingMax = Math.max(0, account.maxLoss - used)
  const riskAmount = result.value.riskAmount
  const row = (label, remaining, note) => ({
    label,
    remaining,
    note,
    share: remaining > 0 ? Math.min(100, (riskAmount / remaining) * 100) : riskAmount > 0 ? 100 : 0,
    ok: riskAmount <= remaining,
  })
  return {
    account,
    rows: [
      row('Remaining daily loss', remainingDaily, `${money(spent)} of ${money(account.dailyLoss)} used today`),
      row('Remaining max loss', remainingMax, `${money(used)} of ${money(account.maxLoss)} used since the start`),
    ],
    breach: riskAmount > remainingDaily || riskAmount > remainingMax,
  }
})

const mathSteps = computed(() => [
  { label: 'Risk budget', value: money(result.value.riskAmount), note: mode.value === 'pct' ? `${trim(result.value.riskPct)}% of balance` : 'Amount entered' },
  { label: 'Risk per lot', value: money(result.value.perLot), note: `${num(positive(stop.value), 1)} ${instrument.value.unit} × ${pip.value} × ${num(positive(contract.value), 0)} units` },
  { label: 'Position', value: `${num(result.value.lots, 2)} lots`, note: `${num(result.value.units, 0)} units`, strong: true },
])

function copyResult() {
  const { lots, units, riskAmount } = result.value
  copyText(
    `${num(lots, 2)} lots of ${instrument.value.symbol} · ${num(units, 0)} units · risking ${money(riskAmount)} over ${num(positive(stop.value), 1)} ${instrument.value.unit}`,
    'Position size copied',
  )
}

const HOW_TO = [
  'Select your trading instrument',
  'Enter your account balance in your deposit currency',
  'Specify the percentage or amount you want to risk',
  'Input your stop loss distance in pips',
  'Adjust pip size and contract size if needed',
  'Read the position size — it updates as you type',
]

const NOTES = [
  'Standard forex lot = 100,000 units',
  'Pip size is 0.0001 for most pairs, 0.01 for JPY pairs',
  'Always verify calculations before placing trades',
  'Consider spread and slippage in your actual position size',
  'Never risk more than you can afford to lose',
]
</script>

<template>
  <div class="ov" data-od-id="sizer-page">
    <div class="page-head util-head" data-od-id="page-head-sizer">
      <div class="page-head__text">
        <div class="eyebrow">Main · Position sizer</div>
        <h1>Position size calculator</h1>
        <p class="dim">
          Size a position from your balance, the share of it you are willing to lose and the distance to your
          stop. The figures update as you type, and the risk is checked against the loss limits of your active
          account.
        </p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--ghost" @click="copyResult">
          <AppIcon name="copy" :size="15" />Copy result
        </button>
      </div>
    </div>

    <div class="grid grid--cols-2 siz-cols" data-od-id="sizer-body">
      <!-- Inputs -->
      <section class="panel" data-od-id="sizer-inputs">
        <div class="panel__head">
          <span class="panel__title">Inputs</span>
          <span class="panel__actions"><span class="stat-card__foot">{{ instrument.label }}</span></span>
        </div>

        <div class="panel__body">
          <div class="grid grid--cols-2 siz-fields">
            <div class="field">
              <label for="instrument">Instrument</label>
              <select id="instrument" v-model="symbol" class="select" @change="pickInstrument">
                <option v-for="i in INSTRUMENTS" :key="i.symbol" :value="i.symbol">{{ i.label }}</option>
              </select>
            </div>
            <div class="field">
              <label for="currency">Deposit currency</label>
              <select id="currency" v-model="currency" class="select">
                <option v-for="(_, code) in SYMBOL" :key="code" :value="code">{{ code }}</option>
              </select>
            </div>

            <div class="field">
              <div class="siz-labelrow">
                <label for="balance">Account balance</label>
                <button type="button" class="siz-link" title="Load the balance from the active account" @click="useActive">
                  Use active
                </button>
              </div>
              <div class="input-group">
                <span class="siz-prefix">{{ ccy }}</span>
                <input id="balance" v-model="balance" class="input" inputmode="decimal" />
              </div>
            </div>
            <div class="field">
              <label for="stop">Stop loss ({{ instrument.unit }})</label>
              <input id="stop" v-model="stop" class="input" inputmode="decimal" />
            </div>
          </div>

          <div class="field">
            <label for="risk">Risk</label>
            <div class="siz-risk">
              <input id="risk" v-model="risk" class="input" inputmode="decimal" />
              <div class="seg" role="group" aria-label="Risk unit">
                <button
                  type="button"
                  class="seg__btn"
                  :class="{ 'is-on': mode === 'pct' }"
                  :aria-pressed="mode === 'pct'"
                  @click="setMode('pct')"
                >%</button>
                <button
                  type="button"
                  class="seg__btn"
                  :class="{ 'is-on': mode === 'amt' }"
                  :aria-pressed="mode === 'amt'"
                  @click="setMode('amt')"
                >{{ ccy }}</button>
              </div>
            </div>
          </div>

          <div class="grid grid--cols-2 siz-fields">
            <div class="field">
              <div class="siz-labelrow">
                <label for="pip">Pip size</label>
                <button v-if="!defaultsAreIntact" type="button" class="siz-link" @click="resetContract">
                  Reset to {{ instrument.symbol }}
                </button>
              </div>
              <input id="pip" v-model="pip" class="input" inputmode="decimal" />
            </div>
            <div class="field">
              <label for="contract">Contract size (units/lot)</label>
              <input id="contract" v-model="contract" class="input" inputmode="decimal" />
            </div>
          </div>

          <p v-if="warning" class="callout callout--warn" data-od-id="sizer-warning">
            <AppIcon name="alert" :size="16" />{{ warning }}
          </p>
        </div>
      </section>

      <!-- Result -->
      <section class="panel" data-od-id="sizer-results">
        <div class="panel__head">
          <span class="panel__title">Position size</span>
          <span class="panel__actions">
            <span class="stat-card__foot">Pip {{ pip }} · {{ num(positive(contract), 0) }} units per lot</span>
          </span>
        </div>

        <div class="panel__body">
          <div class="stat-card stat-card--center" data-od-id="sizer-size">
            <div class="stat-card__head">Position size <AppIcon name="info" :size="14" /></div>
            <span class="stat-card__value">{{ num(result.lots, 2) }}<small>lots</small></span>
            <span class="stat-card__foot">{{ num(result.units, 0) }} units at {{ num(positive(contract), 0) }} units per lot</span>
          </div>

          <div class="grid grid--cols-2">
            <div class="stat-card" data-od-id="sizer-units">
              <div class="stat-card__head">Units</div>
              <span class="stat-card__value stat-card__value--sm">{{ num(result.units, 0) }}</span>
              <span class="stat-card__foot">Pip value <b>{{ money(result.pipValue) }}</b> per lot</span>
            </div>
            <div class="stat-card" data-od-id="sizer-risk">
              <div class="stat-card__head">Money at risk</div>
              <span class="stat-card__value stat-card__value--sm">{{ money(result.atRisk) }}</span>
              <!-- `stop` is a ref: the template unwraps it, so `stop.value` here
                   was undefined and this line read "at 0.0 pips". -->
              <span class="stat-card__foot">If the stop is hit at {{ num(positive(stop), 1) }} {{ instrument.unit }}</span>
            </div>
          </div>

          <!-- The arithmetic, so the number above can be checked rather than trusted. -->
          <div class="siz-math" data-od-id="sizer-math">
            <div v-for="(s, i) in mathSteps" :key="s.label" class="siz-math__step" :class="{ 'is-last': s.strong }">
              <span class="siz-math__label">{{ s.label }}</span>
              <span class="siz-math__value">{{ s.value }}</span>
              <span class="siz-math__note">{{ s.note }}</span>
              <!-- The icon span is `display: contents`, so the arrow is wrapped
                   in an element of its own to have something to position. -->
              <span v-if="i < mathSteps.length - 1" class="siz-math__arrow" aria-hidden="true">
                <AppIcon name="chevronRight" :size="16" />
              </span>
            </div>
          </div>

        </div>
      </section>
    </div>

    <!-- The working: what the size was built from on the left, what it means for
         the account on the right. Both are two rows shorter than the single
         results column they were buried in. -->
    <div class="grid grid--cols-2 siz-cols" data-od-id="sizer-working">
      <section class="panel" data-od-id="sizer-summary">
        <div class="panel__head">
          <span class="panel__title">Parameters</span>
          <span class="panel__actions"><span class="stat-card__foot">{{ currency }} deposit</span></span>
        </div>
        <div class="panel__body">
          <!-- The four inputs the risk budget is built from. Pip size and
               contract size are the contract spec — the results panel head
               states both, and the arithmetic strip multiplies them — so
               repeating them here only made this column taller than the panel
               beside it. -->
          <div class="kv-inline kv-inline--ruled">
            <div class="kv-inline__row"><span>Instrument</span><b>{{ instrument.label }}</b></div>
            <div class="kv-inline__row"><span>Account balance</span><b>{{ money(result.bal) }}</b></div>
            <div class="kv-inline__row"><span>Risk</span><b>{{ mode === 'pct' ? `${trim(result.riskPct)}%` : money(result.riskAmount) }}</b></div>
            <div class="kv-inline__row"><span>Stop loss</span><b>{{ num(positive(stop), 1) }} {{ instrument.unit }}</b></div>
          </div>
        </div>
      </section>

      <!-- The check a generic sizer cannot make. -->
      <section class="panel" data-od-id="sizer-limits">
        <div class="panel__head">
          <span class="panel__title">Risk check</span>
          <span class="panel__actions">
            <span class="stat-card__foot">Against account {{ limits.account.number }}</span>
            <span v-if="result.riskAmount > 0" class="badge" :class="limits.breach ? 'badge--breached' : 'badge--active'">
              <span class="badge__dot" />{{ limits.breach ? 'would breach a limit' : 'within both limits' }}
            </span>
          </span>
        </div>
        <div class="panel__body">
          <div v-for="r in limits.rows" :key="r.label" class="obj-row">
            <div class="obj-row__top">
              <span>{{ r.label }}</span>
              <span class="obj-row__value">{{ money(result.riskAmount) }} of {{ money(r.remaining) }} left</span>
              <span class="obj-row__state" :class="`obj-row__state--${r.ok ? 'good' : 'bad'}`">
                <AppIcon :name="r.ok ? 'check' : 'close'" :size="15" />
              </span>
            </div>
            <div class="meter" :class="r.ok ? 'meter--good' : 'meter--bad'">
              <i :style="{ width: `${r.share.toFixed(1)}%` }"></i>
            </div>
            <div class="obj-row__note"><span>{{ r.note }}</span></div>
          </div>
        </div>
        <div class="panel__foot">
          <span class="stat-card__foot">
            Both figures are the account's own limits, less what it has already used — they move with it, not with this page.
          </span>
        </div>
      </section>
    </div>

    <div class="grid grid--cols-2" data-od-id="sizer-help">
      <section class="panel" data-od-id="sizer-how">
        <div class="panel__head"><span class="panel__title">How to use</span></div>
        <ol class="siz-steps">
          <li v-for="(line, i) in HOW_TO" :key="line"><b>{{ i + 1 }}</b><span>{{ line }}</span></li>
        </ol>
      </section>

      <section class="panel" data-od-id="sizer-notes">
        <div class="panel__head"><span class="panel__title">Important notes</span></div>
        <ul class="siz-notes">
          <li v-for="line in NOTES" :key="line">{{ line }}</li>
        </ul>
      </section>
    </div>

    <p class="siz-footnote" data-od-id="sizer-disclaimer">
      <b>Disclaimer.</b> This calculator is provided for educational and informational purposes only. The results
      are estimates based on the inputs above and may not reflect actual trading conditions, including spreads,
      slippage, commissions, execution delays, contract specifications, leverage or platform differences. CK
      Propfirm does not guarantee the accuracy, completeness or suitability of any calculation; verify every value
      before placing a trade. This is not financial, investment or trading advice. Every account on this portal
      runs in a simulated environment on simulated capital — no real money is ever traded.
    </p>
  </div>
</template>
