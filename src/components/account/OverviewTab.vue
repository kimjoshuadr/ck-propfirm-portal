<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import LineChart from '../LineChart.vue'
import TradesChart from './TradesChart.vue'
import { analyticsFor, consistencyFor, maxLossToday, recoveryFor, sessionsFor, tradesFor } from '../../data/portal.js'
import { compactMoney, money, shortDate, signedMoney, signedPct } from '../../lib/format.js'
import { useNow, untilUtcMidnight, elapsedSince, duration } from '../../lib/clock.js'

const props = defineProps({ account: { type: Object, required: true } })

const now = useNow()
const stats = computed(() => analyticsFor(props.account.number))
const sessions = computed(() => sessionsFor(props.account.number))
/* The two figures the retired Score section carried that this page did not
   already show; both follow from the log and the curve. */
const consistency = computed(() => consistencyFor(props.account.number))
const recovery = computed(() => recoveryFor(props.account.number))


/* The performance card carries the plain balance curve — the labelled bands
   belong to the chart card below it, as the reference splits them. */
const curve = computed(() => sessions.value.map((s) => s.value))
const curveTone = computed(() => {
  if (props.account.status === 'breached') return 'red'
  return props.account.pnl >= 0 ? 'green' : 'red'
})

const reset = computed(() => untilUtcMidnight(now.value))
const since = computed(() => elapsedSince(props.account.started, now.value))

/* Everything below is derived from the same log the tabs list, so a number
   here can always be traced to the trades behind it. */
const firstTrade = computed(() => tradesFor(props.account.number).at(-1))
const todayLoss = computed(() => maxLossToday(props.account.number))
const tradingDays = computed(() => new Set(tradesFor(props.account.number).map((t) => t.date)).size)

const pct = (used, total) => (total ? Math.min(100, Math.max(0, (used / total) * 100)) : 0)
const tone = (used, total) => {
  const p = pct(used, total)
  return p >= 100 ? 'bad' : p >= 75 ? 'warn' : 'good'
}

const target = computed(() => props.account.profitTarget)
const lossLevel = computed(() => props.account.size - props.account.maxLoss)
const dailyLevel = computed(() => props.account.size - props.account.dailyLoss)
const closedProfit = computed(() => Math.max(0, stats.value.netPnl))

/* Days since the account's last logged trade, against the 30-day allowance. */
const idleDays = computed(() => {
  const last = tradesFor(props.account.number)[0]?.date
  if (!last) return 0
  const days = Math.floor((Date.now() - new Date(`${last}T00:00:00Z`).getTime()) / 86400000)
  return Math.max(0, Math.min(30, days))
})

/* "41 trades" reads better than "41" in an informational note. */
const formatTrades = (n) => `${n} trades`

/* The two blocks below the chart: the session totals the clock sits inside,
   then ten trade-quality figures — the eight the reference used plus the two
   that came across from the old Score section. Everything here is derived from
   the log, so each one can be traced to the trades behind it. */
const sessionFacts = computed(() => [
  { label: 'Closed trades', value: `${stats.value.count}`, note: `${stats.value.wins}W / ${stats.value.losses}L` },
  { label: 'Trading days', value: `${stats.value.days}`, note: `${(stats.value.count / Math.max(1, stats.value.days)).toFixed(1)} trades a day` },
  { label: 'Avg day', value: signedMoney(stats.value.avgDay), note: `best ${signedMoney(stats.value.bestDay)}`, tone: stats.value.avgDay >= 0 ? 'good' : 'bad' },
  { label: 'Notional traded', value: compactMoney(stats.value.notional), note: `${stats.value.instruments} instruments` },
])

