/*
 * Slice of the portal dataset the Vue app needs. Mirrors assets/js/data.js,
 * which is still the source for the static pages.
 *
 * `spark` arrays are demo series: each one starts at the account size and ends
 * at its current balance, so the card's chart and its number agree. They are
 * simulated, like every other figure in this prototype.
 */

export const USER = {
  name: 'Kim Joshua',
  handle: 'kimjoshua',
  email: 'kim@ckpropfirm.com',
  initials: 'KJ',
  plan: 'CK Fam',
  joined: 'Mar 2026',
  country: 'PH',
  kyc: 'verified',
}

export const ACCOUNTS = [
  {
    id: 'CK-100K-2418', number: '412907', label: 'CK 100K Evaluation', plan: '100K Challenge',
    phase: 'Phase 1 · Evaluation', status: 'active', platform: 'TradeLocker',
    size: 100000, balance: 101593, equity: 101742, pnl: 1593, roi: 1.59,
    profitTarget: 8000, maxLoss: 8000, dailyLoss: 4000, maxLossUsed: 2321,
    drawdownType: 'Trailing Lock', minTradingDays: 4, consistency: 72, profitFactor: 1.82,
    avgWinLoss: 3.9, maxDrawdown: 2.31, recovery: 4.1,
    tradingDays: 2, winRate: 61.4, score: 83.23, started: '2026-08-24',
    spark: [100000, 100180, 100420, 100180, 100640, 100910, 101240, 100980, 101360, 101180, 101540, 101593],
  },
  {
    id: 'CK-50K-9032', number: '418233', label: 'CK 50K Swing', plan: '50K Challenge',
    phase: 'Phase 2 · Verification', status: 'active', platform: 'MetaTrader 5',
    size: 50000, balance: 52480, equity: 52310, pnl: 2480, roi: 4.96,
    profitTarget: 2500, maxLoss: 4000, dailyLoss: 2000, maxLossUsed: 640,
    drawdownType: 'Static', minTradingDays: 4, consistency: 64, profitFactor: 1.64,
    avgWinLoss: 2.8, maxDrawdown: 1.42, recovery: 3.2,
    tradingDays: 6, winRate: 57.9, score: 76.4, started: '2026-07-30',
    spark: [50000, 50240, 50110, 50480, 50720, 50560, 51040, 51320, 51180, 51860, 52120, 52480],
  },
  {
    id: 'CK-25K-5510', number: '401566', label: 'CK 25K Funded', plan: '25K Funded',
    phase: 'Funded · Payout cycle 3', status: 'funded', platform: 'TradeLocker',
    size: 25000, balance: 27640, equity: 27490, pnl: 2640, roi: 10.56,
    profitTarget: 0, maxLoss: 2000, dailyLoss: 1000, maxLossUsed: 210,
    drawdownType: 'Trailing Lock', minTradingDays: 0, consistency: 68, profitFactor: 1.97,
    avgWinLoss: 3.1, maxDrawdown: 1.08, recovery: 5.3,
    tradingDays: 21, winRate: 59.2, score: 91.7, started: '2026-05-11',
    spark: [25000, 25380, 25610, 25420, 25940, 26280, 26110, 26640, 26980, 26720, 27310, 27640],
  },
  {
    id: 'CK-100K-1904', number: '409118', label: 'CK 100K Evaluation · attempt 2', plan: '100K Challenge',
    phase: 'Phase 1 · Evaluation', status: 'breached', platform: 'MetaTrader 5',
    size: 100000, balance: 91800, equity: 91800, pnl: -8200, roi: -8.2,
    profitTarget: 8000, maxLoss: 8000, dailyLoss: 4000, maxLossUsed: 8000,
    drawdownType: 'Static', minTradingDays: 4, consistency: 38, profitFactor: 0.71,
    avgWinLoss: 1.1, maxDrawdown: 8.2, recovery: 0.6,
    tradingDays: 9, winRate: 42.1, score: 41.2, started: '2026-06-02',
    spark: [100000, 99240, 98610, 97380, 96520, 95410, 94860, 93640, 92980, 92410, 91960, 91800],
  },
]

