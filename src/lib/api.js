/*
 * CRM API client — the single seam between the portal and the CK CRM's
 * trader-portal REST API (see ck-crm/src/modules/portal_api/README.md).
 *
 * - Base URL comes from VITE_CRM_API (default http://localhost:3000 — the CRM
 *   dev server) so staging/prod point elsewhere without touching logic.
 * - The bearer token lives in sessionStorage (cleared with the tab, per the
 *   cross-domain auth model: POST …/portal/token → JWT in the body; every
 *   call then sends `Authorization: Bearer <token>`).
 * - Every response is unwrapped once, here: `!res.ok` throws an Error carrying
 *   the server's `error` message and machine-readable `code`; a 401 clears the
 *   token and drops the app on `#login`.
 * - Field differences between the API payloads and the portal's demo shapes
 *   are adapted HERE, in the map* functions — never in the components.
 */

const BASE = (import.meta.env.VITE_CRM_API || 'http://localhost:3000').replace(/\/$/, '')

const TOKEN_KEY = 'ck.crmToken'

export function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch { /* private mode — the session just won't survive a reload */ }
}

export function clearToken() { setToken(null) }

export function hasToken() { return !!getToken() }

/* The store registers itself here, so a 401 anywhere can drop the shell
   without a circular import. */
let unauthorizedHandler = null
export function onUnauthorized(fn) { unauthorizedHandler = fn }

export class ApiError extends Error {
  constructor(message, status = 0, code = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * The one fetch wrapper. `form` (a FormData) is sent as-is (multipart);
 * anything else passed as `body` is JSON-encoded.
 */
export async function api(path, { method = 'GET', body, form, auth = true } = {}) {
  const headers = {}
  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: payload })
  } catch {
    throw new ApiError('Could not reach the CRM API — is the server running?', 0)
  }

  let data = null
  try { data = await res.json() } catch { /* empty body */ }

  if (res.status === 401) {
    clearToken()
    try { unauthorizedHandler?.() } catch { /* ignore */ }
    if (typeof location !== 'undefined' && location.hash !== '#login') location.hash = '#login'
  }

  if (!res.ok) {
    throw new ApiError(
      data?.error || data?.message || `Request failed (${res.status})`,
      res.status,
      data?.code || null,
    )
  }
  return data
}

/* ==========================================================================
   Auth
   ========================================================================== */

/**
 * POST /api/portal_api/portal/token — the sole supported cross-domain login.
 * On the CRM's platform-domain host the tenant MUST be resolved from the body:
 * VITE_CRM_TENANT_ID / VITE_CRM_ORG_ID carry the resolution parameters (the
 * server fails closed without one of them on a platform domain).
 */
export async function login(email, password) {
  const body = { email, password }
  if (import.meta.env.VITE_CRM_TENANT_ID) body.tenantId = import.meta.env.VITE_CRM_TENANT_ID
  if (import.meta.env.VITE_CRM_ORG_ID) body.organizationId = import.meta.env.VITE_CRM_ORG_ID
  const data = await api('/api/portal_api/portal/token', { method: 'POST', body, auth: false })
  setToken(data.token)
  return data
}

/* ==========================================================================
   Mappers — API payload → the portal's demo shapes (the ONLY place the two
   vocabularies meet). Money is already in currency units on every portal_api
   read; the dates are trimmed to what the screens render.
   ========================================================================== */

