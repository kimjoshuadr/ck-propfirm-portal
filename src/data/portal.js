/*
 * Decorative content + the display helpers derived from live trades.
 *
 * Everything the CRM API serves (USER, ACCOUNTS, PAYOUTS, notifications,
 * certificates, leaderboard, affiliate) lives in the store, `src/lib/portal.js`,
 * populated by `src/lib/api.js`; the API answers in exactly these shapes and
 * the field mapping happens once, in `api.js`'s mappers — never here, never in
 * the components.
 *
 * What remains in this module is:
 * - decorative copy the API has no endpoint for (the desk's NEWS, the FAQS,
 *   the demo EQUITY_CURVE behind the Overview promo charts) — each carries a
 *   "Demo data" badge where it renders;
 * - the INSTRUMENT reference table the sizer and the price columns need;
 * - the trade/analytics/calendar machinery that turns an account's LIVE
 *   trades (pushed in by the store through `setLiveAccount`) into the tables
 *   the Trades/Calendar/Analysis tabs render, and the same math the Overview
 *   cards read. With no live trades registered yet, every helper degrades to
 *   empty zeros rather than to invented rows.
 */

import { reactive } from 'vue'

/* ==========================================================================
   Live-data registry — the store registers each account's summary (and, for
   the open one, its detail) here; the display helpers below read it.
   ========================================================================== */

export const LIVE = reactive({ byNumber: {} })

/**
 * Register one account for the display helpers.
 * `account` is the demo-shaped summary (lib/portal.ACCOUNTS member);
 * `trades` (optional) are the mapped live trade rows (api.js mapTrade).
 */
export function setLiveAccount(number, { account, trades } = {}) {
  if (!number) return
  const prev = LIVE.byNumber[String(number)]
  LIVE.byNumber[String(number)] = {
    account: account || prev?.account || null,
    trades: trades || prev?.trades || [],
  }
}

export const accountByNumber = (number) =>
  LIVE.byNumber[String(number)]?.account || null

/* ------------------------------------------------------------------------- */
/* Decorative, non-API content                                               */
/* ------------------------------------------------------------------------- */

/* Desk notes and wire copy for the Market · Newsroom tab. */
export const NEWS = [
  { title: 'Gold holds above $3,180 as traders price a slower Fed path', source: 'CK Market Desk', time: '32 min ago', tag: 'Metals', body: 'Bullion is consolidating after a four-session run. The desk flags the 12:30 CPI print as the session\u2019s volatility trigger.' },
  { title: 'Nasdaq futures slip ahead of the rate decision', source: 'CK Market Desk', time: '1 h ago', tag: 'Indices', body: 'Index futures are softer into the FOMC. Realised volatility has compressed for six sessions.' },
  { title: 'Oil draws build a case for a supply deficit into Q4', source: 'Wire', time: '3 h ago', tag: 'Energy', body: 'Inventory data came in below consensus for a third straight week.' },
  { title: 'Dollar index prints a lower high for the first time in a month', source: 'CK Market Desk', time: '5 h ago', tag: 'FX', body: 'DXY is testing the top of the September range as rate expectations cool.' },
]

/* The knowledge-base search on Overview reads this list. */
export const FAQS = [
  { q: 'What exactly am I trading?', a: 'A simulated evaluation. Every account on the portal runs in a demo environment on simulated capital. Performance in a simulated environment is not indicative of real results, and no real money is ever traded.' },
  { q: 'How do the trading objectives work?', a: 'Each evaluation carries a profit target, a max loss, a max daily loss and a minimum number of trading days. The dashboard meters track every objective live, and the drawdown type (Static or Trailing Lock) is printed on the account card.' },
  { q: 'When can I request a payout?', a: 'Funded accounts on a payout cycle can request a withdrawal once the cycle closes. Requests are reviewed within one business day, then paid through RisePay, PayPal, bank transfer or USDT.' },
  { q: 'Is news trading allowed?', a: 'Yes. There are no restricted trading windows and no hidden fees. Trade the calendar as you would any other session.' },
  { q: 'How is consistency scored?', a: 'Consistency compares your best day\u2019s profit to your total profit. A lower number means your result is spread across sessions rather than concentrated in one.' },
]

/*
 * The demo equity curve behind the Overview's decorative promo charts.
 * NOT live data — the account cards and the Equity card's real series come
 * from the API.
 */