export const PAYOUTS = [
  { id: 'PO-44821', account: 'CK-25K-5510', amount: 6120, method: 'RisePay', requested: '2026-09-02', settled: '2026-09-04', status: 'paid', split: 90 },
  { id: 'PO-44680', account: 'CK-25K-5510', amount: 4380, method: 'USDT (TRC-20)', requested: '2026-08-12', settled: '2026-08-13', status: 'paid', split: 90 },
  { id: 'PO-44702', account: 'CK-25K-5510', amount: 3980, method: 'PayPal', requested: '2026-08-27', settled: '—', status: 'processing', split: 80 },
  { id: 'PO-44417', account: 'CK-25K-5510', amount: 2450, method: 'RisePay', requested: '2026-07-22', settled: '2026-07-24', status: 'paid', split: 80 },
  { id: 'PO-44990', account: 'CK-25K-5510', amount: 1800, method: 'Bank transfer', requested: '2026-09-16', settled: '—', status: 'pending', split: 90 },
  { id: 'PO-44103', account: 'CK-100K-1904', amount: 0, method: 'RisePay', requested: '2026-06-28', settled: '—', status: 'rejected', split: 0 },
]

export const paidPayoutTotal = () =>
  PAYOUTS.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

/*
 * Account lifecycle, in the order a trader actually meets it. Copy addresses
 * the trader and names accounts by their label — no account ids, order numbers
 * or other back-office identifiers on this surface. `category` drives the
 * alert filters on Overview and the severity tone everywhere.
 */
export const NOTIFICATIONS = [
  { id: 'account-breached', account: '409118', category: 'risk', icon: 'alert', tone: 'warn', title: 'Account Breached', msg: 'Account 409118 · CK 100K Evaluation hit the $8,000.00 maximum loss (8.0% of capital) — equity closed at $91,800.00.', time: '18 days ago' },
  { id: 'account-ready', account: '412907', category: 'info', icon: 'check', tone: 'good', title: 'Account Ready', msg: 'Account 412907 · your CK 100K Evaluation is ready. Time to trade.', time: 'about 1 month ago' },
  { id: 'phase-passed', account: '418233', category: 'info', icon: 'check', tone: 'good', title: 'Phase Passed', msg: 'Account 418233 · your CK 50K Swing passed Phase 1. Phase 2 verification unlocks now.', time: 'about 1 month ago' },
  { id: 'order-cf50k', account: '418233', category: 'payout', icon: 'info', tone: 'info', title: 'Order Confirmation', msg: 'Account 418233 · your CK 50K Swing evaluation order is confirmed — $118.00 paid with code 10KFOR19.', time: 'about 2 months ago' },
  { id: 'order-cf100k', account: '409118', category: 'payout', icon: 'info', tone: 'info', title: 'Order Confirmation', msg: 'Account 409118 · your CK 100K Evaluation order is confirmed — $193.00 paid.', time: 'about 3 months ago' },
]

export const pendingPayoutCount = () =>
  PAYOUTS.filter((p) => p.status === 'pending' || p.status === 'processing').length

/* Session-by-session balance for the active evaluation (Aug 24 → Sep 19). */
export const EQUITY_CURVE = [
  { d: 'Aug 24', v: 100000 }, { d: 'Aug 25', v: 100420 }, { d: 'Aug 26', v: 100180 },
  { d: 'Aug 27', v: 100640 }, { d: 'Aug 28', v: 100410 }, { d: 'Aug 31', v: 100890 },
  { d: 'Sep 01', v: 101240 }, { d: 'Sep 02', v: 100980 }, { d: 'Sep 03', v: 101360 },
  { d: 'Sep 04', v: 101120 }, { d: 'Sep 07', v: 101480 }, { d: 'Sep 08', v: 101210 },
  { d: 'Sep 09', v: 101640 }, { d: 'Sep 10', v: 101390 }, { d: 'Sep 11', v: 101760 },
  { d: 'Sep 14', v: 101420 }, { d: 'Sep 15', v: 101880 }, { d: 'Sep 16', v: 101540 },
  { d: 'Sep 17', v: 101930 }, { d: 'Sep 18', v: 101610 }, { d: 'Sep 19', v: 101593 },
]