const quality = computed(() => [
  { id: 'best-trade', label: 'Best trade', value: signedMoney(stats.value.best?.pnl || 0), note: `${stats.value.best?.symbol || ''} · ${stats.value.best?.side || ''}`, tone: 'good' },
  { id: 'worst-trade', label: 'Worst trade', value: signedMoney(stats.value.worst?.pnl || 0), note: `${stats.value.worst?.symbol || ''} · ${stats.value.worst?.side || ''}`, tone: 'bad' },
  { id: 'profit-factor', label: 'Profit factor', value: stats.value.profitFactor.toFixed(2), note: 'Gross win ÷ gross loss', tone: stats.value.profitFactor >= 1 ? 'good' : 'bad' },
  { id: 'best-day', label: 'Best day', value: signedMoney(stats.value.bestDay), note: 'Single session', tone: 'good' },
  { id: 'worst-day', label: 'Worst day', value: signedMoney(stats.value.worstDay), note: 'Single session', tone: 'bad' },
  { id: 'avg-hold', label: 'Average hold', value: duration(stats.value.hold.avg), note: `${formatTrades(stats.value.count)} closed` },
  { id: 'longest-hold', label: 'Longest hold', value: duration(stats.value.hold.longest), note: 'One position' },
  { id: 'strategies', label: 'Strategies used', value: `${stats.value.strategies}`, note: 'Tagged at entry' },
  /* Formerly the Score breakdown's footer rows. */
  { id: 'consistency', label: 'Consistency', value: `${consistency.value}%`, note: 'Best day as a share of net profit', tone: consistency.value <= 50 ? 'good' : 'warn' },
  { id: 'recovery-factor', label: 'Recovery factor', value: recovery.value.toFixed(2), note: 'Net profit over max drawdown', tone: recovery.value >= 1 ? 'good' : 'warn' },
])

/* One baseline for the two bars, so their lengths are comparable. */
const barMax = computed(() => Math.max(stats.value.avgWin, Math.abs(stats.value.avgLoss), 1))
const winBar = computed(() => (stats.value.avgWin / barMax.value) * 100)
const lossBar = computed(() => (Math.abs(stats.value.avgLoss) / barMax.value) * 100)

/* Net result divided by the number of closed trades — the same figure the P&L
   card shows, read per trade. */
const expectancy = computed(() => (stats.value.count ? stats.value.netPnl / stats.value.count : 0))

/* Each objective card's marker answers its own question rather than being
   decoration: met, close to the limit, or failed. */
const stateIcon = (state) => (state === 'bad' ? 'close' : state === 'warn' ? 'alert' : 'check')
const targetState = computed(() => (target.value && closedProfit.value >= target.value ? 'good' : 'bad'))
const daysState = computed(() => (tradingDays.value >= (props.account.minTradingDays || 0) ? 'good' : 'bad'))
const dailyState = computed(() => (todayLoss.value < props.account.dailyLoss ? 'good' : 'bad'))
const maxState = computed(() => tone(stats.value.maxDrawdown, props.account.maxLoss))
</script>

