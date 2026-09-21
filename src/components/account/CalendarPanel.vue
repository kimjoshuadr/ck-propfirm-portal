<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import { calendarFor, tradesFor } from '../../data/portal.js'
import { signedMoney } from '../../lib/format.js'
import { duration } from '../../lib/clock.js'

const props = defineProps({ account: { type: Object, required: true } })

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const round2 = (n) => Math.round(n * 100) / 100

/*
 * A month is read two ways here, and neither of them is the reference's grid.
 *
 * The reference draws a calendar: a "Week N" column on the left, then seven
 * day cells per row, each filled with a tint and its P&L. It answers "which
 * squares were green", and for anything else — how the month is running, what
 * the average day was, which session actually cost the most — the reader has to
 * add the cells up themselves.
 *
 * So this is a month of bars over a ledger of sessions. The strip shows shape
 * in one line (height is the size of the day, colour its sign); the ledger
 * lists every session newest-first, which is what the section has claimed to do
 * all along, and opens one inline instead of in a dialog.
 */
const log = tradesFor(props.account.number)
const newest = log[0]?.date || ''
const oldest = log.at(-1)?.date || ''
const start = newest || new Date().toISOString().slice(0, 10)
const view = ref({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) })
const open = ref(null)

const key = (year, month) => year * 12 + month
const grid = computed(() => calendarFor(props.account.number, view.value.year, view.value.month))
const label = computed(() => `${MONTHS[view.value.month - 1]} ${view.value.year}`)

/* Days for the strip (the whole month), sessions for the ledger (the ones with
   trades, newest first — the log is ordered newest-first). */
const days = computed(() => grid.value.weeks.flatMap((w) => w.days).filter(Boolean))
const sessions = computed(() => days.value.filter((d) => d.trades).slice().reverse())

/* Every figure is summed from the month's own trade list, so the header, the
   ledger and the Trades section cannot disagree. */
const month = computed(() => {
  const trades = grid.value.trades
  const wins = trades.filter((t) => t.pnl > 0)
  const losses = trades.filter((t) => t.pnl <= 0)
  const pnl = round2(trades.reduce((total, t) => total + t.pnl, 0))
  const grossWin = round2(wins.reduce((total, t) => total + t.pnl, 0))
  const grossLoss = round2(Math.abs(losses.reduce((total, t) => total + t.pnl, 0)))
  return {
    sessions: sessions.value.length,
    trades: trades.length,
    pnl,
    winRate: trades.length ? round2((wins.length / trades.length) * 100) : 0,
    profitFactor: grossLoss ? round2(grossWin / grossLoss) : 0,
    best: sessions.value.reduce((a, b) => (!a || b.pnl > a.pnl ? b : a), null),
    worst: sessions.value.reduce((a, b) => (!a || b.pnl < a.pnl ? b : a), null),
    avgDay: sessions.value.length ? round2(pnl / sessions.value.length) : 0,
    perTrade: trades.length ? round2(pnl / trades.length) : 0,
  }
})

const barMax = computed(() => Math.max(...days.value.map((d) => Math.abs(d.pnl)), 1))
const barPct = (d) => (d.trades ? Math.max(4, (Math.abs(d.pnl) / barMax.value) * 100) : 4)

const canPrev = computed(() => Boolean(oldest) && key(view.value.year, view.value.month) > key(Number(oldest.slice(0, 4)), Number(oldest.slice(5, 7))))
const canNext = computed(() => Boolean(newest) && key(view.value.year, view.value.month) < key(Number(newest.slice(0, 4)), Number(newest.slice(5, 7))))

function step(delta) {
  const m = view.value.month + delta
  if (m < 1) view.value = { year: view.value.year - 1, month: 12 }
  else if (m > 12) view.value = { year: view.value.year + 1, month: 1 }
  else view.value = { year: view.value.year, month: m }
  open.value = null
}

/* Opening from the strip has to bring the ledger row with it, or the reader
   clicks a bar and nothing appears to happen. Re-aiming an already visible row
   would be noise, so it only scrolls when the row is off screen. */