/* Season standings, best first. The Overview card shows the top three; the
   Community · Leaderboard screen shows the whole table. */
export const LEADERBOARD = [
  { rank: 1, handle: 'vael.trades', country: 'SG', account: '200K', roi: 41.6, profit: 83200, streak: 14, verified: true },
  { rank: 2, handle: 'mira.quant', country: 'GB', account: '200K', roi: 38.2, profit: 76400, streak: 9, verified: true },
  { rank: 3, handle: 'dz.nexus', country: 'AE', account: '100K', roi: 35.7, profit: 35700, streak: 12, verified: true },
  { rank: 4, handle: 'kimjoshua', country: 'PH', account: '25K', roi: 33.4, profit: 2640, streak: 7, verified: true, isUser: true },
  { rank: 5, handle: 'sable.alpha', country: 'DE', account: '100K', roi: 31.1, profit: 31100, streak: 5, verified: true },
  { rank: 6, handle: 'noct.fx', country: 'BR', account: '50K', roi: 29.8, profit: 14900, streak: 8, verified: false },
  { rank: 7, handle: 'orla.trend', country: 'IE', account: '100K', roi: 28.4, profit: 28400, streak: 6, verified: true },
  { rank: 8, handle: 'hiro.swing', country: 'JP', account: '50K', roi: 26.9, profit: 13450, streak: 4, verified: true },
  { rank: 9, handle: 'petra.scalp', country: 'CZ', account: '25K', roi: 25.2, profit: 6300, streak: 11, verified: true },
  { rank: 10, handle: 'abel.gold', country: 'ZA', account: '100K', roi: 24.0, profit: 24000, streak: 3, verified: false },
]

/*
 * Certificates carry a verification code because the holder is meant to type
 * it back in — so the code stays, but the account is named by its label, not
 * by the internal id.
 */
export const CERTIFICATES = [
  { code: 'CK-CERT-8F42-9017', account: 'CK 25K Funded', number: '401566', title: 'Funded account certificate', total: 16930, issues: 'Payout cycle 3', issued: '22 Jan 2025' },
  { code: 'CK-CERT-2B77-4410', account: 'CK 25K Funded', number: '401566', title: 'Verification certificate', total: 8350, issues: 'Phase 2 cleared', issued: '22 Jan 2025' },
  { code: 'CK-CERT-51A9-3388', account: 'CK 50K Swing', number: '418233', title: 'Evaluation certificate', total: 2480, issues: 'Phase 1 cleared', issued: '22 Jan 2025' },
]

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

/* ==========================================================================
   Derived demo content — the trade log, the calendar and the analytics are
   generated once from each account's own balance curve, so every trade, day
   and bucket reconciles with that account's P&L instead of being authored by
   hand and drifting. Same demo-data caveat as the rest of this prototype.
   ========================================================================== */

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

const TAGS = ['Scalp', 'Swing', 'Breakout', 'Reversal', 'Trend', 'News trading']

/* Deterministic PRNG so the log is identical on every load. */
const prng = (seed) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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

const round2 = (n) => Math.round(n * 100) / 100
const ACTIVE_ID = ACCOUNTS[0].id
const seriesOf = (a) => (a.id === ACTIVE_ID ? EQUITY_CURVE.map((p) => p.v) : a.spark)

/* A flat per-lot cost on the simulated book, stated so the Profit / Commission
   / Net PnL columns add up: profit (gross) − commission = the net that the
   balance curve is built from. */
const COMMISSION_PER_LOT = 3.5
const commissionFor = (lots) => round2(lots * COMMISSION_PER_LOT)

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
const fix = (n, symbol) => Number(n.toFixed(dpFor(symbol)))