<template>
  <div class="ov">
    <div v-if="account.status === 'breached'" class="acc-banner" data-od-id="account-breach-banner">
      <AppIcon name="alert" :size="18" />
      <span>Your account has been breached. Purchase a new account to start trading.</span>
      <button type="button" class="acc-banner__cta" @click="$emit('challenge')">
        Start New Challenge<AppIcon name="external" :size="14" />
      </button>
    </div>

    <!-- performance + the four live counters -->
    <div class="acc-cols">
      <section class="panel stat-card" data-od-id="account-performance">
        <div class="stat-card__head">
          <span>Performance</span>
          <span class="delta" :class="account.roi >= 0 ? 'delta--up' : 'delta--down'">
            <AppIcon :name="account.roi >= 0 ? 'arrowUp' : 'arrowDown'" :size="12" />{{ signedPct(account.roi) }}
          </span>
          <span class="stat-card__foot">Balance: <b>{{ money(account.balance) }}</b></span>
          <span class="acc-status stat-card__state" :class="`acc-status--${account.status}`">{{ account.status }}</span>
        </div>

        <span class="stat-card__value">{{ money(account.balance) }}</span>

        <div class="perf-chart">
          <LineChart :values="curve" :tone="curveTone" uid="acct-perf" :view-box-height="90" />
        </div>

        <div class="obj-row" style="padding-bottom:0">
          <div class="obj-row__top">
            <span>Max daily loss used</span>
            <span class="obj-row__value">{{ money(todayLoss) }} / {{ money(account.dailyLoss) }}</span>
          </div>
          <div class="meter" :class="`meter--${tone(todayLoss, account.dailyLoss)}`">
            <i :style="{ width: `${pct(todayLoss, account.dailyLoss)}%` }"></i>
          </div>
        </div>
      </section>

      <div class="acc-grid-2">
        <!-- The reference tints the card, not the number, when P&L is negative. -->
        <div
          class="panel stat-card stat-card--center"
          :class="stats.netPnl >= 0 ? 'stat-card--glow-good' : 'stat-card--glow-bad'"
          data-od-id="account-net-pnl"
        >
          <div class="stat-card__head">Net cumulative P&amp;L <AppIcon name="info" :size="14" /></div>
          <span class="stat-card__value">{{ signedMoney(stats.netPnl) }}</span>
          <span class="stat-card__foot">Across {{ stats.count }} closed trades</span>
        </div>

        <div class="panel stat-card stat-card--center" data-od-id="account-reset">
          <div class="stat-card__head">Daily loss resets in <AppIcon name="info" :size="14" /></div>
          <p class="clock-clock">
            {{ reset.h }} : {{ reset.m }} : {{ reset.s }}
          </p>
          <span class="stat-card__foot">Resets at 00:00 UTC</span>
        </div>

        <!-- The percentage lives inside its own ring, so the card stops saying
             the same number twice — the ring carries it, the rows carry the
             split that produced it. -->
        <div class="panel stat-card stat-card--center" data-od-id="account-win-rate">
          <div class="stat-card__head">Trade win % <AppIcon name="info" :size="14" /></div>
          <div class="metric-viz">
            <svg class="donut" viewBox="0 0 92 92" aria-hidden="true">
              <circle cx="46" cy="46" r="36" fill="none" stroke="var(--sunken)" stroke-width="10" />
              <circle
                cx="46" cy="46" r="36" fill="none" stroke="var(--green)" stroke-width="10"
                stroke-linecap="round" pathLength="100" :stroke-dasharray="`${stats.winRate} 100`"
                transform="rotate(-90 46 46)"
              />
              <text x="46" y="51" text-anchor="middle" fill="var(--fg)" style="font: 700 15px var(--display)">{{ stats.winRate.toFixed(2) }}%</text>
            </svg>
            <div class="kv-inline kv-inline--ruled metric-viz__rows">
              <div class="kv-inline__row"><span>Wins</span><b class="up">{{ stats.wins }}</b></div>
              <div class="kv-inline__row"><span>Losses</span><b class="down">{{ stats.losses }}</b></div>
            </div>
          </div>
        </div>

        <!-- Two bars on one baseline, each labelled with what it measures, and
             the ratio demoted to the footnote it belongs in. -->
        <div class="panel stat-card stat-card--center" data-od-id="account-avg-win-loss">
          <div class="stat-card__head">Avg win / loss <AppIcon name="info" :size="14" /></div>
          <div class="bar-list">
            <div class="bar-list__row">
              <div class="bar-list__top"><span>Avg win</span><b class="up">{{ money(stats.avgWin) }}</b></div>
              <div class="meter meter--md meter--good" style="margin-top:0">
                <i :style="{ width: `${winBar}%` }"></i>
              </div>
            </div>
            <div class="bar-list__row">
              <div class="bar-list__top"><span>Avg loss</span><b class="down">{{ money(stats.avgLoss) }}</b></div>
              <div class="meter meter--md meter--bad" style="margin-top:0">
                <i :style="{ width: `${lossBar}%` }"></i>
              </div>
            </div>
          </div>
          <span class="stat-card__foot">
            Risk/reward <b>{{ stats.riskReward.toFixed(2) }}</b><br />
            <b>{{ signedMoney(expectancy) }}</b> per closed trade
          </span>
        </div>
      </div>
    </div>

    <!-- the four objective meters -->
    <div class="acc-grid-4">
      <div class="panel stat-card" data-od-id="account-closed-profit">
        <div class="stat-card__head">
          Closed trades profit <AppIcon name="info" :size="14" />
          <span class="stat-card__state" :class="`obj-row__state--${targetState}`">
            <AppIcon :name="stateIcon(targetState)" :size="16" />
          </span>
        </div>
        <span class="stat-card__value stat-card__value--sm">{{ money(closedProfit) }}</span>
        <span class="stat-card__foot">Profit target <b>{{ money(target) }}</b></span>
      </div>

      <div class="panel stat-card" data-od-id="account-trading-days">
        <div class="stat-card__head">
          Trading days <AppIcon name="info" :size="14" />
          <span class="stat-card__state" :class="`obj-row__state--${daysState}`">
            <AppIcon :name="stateIcon(daysState)" :size="16" />
          </span>
        </div>
        <span class="stat-card__value stat-card__value--sm">{{ tradingDays }}</span>
        <div class="meter" :class="tradingDays >= account.minTradingDays ? 'meter--good' : ''">
          <i :style="{ width: `${pct(tradingDays, Math.max(account.minTradingDays, 1))}%` }"></i>
        </div>
        <span class="stat-card__foot">Minimum required: <b>{{ account.minTradingDays }}</b> days</span>
      </div>

      <div class="panel stat-card" data-od-id="account-permitted-loss">
        <div class="stat-card__head">
          Today's permitted loss <AppIcon name="info" :size="14" />
          <span class="stat-card__state" :class="`obj-row__state--${dailyState}`">
            <AppIcon :name="stateIcon(dailyState)" :size="16" />
          </span>
        </div>
        <span class="stat-card__value stat-card__value--sm">{{ money(Math.max(0, account.dailyLoss - todayLoss)) }}</span>
        <div class="meter meter--good"><i :style="{ width: `${100 - pct(todayLoss, account.dailyLoss)}%` }"></i></div>
        <span class="stat-card__foot">Today's breach level <b>{{ money(dailyLevel) }}</b></span>
      </div>

      <div class="panel stat-card" data-od-id="account-max-loss">
        <div class="stat-card__head">
          Max permitted loss <AppIcon name="info" :size="14" />
          <span class="stat-card__state" :class="`obj-row__state--${maxState}`">
            <AppIcon :name="stateIcon(maxState)" :size="16" />
          </span>
        </div>
        <span class="stat-card__value stat-card__value--sm">{{ money(Math.max(0, account.maxLoss - stats.maxDrawdown)) }}</span>
        <div class="meter" :class="`meter--${tone(stats.maxDrawdown, account.maxLoss)}`">
          <i :style="{ width: `${pct(stats.maxDrawdown, account.maxLoss)}%` }"></i>
        </div>
        <span class="stat-card__foot">Breach level <b>{{ money(lossLevel) }}</b></span>
      </div>
    </div>

    <!-- the chart card beside the objectives list -->
    <div class="acc-cols">
      <TradesChart :account="account" />

      <section class="panel" data-od-id="account-objectives">
        <div class="panel__head"><span class="panel__title">Objectives</span></div>
        <div style="padding:6px 18px 18px">
          <div class="obj-row">
            <div class="obj-row__top">
              <span>Profit target</span>
              <span class="obj-row__value">{{ money(closedProfit) }} / {{ money(target) }}</span>
              <span class="obj-row__state" :class="closedProfit >= target ? 'obj-row__state--good' : 'obj-row__state--bad'">
                <AppIcon :name="closedProfit >= target ? 'check' : 'close'" :size="15" />
              </span>
            </div>
            <div class="meter" :class="closedProfit >= target ? 'meter--good' : 'meter--warn'">
              <i :style="{ width: `${pct(closedProfit, Math.max(target, 1))}%` }"></i>
            </div>
          </div>

          <div class="obj-row">
            <div class="obj-row__top">
              <span>Max loss</span>
              <span class="obj-row__value">{{ money(stats.maxDrawdown) }} / {{ money(account.maxLoss) }}</span>
              <span class="obj-row__state" :class="stats.maxDrawdown >= account.maxLoss ? 'obj-row__state--bad' : 'obj-row__state--warn'">
                <AppIcon name="alert" :size="15" />
              </span>
            </div>
            <div class="meter" :class="`meter--${tone(stats.maxDrawdown, account.maxLoss)}`">
              <i :style="{ width: `${pct(stats.maxDrawdown, account.maxLoss)}%` }"></i>
            </div>
          </div>

          <div class="obj-row">
            <div class="obj-row__top">
              <span>Trading days</span>
              <span class="obj-row__value">{{ tradingDays }} / {{ account.minTradingDays }} days</span>
              <span class="obj-row__state obj-row__state--good"><AppIcon name="check" :size="15" /></span>
            </div>
          </div>

          <div class="obj-row">
            <div class="obj-row__top">
              <span>Max daily loss</span>
              <span class="obj-row__value">{{ money(todayLoss) }} / {{ money(account.dailyLoss) }}</span>
              <span class="obj-row__state obj-row__state--good"><AppIcon name="check" :size="15" /></span>
            </div>
            <div class="meter meter--good"><i :style="{ width: `${pct(todayLoss, account.dailyLoss)}%` }"></i></div>
          </div>

          <div class="obj-row">
            <div class="obj-row__top">
              <span>Inactivity days</span>
              <span class="obj-row__value">{{ idleDays }} / 30 days</span>
              <span class="obj-row__state obj-row__state--good"><AppIcon name="check" :size="15" /></span>
            </div>
          </div>

          <div class="obj-row">
            <div class="obj-row__top"><span>Overnight positions</span><span class="obj-row__value">Allowed</span></div>
          </div>
          <div class="obj-row">
            <div class="obj-row__top"><span>Weekend positions</span><span class="obj-row__value">Allowed</span></div>
          </div>
          <div class="obj-row">
            <div class="obj-row__top"><span>Drawdown type</span><span class="obj-row__value">{{ account.drawdownType }}</span></div>
          </div>
        </div>
      </section>
    </div>

    <!-- full-width session strip: the elapsed clock beside the totals it sits in -->
    <section class="panel elapsed" data-od-id="account-elapsed">
      <div class="elapsed__clock">
        <div class="stat-card__head">Time since first trade <AppIcon name="info" :size="14" /></div>
        <div class="clock">
          <span class="clock__part"><b class="clock__num">{{ since.days }}</b><span class="clock__label">days</span></span>
          <span class="clock__part"><b class="clock__num">{{ since.hours }}</b><span class="clock__label">hours</span></span>
          <span class="clock__part"><b class="clock__num">{{ since.minutes }}</b><span class="clock__label">minutes</span></span>
          <span class="clock__part"><b class="clock__num">{{ since.seconds }}</b><span class="clock__label">seconds</span></span>
        </div>
        <span class="stat-card__foot">First trade {{ shortDate(firstTrade?.date) }} at {{ firstTrade?.openedAt }} UTC</span>
      </div>

      <dl class="elapsed__facts">
        <div v-for="f in sessionFacts" :key="f.label">
          <dt>{{ f.label }}</dt>
          <dd :class="f.tone">{{ f.value }}<small v-if="f.note">{{ f.note }}</small></dd>
        </div>
      </dl>
    </section>

    <!-- full-width trade quality: two rows of five, every figure from the log -->
    <div class="acc-grid-5">
      <div v-for="s in quality" :key="s.label" class="panel stat-card" :data-od-id="`account-${s.id}`">
        <div class="stat-card__head">{{ s.label }} <AppIcon name="info" :size="14" /></div>
        <span class="stat-card__value stat-card__value--sm" :class="s.tone ? `stat-card--tone-${s.tone}` : ''">{{ s.value }}</span>
        <span class="stat-card__foot">{{ s.note }}</span>
      </div>
    </div>
  </div>
</template>