function toggle(d) {
  open.value = open.value === d.date ? null : d.date
  if (!open.value) return
  requestAnimationFrame(() => {
    const row = document.getElementById(`cal-${d.date}`)
    if (!row) return
    const box = row.getBoundingClientRect()
    if (box.top < 0 || box.bottom > window.innerHeight) row.scrollIntoView({ behavior: 'instant', block: 'center' })
  })
}

const weekday = (iso) => WEEKDAY[new Date(`${iso}T00:00:00Z`).getUTCDay()]
const dayNumber = (iso) => iso.slice(8, 10)
const shortDay = (iso) => `${iso.slice(8, 10)} ${MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3)}`
const longDay = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
  weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})
</script>

<template>
  <section class="panel" data-od-id="account-calendar">
    <div class="panel__head">
      <span class="panel__title">{{ label }}</span>
      <span class="panel__actions">
        <span class="stat-card__foot">
          <b>{{ month.sessions }}</b> {{ month.sessions === 1 ? 'session' : 'sessions' }} ·
          {{ month.trades }} trades
        </span>
        <button type="button" class="rail__arrow" aria-label="Previous month" :disabled="!canPrev" @click="step(-1)">
          <AppIcon name="chevronLeft" :size="16" />
        </button>
        <button type="button" class="rail__arrow" aria-label="Next month" :disabled="!canNext" @click="step(1)">
          <AppIcon name="chevronRight" :size="16" />
        </button>
      </span>
    </div>

    <!-- The month in one line: a bar a day, its height the size of the day. -->
    <div class="cal-strip" data-od-id="account-calendar-strip">
      <ol class="cal-strip__bars">
        <li v-for="d in days" :key="d.date">
          <button
            type="button"
            class="cal-tick"
            :class="{
              'is-win': d.trades && d.pnl >= 0,
              'is-loss': d.trades && d.pnl < 0,
              'is-idle': !d.trades,
              'is-open': open === d.date,
            }"
            :disabled="!d.trades"
            :aria-expanded="d.trades ? open === d.date : undefined"
            :aria-label="d.trades ? `${longDay(d.date)}: ${signedMoney(d.pnl)} across ${d.trades} trades` : `${longDay(d.date)}: no trades`"
            :title="d.trades ? `${longDay(d.date)} · ${signedMoney(d.pnl)} · ${d.trades} trades · ${d.winRate}% win rate` : `${longDay(d.date)} · no trades`"
            @click="toggle(d)"
          ><i :style="{ height: `${barPct(d)}%` }"></i></button>
        </li>
      </ol>

      <div class="cal-strip__foot">
        <span class="mono">{{ shortDay(days[0].date) }}</span>
        <span class="cal-legend">
          <i class="cal-legend__swatch is-win"></i>up day
          <i class="cal-legend__swatch is-loss"></i>down day
          <i class="cal-legend__swatch is-idle"></i>no trades
        </span>
        <span class="mono">{{ shortDay(days[days.length - 1].date) }}</span>
      </div>
    </div>

    <!-- The month's own totals, so nothing has to be added up by hand. -->
    <dl class="cal-facts" data-od-id="account-calendar-facts">
      <div>
        <dt>Month P&amp;L</dt>
        <dd :class="month.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(month.pnl) }}</dd>
        <small>{{ signedMoney(month.perTrade) }} per trade</small>
      </div>
      <div>
        <dt>Win rate</dt>
        <dd>{{ month.winRate.toFixed(1) }}%</dd>
        <small>Profit factor <b>{{ month.profitFactor.toFixed(2) }}</b></small>
      </div>
      <div>
        <dt>Average day</dt>
        <dd :class="month.avgDay >= 0 ? 'up' : 'down'">{{ signedMoney(month.avgDay) }}</dd>
        <small>Across {{ month.sessions }} {{ month.sessions === 1 ? 'session' : 'sessions' }}</small>
      </div>
      <div>
        <dt>Best day</dt>
        <dd class="up">{{ month.best ? signedMoney(month.best.pnl) : '—' }}</dd>
        <small>{{ month.best ? shortDay(month.best.date) : 'No sessions' }}</small>
      </div>
      <div>
        <dt>Worst day</dt>
        <dd class="down">{{ month.worst ? signedMoney(month.worst.pnl) : '—' }}</dd>
        <small>{{ month.worst ? shortDay(month.worst.date) : 'No sessions' }}</small>
      </div>
    </dl>

    <!-- Every session, newest first, opening in place. -->
    <div v-if="sessions.length" class="table-wrap">
      <table class="data data--striped data--bars cal-ledger" style="min-width:760px">
        <thead>
          <tr>
            <th>Session</th>
            <th class="num">Trades</th>
            <th class="num">Win rate</th>
            <th class="num">Net P&amp;L</th>
            <th class="num">Per trade</th>
            <th class="cal-ledger__chev" aria-label="Trades in this session"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="d in sessions" :key="d.date">
            <tr
              :id="`cal-${d.date}`"
              class="is-row"
              tabindex="0"
              :aria-expanded="open === d.date"
              @click="toggle(d)"
              @keydown.enter.prevent="toggle(d)"
              @keydown.space.prevent="toggle(d)"
            >
              <td class="cell-strong">
                <span class="cal-ledger__day">{{ weekday(d.date) }}</span>
                {{ shortDay(d.date) }}
              </td>
              <td class="num">{{ d.trades }}</td>
              <td class="num">{{ d.winRate.toFixed(1) }}%</td>
              <td class="num" :class="d.pnl >= 0 ? 'up' : 'down'">
                <span class="cell-bar" :class="`cell-bar--${d.pnl >= 0 ? 'win' : 'loss'}`" aria-hidden="true"><i :style="{ width: `${Math.max(2, (Math.abs(d.pnl) / barMax) * 100)}%` }"></i></span>
                <span class="cell-val">{{ signedMoney(d.pnl) }}</span>
              </td>
              <td class="num">{{ signedMoney(d.pnl / d.trades) }}</td>
              <td class="cal-ledger__chev">
                <AppIcon :name="open === d.date ? 'chevronDown' : 'chevronRight'" :size="15" />
              </td>
            </tr>

            <tr v-if="open === d.date" class="cal-ledger__detail">
              <td colspan="6">
                <div class="cal-detail">
                  <div class="cal-detail__head">
                    <span>{{ d.trades }} trades · {{ d.winRate.toFixed(1) }}% win rate</span>
                    <span :class="d.pnl >= 0 ? 'up' : 'down'"><b>{{ signedMoney(d.pnl) }}</b> on the day</span>
                  </div>
                  <table class="data cal-detail__table">
                    <thead>
                      <tr><th>Symbol</th><th>Side</th><th class="num">Volume</th><th>Held</th><th>Closed UTC</th><th class="num">Net P&amp;L</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="t in d.list" :key="t.id">
                        <td class="cell-strong">{{ t.symbol }}</td>
                        <td><span class="badge" :class="t.side === 'Buy' ? 'badge--active' : 'badge--breached'">{{ t.side }}</span></td>
                        <td class="num">{{ t.lots.toFixed(2) }}</td>
                        <td class="dim">{{ duration(t.holdMin) }}</td>
                        <td class="dim mono">{{ t.closedAt }}</td>
                        <td class="num net"><span :class="t.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(t.pnl) }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <p v-else class="empty">
      <strong>No sessions in {{ label }}</strong>
      This account did not trade in this month.
    </p>

    <div v-if="sessions.length" class="panel__foot">
      <span>
        {{ label }} close <b :class="month.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(month.pnl) }}</b>
        across {{ month.trades }} trades in {{ month.sessions }} {{ month.sessions === 1 ? 'session' : 'sessions' }}
      </span>
    </div>
  </section>
</template>