const pad = (n) => String(n).padStart(2, '0')
const hhmm = (d) => (d ? `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : '—')
const dayOf = (iso) => (iso ? String(iso).slice(0, 10) : '')
const timeOf = (iso) => (iso ? hhmm(new Date(iso)) : '—')
const shortDay = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d) ? '—' : `${d.toLocaleString('en-US', { month: 'short' })} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

/** GET /accounts item — already in the portal's account-card shape. */
export function mapAccount(item) {
  return {
    ...item,
    id: item.id,
    number: item.number || item.id?.slice(0, 8) || '—',
    spark: Array.isArray(item.spark) ? item.spark : [],
  }
}

/** One API trade row → the portal's demo trade-log row. */
export function mapTrade(t) {
  const side = String(t.side || '').toLowerCase() === 'buy' ? 'Buy' : 'Sell'
  const profit = Number(t.profit ?? 0)
  const heldMin = t.openTime && t.closeTime
    ? Math.max(0, Math.round((new Date(t.closeTime) - new Date(t.openTime)) / 60000))
    : 0
  return {
    id: t.ticket || t.id,
    ticket: t.ticket || '',
    account: '',
    date: dayOf(t.openTime),
    openedAt: timeOf(t.openTime),
    closedAt: t.closeTime ? timeOf(t.closeTime) : '—',
    symbol: t.symbol,
    side,
    lots: Number(t.volume ?? 0),
    entry: Number(t.openPrice ?? 0),
    exit: t.closePrice != null ? Number(t.closePrice) : Number(t.openPrice ?? 0),
    /* The API's profit is the settled net — the demo's `pnl`. */
    profit,
    commission: 0,
    ticketSize: 0,
    holdMin: heldMin,
    pnl: profit,
    r: 0,
    tag: '—',
    excluded: !!t.excluded,
  }
}

/** GET /accounts/[id] → the detail bundle the account page reads. */
export function mapAccountDetail(data) {
  return {
    account: mapAccount(data.account),
    trades: (data.trades?.items || []).map(mapTrade),
    tradesTotal: data.trades?.total ?? 0,
    page: data.trades?.page ?? 1,
    pageSize: data.trades?.pageSize ?? 20,
    rulesSummary: Array.isArray(data.rulesSummary) ? data.rulesSummary : [],
    violations: (data.violations || []).map((v) => ({
      rule: v.rule,
      action: v.action,
      ticket: v.ticket,
      detail: v.detail,
      at: v.at,
    })),
    excludedTrades: !!data.excludedTrades,
    validationStatus: data.validationStatus || data.account?.status || '',
    rules: data.rules || null,
    equitySeries: (data.equitySeries || []).map((p) => ({
      d: dayOf(p.at) ? shortDay(p.at) : '',
      at: p.at,
      balance: Number(p.balance ?? 0),
      v: Number(p.equity ?? 0),
    })),
    phaseHistory: data.phaseHistory || [],
  }
}

/** GET /me → the demo USER shape. */
export function mapProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    handle: (profile.email || '').split('@')[0] || 'trader',
    email: profile.email,
    initials: profile.initials || '',
    plan: 'CK Fam',
    joined: profile.joined || '',
    country: profile.country || '',
    kyc: profile.kycStatus || 'none',
    affiliateCode: profile.affiliateCode || null,
  }
}

/** GET /payouts item → the demo PAYOUTS row. */
export function mapPayout(p) {
  return {
    id: p.id,
    accountId: p.accountId,
    kind: p.kind,
    amount: Number(p.amount ?? 0),
    currency: p.currency || 'USD',
    /* The ledger stores the rail slug; the history prints it in full. */
    method: PAYOUT_METHOD_LABELS[p.method] || p.method,
    requested: p.requested ? shortDay(p.requested) : '—',
    settled: p.paidAt ? shortDay(p.paidAt) : '—',
    status: p.status,
    split: p.splitPct != null ? Number.parseFloat(p.splitPct) || 0 : 0,
    dueBy: p.dueBy,
    rejectReason: p.rejectReason,
  }
}

const PAYOUT_METHOD_LABELS = {
  paypal: 'PayPal',
  usdt_trc20: 'USDT (TRC-20)',
  usdt_erc20: 'USDT (ERC-20)',
  bank_wire: 'Bank transfer',
}

/** GET /certificates item → the demo CERTIFICATES row (+ the download URL). */
export function mapCertificate(c) {
  return {
    id: c.id,
    code: c.number || c.id,
    kind: c.kind,
    accountId: c.accountId,
    account: c.number || 'Trading account',
    title: CERTIFICATE_TITLES[c.kind] || 'Trading certificate',
    total: Number(c.amount ?? 0),
    issues: c.kind ? String(c.kind).replace(/_/g, ' ') : '',
    issued: c.issuedAt ? shortDay(c.issuedAt) : '—',
    downloadUrl: c.downloadUrl || null,
  }
}

const CERTIFICATE_TITLES = {
  evaluation_pass: 'Evaluation certificate',
  phase_pass: 'Verification certificate',
  funded: 'Funded account certificate',
  payout: 'Payout certificate',
}

/** GET /leaderboard item → the demo LEADERBOARD row. */
export function mapLeaderboardRow(r) {
  return {
    rank: r.rank,
    handle: r.trader,
    trader: r.trader,
    accountId: r.accountId,
    country: '',
    account: '',
    roi: Number(r.roi ?? r.value ?? 0),
    profit: null,
    streak: null,
    /* The API only lists funded/active accounts, all verified by construction. */
    verified: true,
    status: r.status,
    isUser: false,
  }
}

/** GET /affiliate → the demo affiliate summary + commission rows. */
export function mapAffiliate(data) {
  if (!data || !data.enrolled || !data.summary) {
    return { enrolled: false, summary: null, commissions: [] }
  }
  return {
    enrolled: true,
    summary: {
      affiliateId: data.summary.affiliateId,
      code: data.summary.code,
      commissionPct: data.summary.commissionPct,
      status: data.summary.status,
      referralsCount: data.summary.referralsCount,
      pending: Number(data.summary.pending ?? 0),
      approved: Number(data.summary.approved ?? 0),
      paid: Number(data.summary.paid ?? 0),
      currency: data.summary.currency || 'USD',
    },
    commissions: (data.commissions || []).map((c) => ({
      id: c.id,
      orderTotal: Number(c.orderTotal ?? 0),
      commission: Number(c.commission ?? 0),
      currency: c.currency || 'USD',
      status: c.status,
      createdAt: c.createdAt,
      createdLabel: c.createdAt ? shortDay(c.createdAt) : '—',
    })),
  }
}

