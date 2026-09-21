/*
 * Economic calendar — demo dataset.
 *
 * Real indicator names and the release rhythm of the week of 21–27 Sep 2026,
 * with plausible forecast / previous / actual figures. This prototype has no
 * data feed, so the figures are demo content like the rest of the portal.
 *
 * Each entry is a UTC instant. The page renders it in whichever zone the
 * reader picks, and the day groups are decided in that same zone — so changing
 * the timezone genuinely moves rows between days rather than relabelling them.
 */

export const TIMEZONES = [
  { id: 'Asia/Manila', label: 'Asia/Manila', short: 'PHT' },
  { id: 'UTC', label: 'UTC', short: 'UTC' },
  { id: 'Asia/Singapore', label: 'Asia/Singapore', short: 'SGT' },
  { id: 'Europe/London', label: 'Europe/London', short: 'BST' },
  { id: 'America/New_York', label: 'America/New_York', short: 'EDT' },
]

export const IMPACTS = [
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
  { id: 'holiday', label: 'Holiday' },
]

/* Mon 21 Sep — listed in Manila time, so the UTC instants sit eight hours earlier. */
export const ECONOMIC_EVENTS = [
  { at: '2026-09-20T23:00:00Z', ccy: 'JPY', impact: 'holiday', title: 'Bank Holiday', forecast: '—', previous: '—', actual: '—' },
  { at: '2026-09-20T23:01:00Z', ccy: 'GBP', impact: 'low', title: 'Rightmove HPI m/m', forecast: '0.4%', previous: '-2.0%', actual: '0.3%' },
  { at: '2026-09-21T03:00:00Z', ccy: 'NZD', impact: 'low', title: 'Credit Card Spending y/y', forecast: '4.8%', previous: '5.3%', actual: '5.1%' },
  { at: '2026-09-21T10:00:00Z', ccy: 'EUR', impact: 'low', title: 'German Buba Monthly Report', forecast: '—', previous: '—', actual: '—' },
  { at: '2026-09-21T10:30:00Z', ccy: 'USD', impact: 'low', title: 'FOMC Member Goolsbee Speaks', forecast: '—', previous: '—', actual: '—' },
  { at: '2026-09-21T15:00:00Z', ccy: 'EUR', impact: 'medium', title: 'ECB President Lagarde Speaks', forecast: '—', previous: '—', actual: '—' },
  { at: '2026-09-21T15:05:00Z', ccy: 'CAD', impact: 'medium', title: 'BOC Gov Macklem Speaks', forecast: '—', previous: '—', actual: '—' },

  /* Tue 22 Sep */
  { at: '2026-09-21T23:01:00Z', ccy: 'CNY', impact: 'holiday', title: 'Bank Holiday', forecast: '—', previous: '—', actual: '—' },
  { at: '2026-09-22T06:00:00Z', ccy: 'EUR', impact: 'low', title: 'German GfK Consumer Climate', forecast: '-27.1', previous: '-26.6', actual: '—' },
  { at: '2026-09-22T08:00:00Z', ccy: 'EUR', impact: 'low', title: 'M3 Money Supply y/y', forecast: '3.5%', previous: '3.4%', actual: '—' },
  { at: '2026-09-22T08:00:00Z', ccy: 'EUR', impact: 'low', title: 'Private Loans y/y', forecast: '3.2%', previous: '3.1%', actual: '—' },
  { at: '2026-09-22T09:15:00Z', ccy: 'GBP', impact: 'high', title: 'BOE Gov Bailey Speaks', forecast: '—', previous: '—', actual: '—' },
  { at: '2026-09-22T09:15:00Z', ccy: 'USD', impact: 'low', title: 'FOMC Member Williams Speaks', forecast: '—', previous: '—', actual: '—' },
  { at: '2026-09-22T12:30:00Z', ccy: 'USD', impact: 'low', title: 'Core Durable Goods Orders m/m', forecast: '0.5%', previous: '0.4%', actual: '—' },
  { at: '2026-09-22T12:30:00Z', ccy: 'USD', impact: 'low', title: 'Durable Goods Orders m/m', forecast: '-0.3%', previous: '1.1%', actual: '—' },
  { at: '2026-09-22T14:00:00Z', ccy: 'USD', impact: 'medium', title: 'Revised UoM Consumer Sentiment', forecast: '47.5', previous: '47.8', actual: '—' },
  { at: '2026-09-22T14:00:00Z', ccy: 'USD', impact: 'medium', title: 'Revised UoM Inflation Expectations', forecast: '4.6%', previous: '4.6%', actual: '—' },

  /* Wed 23 Sep */
  { at: '2026-09-23T06:00:00Z', ccy: 'GBP', impact: 'high', title: 'CPI y/y', forecast: '2.9%', previous: '3.2%', actual: '—' },
  { at: '2026-09-23T08:00:00Z', ccy: 'EUR', impact: 'medium', title: 'German Ifo Business Climate', forecast: '88.6', previous: '88.4', actual: '—' },
  { at: '2026-09-23T14:30:00Z', ccy: 'USD', impact: 'medium', title: 'Crude Oil Inventories', forecast: '-2.1M', previous: '-1.8M', actual: '—' },
  { at: '2026-09-23T18:00:00Z', ccy: 'USD', impact: 'high', title: 'Federal Funds Rate', forecast: '4.25%', previous: '4.25%', actual: '—' },
  { at: '2026-09-23T18:30:00Z', ccy: 'USD', impact: 'high', title: 'FOMC Press Conference', forecast: '—', previous: '—', actual: '—' },
  { at: '2026-09-23T23:50:00Z', ccy: 'JPY', impact: 'medium', title: 'Trade Balance', forecast: '¥0.32T', previous: '¥0.28T', actual: '—' },

  /* Thu 24 Sep */
  { at: '2026-09-24T06:00:00Z', ccy: 'GBP', impact: 'medium', title: 'Retail Sales m/m', forecast: '0.4%', previous: '0.2%', actual: '—' },
  { at: '2026-09-24T11:00:00Z', ccy: 'GBP', impact: 'high', title: 'BOE Interest Rate Decision', forecast: '4.00%', previous: '4.25%', actual: '—' },
  { at: '2026-09-24T12:30:00Z', ccy: 'USD', impact: 'high', title: 'GDP q/q', forecast: '2.4%', previous: '2.1%', actual: '—' },
  { at: '2026-09-24T12:30:00Z', ccy: 'USD', impact: 'medium', title: 'Initial Jobless Claims', forecast: '224K', previous: '219K', actual: '—' },
  { at: '2026-09-24T14:00:00Z', ccy: 'USD', impact: 'medium', title: 'Pending Home Sales m/m', forecast: '0.6%', previous: '-0.4%', actual: '—' },
  { at: '2026-09-24T23:30:00Z', ccy: 'JPY', impact: 'medium', title: 'BOJ Gov Ueda Speaks', forecast: '—', previous: '—', actual: '—' },

  /* Fri 25 Sep */
  { at: '2026-09-25T06:00:00Z', ccy: 'EUR', impact: 'low', title: 'German Import Prices m/m', forecast: '0.3%', previous: '-0.2%', actual: '—' },
  { at: '2026-09-25T12:30:00Z', ccy: 'USD', impact: 'high', title: 'Core PCE Price Index m/m', forecast: '0.2%', previous: '0.3%', actual: '—' },
  { at: '2026-09-25T12:30:00Z', ccy: 'USD', impact: 'medium', title: 'Personal Spending m/m', forecast: '0.4%', previous: '0.5%', actual: '—' },
  { at: '2026-09-25T14:00:00Z', ccy: 'USD', impact: 'medium', title: 'Michigan Consumer Sentiment', forecast: '55.2', previous: '54.8', actual: '—' },
  { at: '2026-09-25T15:00:00Z', ccy: 'EUR', impact: 'medium', title: 'ECB President Lagarde Speaks', forecast: '—', previous: '—', actual: '—' },
]