function buildLog(account) {
  const rnd = prng(Number(account.number))
  const series = seriesOf(account)
  const dates = businessDays(account.started, series.length)
  const trades = []
  let ticket = 90000 + (Number(account.number) % 900)

  const at = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const emit = (share, date) => {
    const inst = INSTRUMENTS[Math.floor(rnd() * INSTRUMENTS.length)]
    const lots = round2(0.3 + rnd() * 2.4)
    const holdMin = 8 + Math.floor(rnd() * 320)
    const openHour = 6 + Math.floor(rnd() * 12)
    const openMin = Math.floor(rnd() * 60)
    const side = rnd() > 0.46 ? 'Buy' : 'Sell'

    /* The prices follow from the gross the row shows, not from the net, so the
       row's own arithmetic holds both ways:
         (exit − entry) × lots × contract = profit,  profit − commission = net.
       A Buy gains when the exit is above the entry. */
    const entry = fix(inst.price * (1 + (rnd() - 0.5) * 0.004), inst.symbol)
    const commission = commissionFor(lots)
    const gross = round2(share + commission)
    const move = gross / (lots * inst.usdPerPoint)
    const exit = fix(side === 'Buy' ? entry + move : entry - move, inst.symbol)

    trades.push({
      id: `TX-${ticket += 1}`,
      account: account.number,
      date,
      openedAt: at(openHour, openMin),
      closedAt: at((openHour + Math.floor(holdMin / 60)) % 24, (openMin + holdMin) % 60),
      symbol: inst.symbol,
      side,
      lots,
      entry,
      exit,
      /* Gross before the round-turn cost; profit − commission is the net below. */
      profit: round2(share + commission),
      commission,
      ticketSize: Math.round(lots * inst.contract * inst.price),
      holdMin,
      pnl: share,
      r: round2(share / 180),
      tag: TAGS[Math.floor(rnd() * TAGS.length)],
    })
  }

  for (let i = 1; i < series.length; i += 1) {
    const date = dates[i - 1]
    let left = round2(series[i] - series[i - 1])

    /* Most days carry at least one trade against the day's direction, which is
       what keeps the win/loss mix and the streak analysis plausible. */
    if (Math.abs(left) > 120 && rnd() < 0.62) {
      const size = Math.min(Math.abs(left) * 0.34, 30 + rnd() * 90)
      const counter = round2(-Math.sign(left) * size)
      left = round2(left - counter)
      emit(counter, date)
    }

    const parts = 1 + Math.floor(rnd() * 2)
    for (let p = 0; p < parts; p += 1) {
      const last = p === parts - 1
      const share = last ? left : round2(left * (0.55 + rnd() * 0.4))
      left = round2(left - share)
      emit(share, date)
    }
  }
  return trades.reverse()
}

/*
 * Open positions.
 *
 * The prototype held none, which left the Trades tab's Open view as an empty
 * state. Each account now carries the positions its own numbers imply: the
 * unrealised total on an account's open book is exactly equity − balance, so
 * "equity = balance + open P&L" is true on every card, header and table rather
 * than asserted in one place and contradicted in another. A breached account
 * has none, because it has nothing left to trade.
 *
 * The marks are authored and the money is derived from them, which is the only
 * way the row's own arithmetic can hold: (current − entry) × lots × contract,
 * signed by the side, is the unrealised figure in the table. The pairs are also
 * chosen so each account's open total lands exactly on its equity − balance.
 */