/** GET /programs item — passthrough with the fields the checkout modal reads. */
export function mapProgram(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    model: p.model,
    tagline: p.tagline,
    highlight: p.highlight,
    features: Array.isArray(p.features) ? p.features : [],
    platforms: p.platforms?.length ? p.platforms : [p.platform].filter(Boolean),
    leverage: p.leverage,
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      accountSize: Number(v.accountSize ?? 0),
      listPrice: Number(v.listPrice ?? 0),
      salePrice: v.salePrice != null ? Number(v.salePrice) : null,
      currency: v.currency || 'USD',
    })),
    addons: (p.addons || []).map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      priceType: a.priceType,
      priceValue: Number(a.priceValue ?? 0),
      exclusiveGroup: a.exclusiveGroup || null,
    })),
    phases: p.phases || [],
  }
}

/** GET /tournaments item — passthrough, money already in units. */
export function mapTournament(t) {
  return { ...t, id: String(t.id), joined: !!t.joined }
}

const PLATFORM_LABELS = { mt5: 'MetaTrader 5', tradelocker: 'TradeLocker', mock: 'Mock' }
export const platformName = (p) => PLATFORM_LABELS[p] || p || '—'

/* ==========================================================================
   Endpoints
   ========================================================================== */

const P = '/api/portal_api/portal'

export const fetchMe = () => api(`${P}/me`).then((d) => mapProfile(d.profile))

export const fetchAccounts = () =>
  api(`${P}/accounts`).then((d) => (d.items || []).map(mapAccount))

export const fetchAccount = (id) => api(`${P}/accounts/${id}`).then(mapAccountDetail)

export const fetchCredentials = (id) =>
  api(`${P}/accounts/${id}/credentials`).then((d) => d.credentials)

export const fetchPayouts = (page = 1, pageSize = 50) =>
  api(`${P}/payouts?page=${page}&pageSize=${pageSize}`)
    .then((d) => (d.items || []).map(mapPayout))

/**
 * POST /payouts — eligibility rejections come back 422 with the server's
 * localized message AND a stable `code`; both travel on the thrown ApiError.
 */
export const requestPayout = ({ tradingAccountId, method, destination }) =>
  api(`${P}/payouts`, { method: 'POST', body: { tradingAccountId, method, destination } })

export const fetchKyc = () => api(`${P}/kyc`)

/** Multipart upload — the browser sets the form boundary; no Content-Type here. */
export const uploadKyc = (file, docType) => {
  const form = new FormData()
  form.append('file', file)
  form.append('docType', docType)
  return api(`${P}/kyc`, { method: 'POST', form })
}

export const fetchAffiliate = () => api(`${P}/affiliate`).then(mapAffiliate)

export const becomeAffiliate = () =>
  api(`${P}/affiliate`, { method: 'POST', body: {} }).then((d) => d.affiliate)

export const fetchCertificates = (page = 1, pageSize = 50) =>
  api(`${P}/certificates?page=${page}&pageSize=${pageSize}`)
    .then((d) => (d.items || []).map(mapCertificate))

export const fetchLeaderboard = () =>
  api(`${P}/leaderboard`).then((d) => (d.items || []).map(mapLeaderboardRow))

export const fetchPrograms = () =>
  api(`${P}/programs`).then((d) => (d.items || []).map(mapProgram))

/** POST /checkout/quote — no side effects; a coupon rejection stays in the quote. */
export const quoteCheckout = ({ variantId, addonIds = [], couponCode, platform }) =>
  api(`${P}/checkout/quote`, {
    method: 'POST',
    body: { variantId, addonIds, ...(couponCode ? { couponCode } : {}), ...(platform ? { platform } : {}) },
  }).then((d) => d.quote)

/** POST /checkout — creates the order + payment session; 201 → redirect. */
export const startCheckout = ({ variantId, addonIds = [], couponCode, platform, gateway, referralCode }) =>
  api(`${P}/checkout`, {
    method: 'POST',
    body: {
      variantId,
      addonIds,
      ...(couponCode ? { couponCode } : {}),
      ...(platform ? { platform } : {}),
      gateway,
      ...(referralCode ? { referralCode } : {}),
    },
  })

export const fetchTournaments = () =>
  api(`${P}/tournaments`).then((d) => (d.items || []).map(mapTournament))

export const joinTournament = (id) => api(`${P}/tournaments/${id}/join`, { method: 'POST', body: {} })

/* Legal documents live under the prop_platform module's portal routes. */
export const fetchLegalPending = () =>
  api('/api/prop_platform/portal/legal/pending').then((d) => d.items || [])

export const acceptLegal = (documentId) =>
  api('/api/prop_platform/portal/legal/accept', { method: 'POST', body: { document_id: documentId } })