export const EQUITY_CURVE = [
  { d: 'Aug 24', v: 100000 }, { d: 'Aug 25', v: 100420 }, { d: 'Aug 26', v: 100180 },
  { d: 'Aug 27', v: 100640 }, { d: 'Aug 28', v: 100410 }, { d: 'Aug 31', v: 100890 },
  { d: 'Sep 01', v: 101240 }, { d: 'Sep 02', v: 100980 }, { d: 'Sep 03', v: 101360 },
  { d: 'Sep 04', v: 101120 }, { d: 'Sep 07', v: 101480 }, { d: 'Sep 08', v: 101210 },
  { d: 'Sep 09', v: 101640 }, { d: 'Sep 10', v: 101390 }, { d: 'Sep 11', v: 101760 },
  { d: 'Sep 14', v: 101420 }, { d: 'Sep 15', v: 101880 }, { d: 'Sep 16', v: 101540 },
  { d: 'Sep 17', v: 101930 }, { d: 'Sep 18', v: 101610 }, { d: 'Sep 19', v: 101593 },
]

/*
 * The instrument table the whole portal reads.
 *
 * `pip` and `unit` are what the sizer needs to turn a stop distance into money.
 * `usdPerPoint` is what a move of 1.0 in the quoted price is worth per lot, in
 * the account's dollars — which is NOT `contract` for a yen-quoted pair, where
 * the contract is denominated in yen. Without it a price move and a P&L figure
 * coming off the same trade are in two different currencies.
 */
export const INSTRUMENTS = [
  { symbol: 'XAUUSD', label: 'Gold', contract: 100, pip: 0.1, unit: 'points', price: 3182.4, usdPerPoint: 100 },
  { symbol: 'NAS100', label: 'Nasdaq 100', contract: 1, pip: 1, unit: 'points', price: 24210, usdPerPoint: 1 },
  { symbol: 'EURUSD', label: 'EUR/USD', contract: 100000, pip: 0.0001, unit: 'pips', price: 1.0842, usdPerPoint: 100000 },
  { symbol: 'US30', label: 'Dow 30', contract: 1, pip: 1, unit: 'points', price: 44120, usdPerPoint: 1 },
  { symbol: 'GBPJPY', label: 'GBP/JPY', contract: 100000, pip: 0.01, unit: 'pips', price: 189.42, usdPerPoint: 680 },
  { symbol: 'US100', label: 'US 100', contract: 1, pip: 1, unit: 'points', price: 24210, usdPerPoint: 1 },
  { symbol: 'GER30', label: 'DAX 40', contract: 1, pip: 1, unit: 'points', price: 18420, usdPerPoint: 1 },
  { symbol: 'USDJPY', label: 'USD/JPY', contract: 100000, pip: 0.01, unit: 'pips', price: 147.42, usdPerPoint: 680 },
]

/* Display precision per instrument — a EURUSD entry is not 3,182.4019. */
const PRICE_DP = { XAUUSD: 2, NAS100: 2, EURUSD: 5, US30: 1, GBPJPY: 3, US100: 2, GER30: 2, USDJPY: 3 }
const dpFor = (symbol) => PRICE_DP[symbol] ?? 2
/* The Trades table prints prices at the instrument's own precision. */
export const priceDpFor = dpFor

/* One price formatter, so a quote reads the same in every table. */
export const priceAt = (v, symbol) =>
  Number(v).toLocaleString('en-US', {
    minimumFractionDigits: dpFor(symbol),
    maximumFractionDigits: dpFor(symbol),
  })

/* ==========================================================================
   Display math over the LIVE trades (registered above by the store).
   ========================================================================== */

const round2 = (n) => Math.round(n * 100) / 100
const sum = (list) => round2(list.reduce((t, n) => t + n, 0))

/* The account's own equity series, oldest first: the API's snapshots when it
   has them, else an empty list — nothing is invented. */
export function sessionsFor(number) {
  const account = accountByNumber(number)
  if (!account || !Array.isArray(account.spark) || !account.spark.length) return []
  const started = account.started || new Date().toISOString().slice(0, 10)
  const dates = businessDays(started, account.spark.length)
  return account.spark.map((v, i) => ({ value: v, date: dates[i] }))
}