const OPEN_BOOK = {
  /* +$149.00 open on the 100K evaluation. */
  '412907': [
    { symbol: 'XAUUSD', side: 'Buy', lots: 0.1, entry: 3182.4, current: 3192, openedAt: '09:12' },
    { symbol: 'EURUSD', side: 'Sell', lots: 0.5, entry: 1.08526, current: 1.0842, openedAt: '11:40' },
  ],
  /* −$170.00 open on the 50K swing. */
  '418233': [
    { symbol: 'NAS100', side: 'Buy', lots: 0.5, entry: 24210, current: 23970, openedAt: '08:05' },
    { symbol: 'XAUUSD', side: 'Sell', lots: 0.25, entry: 3180.4, current: 3182.4, openedAt: '13:22' },
  ],
  /* −$150.00 open on the funded account, mid payout cycle. */
  '401566': [
    { symbol: 'GER30', side: 'Buy', lots: 0.4, entry: 18645, current: 18420, openedAt: '07:48' },
    { symbol: 'EURUSD', side: 'Buy', lots: 1.2, entry: 1.0847, current: 1.0842, openedAt: '12:15' },
  ],
}

/* Position marks are read against the session the portal is showing. */
const OPEN_DATE = '2026-09-21'

export const openPositionsFor = (number) => {
  const book = OPEN_BOOK[String(number)] || []
  return book.map((p, i) => {
    const inst = INSTRUMENTS.find((x) => x.symbol === p.symbol) || INSTRUMENTS[0]
    const sign = p.side === 'Buy' ? 1 : -1
    const unrealized = round2(sign * (p.current - p.entry) * p.lots * inst.usdPerPoint)
    const commission = commissionFor(p.lots)
    return {
      id: `OP-${number}-${i + 1}`,
      openedDate: OPEN_DATE,
      openedAt: p.openedAt,
      symbol: p.symbol,
      side: p.side,
      lots: p.lots,
      closedLots: 0,
      entry: p.entry,
      current: p.current,
      unrealized,
      commission,
      /* What the position is worth if it is closed at the current mark. */
      net: round2(unrealized - commission),
      status: 'Open',
    }
  })
}

/* What the open book is worth right now — the same figure as equity − balance. */
export const openPnlFor = (number) =>
  round2(openPositionsFor(number).reduce((t, p) => t + p.unrealized, 0))

const LOG = Object.fromEntries(ACCOUNTS.map((a) => [a.number, buildLog(a)]))

export const tradesFor = (number) => LOG[number] || []

/* Consistency and recovery follow from the log and the curve. */
export const consistencyFor = (number) => {
  const a = analyticsFor(number)
  return a.netPnl > 0 ? round2((a.bestDay / a.netPnl) * 100) : 0
}

export const recoveryFor = (number) => {
  const a = analyticsFor(number)
  return a.maxDrawdown > 0 ? round2(a.netPnl / a.maxDrawdown) : 0
}
export const allTrades = () => Object.values(LOG).flat()
export const accountByNumber = (number) => ACCOUNTS.find((a) => a.number === String(number))

/* Loss taken on the account's most recent logged day — the "today" its daily
   loss meter reads, since the demo log is historical. */
export const maxLossToday = (number) => {
  const trades = tradesFor(number)
  if (!trades.length) return 0
  const day = trades[0].date
  return Math.abs(round2(trades.filter((t) => t.date === day && t.pnl < 0).reduce((t, x) => t + x.pnl, 0)))
}

/* Session-by-session closes, newest first, for the detail chart's labels. */
export function sessionsFor(number) {
  const account = accountByNumber(number)
  if (!account) return []
  const values = seriesOf(account)
  const dates = businessDays(account.started, values.length)
  return values.map((v, i) => ({ value: v, date: dates[i] }))
}

const sum = (list) => round2(list.reduce((t, n) => t + n, 0))

/* Everything the Trades and Analytics tabs print, computed from the log. */
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

    /* Derived from the same curve the chart draws, so the score tab and the
       chart can never disagree. */
    maxDrawdown: (() => {
      const values = seriesOf(accountByNumber(number) || ACCOUNTS[0])
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
  const pad = (n) => String(n).padStart(2, '0')
  const trades = tradesFor(number).filter((t) => t.date.startsWith(`${year}-${pad(month)}`))
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()

  const cells = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${year}-${pad(month)}-${pad(d)}`
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
