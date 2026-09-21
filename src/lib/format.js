/*
 * Display formatters shared across the Vue app. Kept tiny and framework-free
 * so the same call also works from the static shell's helpers.
 */

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const ordinal = (n) => {
  const rest = n % 100
  if (rest >= 11 && rest <= 13) return 'th'
  return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'
}

/* "Sunday, September 20th, 2026" — the top bar's session date. */
export function longDate(date = new Date()) {
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}${ordinal(date.getDate())}, ${date.getFullYear()}`
}

export function timeOfDay(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

const usd = (n, decimals) => Math.abs(n).toLocaleString('en-US', {
  minimumFractionDigits: decimals, maximumFractionDigits: decimals,
})

/* "$101,593.00" */
export const money = (n) => `${n < 0 ? '-' : ''}$${usd(n, 2)}`

/* "+$1,593.00" — the sign always leads, for P/L columns. */
export const signedMoney = (n) => `${n >= 0 ? '+' : '-'}$${usd(n, 2)}`

/* "+1.59%" */
export const signedPct = (n, d = 2) => `${n >= 0 ? '+' : '-'}${Math.abs(n).toFixed(d)}%`

/* "$101,593" — chart axes and tight spaces. */
export const compactMoney = (n) => {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(abs >= 100_000 ? 0 : 1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

/* "vael.trades" → "VT" */
export const initials = (handle = '') =>
  handle.split(/[.\s_-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* "2026-09-18" → "Sep 18" */
export const shortDate = (iso) => {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${SHORT[Number(m) - 1]} ${Number(d)}`
}

/* "2026-09-18" → "Sep 18, 2026" */
export const longDateISO = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${SHORT[Number(m) - 1]} ${Number(d)}, ${y}`
}