export const tradesFor = (number) => LIVE.byNumber[String(number)]?.trades || []

export const allTrades = () =>
  Object.values(LIVE.byNumber).flatMap((entry) => entry.trades || [])

/* Loss taken on the account's most recent logged day — the "today" its daily
   loss meter reads. */
export const maxLossToday = (number) => {
  const trades = tradesFor(number)
  if (!trades.length) return 0
  const day = trades[0].date
  return Math.abs(round2(trades.filter((t) => t.date === day && t.pnl < 0).reduce((t, x) => t + x.pnl, 0)))
}

/* Consistency and recovery follow from the log and the curve. */
export const consistencyFor = (number) => {
  const a = analyticsFor(number)
  return a.netPnl > 0 ? round2((a.bestDay / a.netPnl) * 100) : 0
}

export const recoveryFor = (number) => {
  const a = analyticsFor(number)
  return a.maxDrawdown > 0 ? round2(a.netPnl / a.maxDrawdown) : 0
}

/*
 * Open positions — the API carries none (there is no open-book endpoint), so
 * an account's Open view is an honest empty state until one exists. The demo
 * prototype used to synthesise a book from each balance curve; with live
 * accounts that invention would contradict the numbers beside it.
 */
export const openPositionsFor = () => []
export const openPnlFor = () => 0

/* Everything the Trades and Analytics tabs print, computed from the live log. */
export function analyticsFor(number) {
  const trades = tradesFor(number)
  const wins = trades.filter((t) => t.pnl > 0)
  const losses = trades.filter((t) => t.pnl <= 0)
  const avg = (list) => (list.length ? round2(sum(list.map((t) => t.pnl)) / list.length) : 0)

  const longest = (list, want) => {
    let best = 0
    let run = 0
    let total = 0
    let bestTotal = 0
    list.forEach((t) => {
      const hit = want(t.pnl)
      run = hit ? run + 1 : 0
      total = hit ? round2(total + t.pnl) : 0
      if (run > best) { best = run; bestTotal = total }
    })
    return { count: best, pnl: bestTotal }
  }

  const long = trades.filter((t) => t.side === 'Buy')
  const short = trades.filter((t) => t.side === 'Sell')
  const sideOf = (list) => ({
    trades: list.length,
    pnl: sum(list.map((t) => t.pnl)),
    winRate: list.length ? round2((list.filter((t) => t.pnl > 0).length / list.length) * 100) : 0,
    avgWin: avg(list.filter((t) => t.pnl > 0)),
    avgLoss: avg(list.filter((t) => t.pnl <= 0)),
  })

  const bySymbol = {}
  trades.forEach((t) => {
    bySymbol[t.symbol] = bySymbol[t.symbol] || { symbol: t.symbol, pnl: 0, trades: 0, wins: 0 }
    bySymbol[t.symbol].pnl = round2(bySymbol[t.symbol].pnl + t.pnl)
    bySymbol[t.symbol].trades += 1
    if (t.pnl > 0) bySymbol[t.symbol].wins += 1
  })

  const BUCKETS = [25000, 50000, 250000, 500000, Infinity]
  const byTicket = BUCKETS.map((max, i) => {
    const min = i === 0 ? 0 : BUCKETS[i - 1]
    const list = trades.filter((t) => t.ticketSize > min && t.ticketSize <= max)
    return {
      label: max === Infinity ? `$${(min / 1000).toFixed(0)}K+` : `$${(min / 1000).toFixed(0)}K – $${(max / 1000).toFixed(0)}K`,
      trades: list.length,
      pnl: sum(list.map((t) => t.pnl)),
      winRate: list.length ? round2((list.filter((t) => t.pnl > 0).length / list.length) * 100) : 0,
      avgPnl: avg(list),
    }
  })

  const dayTotals = {}
  trades.forEach((t) => { dayTotals[t.date] = round2((dayTotals[t.date] || 0) + t.pnl) })

  const holdOf = (list) => (list.length ? Math.round(list.reduce((t, x) => t + x.holdMin, 0) / list.length) : 0)
  const sortedHold = [...trades].sort((a, b) => b.holdMin - a.holdMin)
  const best = trades.reduce((a, b) => (b.pnl > (a?.pnl ?? -Infinity) ? b : a), null)
  const worst = trades.reduce((a, b) => (b.pnl < (a?.pnl ?? Infinity) ? b : a), null)

  return {
    trades,
    count: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length ? round2((wins.length / trades.length) * 100) : 0,
    netPnl: sum(trades.map((t) => t.pnl)),
    avgWin: avg(wins),
    avgLoss: avg(losses),
    best,
    worst,
    riskReward: avg(losses) !== 0 ? round2(Math.abs(avg(wins) / avg(losses))) : 0,
    hold: {
      win: holdOf(wins),
      loss: holdOf(losses),
      avg: holdOf(trades),
      best: best?.holdMin || 0,
      worst: worst?.holdMin || 0,
      longest: sortedHold[0]?.holdMin || 0,
    },
    winStreak: longest(trades, (p) => p > 0),
    lossStreak: longest(trades, (p) => p <= 0),
    current: (() => {
      if (!trades.length) return { count: 0, pnl: 0, winning: false }
      const winning = trades[0].pnl > 0
      let run = 0
      let total = 0
      for (const t of trades) {
        if ((t.pnl > 0) !== winning) break
        run += 1
        total = round2(total + t.pnl)
      }
      return { count: run, pnl: total, winning }
    })(),
    bySymbol: Object.values(bySymbol).sort((a, b) => a.pnl - b.pnl),
    byTicket,
    long: sideOf(long),
    short: sideOf(short),

    /* Gross totals behind the averages, so a profit factor can be read off
       without another pass over the log. */
    grossWin: sum(wins.map((t) => t.pnl)),
    grossLoss: Math.abs(sum(losses.map((t) => t.pnl))),
    profitFactor: (() => {
      const gl = Math.abs(sum(losses.map((t) => t.pnl)))
      return gl ? round2(sum(wins.map((t) => t.pnl)) / gl) : 0
    })(),
    notional: Math.round(sum(trades.map((t) => t.ticketSize))),
    instruments: Object.keys(bySymbol).length,
    strategies: new Set(trades.map((t) => t.tag)).size,

    /* Day buckets: the calendar's rows, reduced to the two extremes plus a
       count, so daily averages can be reported without re-deriving them. */
    days: Object.keys(dayTotals).length,
    bestDay: Math.max(0, ...Object.values(dayTotals)),
    worstDay: Math.min(0, ...Object.values(dayTotals)),
    avgDay: Object.keys(dayTotals).length
      ? round2(sum(Object.values(dayTotals)) / Object.keys(dayTotals).length)
      : 0,

    /* Derived from the same series the chart draws, so the score tab and the
       chart can never disagree. */
    maxDrawdown: (() => {
      const values = sessionsFor(number).map((s) => s.value)
      let peak = values[0]
      let worst = 0
      values.forEach((v) => {
        peak = Math.max(peak, v)
        worst = Math.max(worst, peak - v)
      })
      return round2(worst)
    })(),
  }
}

/* The calendar grid for one month: week rows, each with its own summary. */
export function calendarFor(number, year, month) {
  const pad2 = (n) => String(n).padStart(2, '0')
  const trades = tradesFor(number).filter((t) => t.date.startsWith(`${year}-${pad2(month)}`))
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()

  const cells = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${year}-${pad2(month)}-${pad2(d)}`
    const list = trades.filter((t) => t.date === iso)
    cells.push({
      day: d,
      date: iso,
      pnl: sum(list.map((t) => t.pnl)),
      trades: list.length,
      winRate: list.length ? round2((list.filter((t) => t.pnl > 0).length / list.length) * 100) : 0,
      list,
    })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    const days = cells.slice(i, i + 7)
    const traded = days.filter((d) => d && d.trades)
    const pnl = sum(traded.map((d) => d.pnl))
    const base = days.find((d) => d)?.day || 1
    weeks.push({
      index: weeks.length + 1,
      first: base,
      pnl,
      pct: round2((pnl / Math.max(1, (accountByNumber(number)?.size || 1))) * 100),
      days,
    })
  }
  return { year, month, daysInMonth, firstWeekday, weeks, trades }
}

function businessDays(startISO, count) {
  const out = []
  const d = new Date(`${startISO}T00:00:00Z`)
  while (out.length < count) {
    const wd = d.getUTCDay()
    if (wd !== 0 && wd !== 6) out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}
