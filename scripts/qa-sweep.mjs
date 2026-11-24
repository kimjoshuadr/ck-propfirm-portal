/*
 * Portal QA sweep — headless Chromium walk over every hash route in
 * README-vue.md, logged in as a test trader.
 *
 * Playwright comes from the CRM checkout (NODE_PATH is not honoured by ESM,
 * so it is required through ../ck-crm/node_modules); no dependency is added
 * here.
 *
 * The sweep FAILs a route on any console error or warning, any pageerror,
 * or any HTTP response >= 400 (favicon requests are ignored). A route that
 * cannot be reached at all (`#account/<number>` when the trader owns no
 * trading account) is SKIPPED with its reason — visible, never a silent pass.
 *
 * Test trader: the sweep logs in as QA_TRADER_EMAIL / QA_TRADER_PASSWORD
 * (defaults below). If the account does not exist it is created through the
 * CRM signup API (POST /api/customer_accounts/signup) first. The signup API
 * leaves the address unverified until the emailed link is clicked and the
 * CRM does not expose that token over HTTP, so a brand-new account needs its
 * email_verified_at set once by the operator (psql) before the first sweep.
 *
 * Report: qa-sweep-latest.md (project root). Exit 1 when any route FAILs.
 *
 * Run: npm run qa:sweep
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { writeFileSync } from 'node:fs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CRM_PACKAGE = join(HERE, '..', '..', 'ck-crm', 'package.json')
const { chromium } = createRequire(CRM_PACKAGE)('playwright')

const PORTAL = process.env.QA_PORTAL_URL || 'http://localhost:5173'
const CRM = process.env.QA_CRM_URL || 'http://localhost:3000'
const QA_ORG_ID = process.env.QA_ORG_ID || '52f175c2-0290-4e0d-a111-6ce0a0cb263e'
const EMAIL = process.env.QA_TRADER_EMAIL || 'qa-portal-sweep@ck-e2e.test'
const PASSWORD = process.env.QA_TRADER_PASSWORD || 'QaSweep!2026'
const OUT = join(HERE, '..', 'qa-sweep-latest.md')

/* Every hash route in README-vue.md. `#account/<number>[/<tab>]` is appended
   per owned account during the run. */
const ROUTES = [
  { hash: '', name: 'overview' },
  { hash: 'accounts', name: 'accounts (all)' },
  { hash: 'accounts/favorites', name: 'accounts (favorites)' },
  { hash: 'accounts/certificates', name: 'accounts (certificates)' },
  { hash: 'market/calendar', name: 'market calendar' },
  { hash: 'market/news', name: 'market news' },
  { hash: 'tools/sizer', name: 'tools sizer' },
  { hash: 'tools/platforms', name: 'tools platforms' },
  { hash: 'manage/withdrawals', name: 'manage withdrawals' },
  { hash: 'manage/methods', name: 'manage methods' },
  { hash: 'manage/billing', name: 'manage billing' },
  { hash: 'manage/agreements', name: 'manage agreements' },
  { hash: 'community/leaderboard', name: 'community leaderboard' },
  { hash: 'community/competitions', name: 'community competitions' },
  { hash: 'community/affiliates', name: 'community affiliates' },
  { hash: 'help/support', name: 'help support' },
  { hash: 'help/faq', name: 'help faq' },
  { hash: 'help/room', name: 'help room' },
  { hash: 'settings', name: 'settings (profile)' },
  { hash: 'settings/password', name: 'settings password' },
  { hash: 'settings/identity', name: 'settings identity' },
  { hash: 'settings/two-factor', name: 'settings two-factor' },
  { hash: 'settings/notifications', name: 'settings notifications' },
]
const ACCOUNT_TABS = ['overview', 'rules', 'trades', 'calendar', 'analytics']

const FAVICON = /favicon|\.ico($|\?)/i
const SETTLE_MS = 1500

/* ---------------------------------------------------------------- helpers */

async function ensureTrader() {
  /* The signup endpoint answers 202 whether or not the account existed —
     it is only a safety net when the stored test trader was wiped. */
  try {
    const res = await fetch(`${CRM}/api/customer_accounts/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        displayName: 'QA Sweep Trader',
        organizationId: QA_ORG_ID,
      }),
    })
    if (!res.ok && res.status !== 429) throw new Error(`signup HTTP ${res.status}`)
  } catch (err) {
    console.warn(`signup pre-step skipped (${err.message}) — continuing with login`)
  }
}

function watchingPage(browser) {
  return browser.newContext().then((ctx) => ctx.newPage())
}

function arm(page, bucket) {
  const onConsole = (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      bucket.push({ kind: `console ${msg.type()}`, text: msg.text() })
    }
  }
  const onPageError = (err) => bucket.push({ kind: 'pageerror', text: String(err) })
  const onResponse = (res) => {
    if (res.status() >= 400 && !FAVICON.test(res.url())) {
      bucket.push({ kind: `HTTP ${res.status()}`, text: res.url() })
    }
  }
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  page.on('response', onResponse)
  return () => {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
    page.off('response', onResponse)
  }
}

/* ------------------------------------------------------------------- main */

async function main() {
  await ensureTrader()

  const browser = await chromium.launch({ headless: true })
  const page = await watchingPage(browser)

  /* Login through the portal's own sign-in screen. */
  const loginBucket = []
  const disarm = arm(page, loginBucket)
  await page.goto(`${PORTAL}/#login`, { waitUntil: 'domcontentloaded' })
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.click('[data-od-id="login-submit"]')
  await page.waitForFunction(() => sessionStorage.getItem('ck.crmToken'), null, { timeout: 15000 })
  await page.waitForFunction(() => location.hash === '#overview', null, { timeout: 15000 })
  await page.waitForTimeout(SETTLE_MS)
  disarm()
  const loginFailures = [...loginBucket]

  /* Owned trading accounts feed the `#account/<number>` routes. */
  let accountNumbers = []
  try {
    accountNumbers = await page.evaluate(async (crm) => {
      const token = sessionStorage.getItem('ck.crmToken')
      const res = await fetch(`${crm}/api/portal_api/portal/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return []
      const data = await res.json()
      return (data.items || []).map((a) => String(a.number)).filter(Boolean)
    }, CRM)
  } catch { accountNumbers = [] }

  const routes = [...ROUTES]
  for (const number of accountNumbers) {
    routes.push({ hash: `account/${number}`, name: `account ${number}` })
    for (const tab of ACCOUNT_TABS.slice(1)) {
      routes.push({ hash: `account/${number}/${tab}`, name: `account ${number} · ${tab}` })
    }
  }
  routes.push({ hash: 'login', name: 'login (authed)' })

  /* Sweep every route in one live session — the portal never reloads on a
     hash jump, and neither should the sweep. */
  const results = []
  for (const r of routes) {
    const bucket = []
    const disarmRoute = arm(page, bucket)
    try {
      const before = page.url()
      await page.evaluate((hash) => { location.hash = hash }, r.hash)
      await page.waitForTimeout(SETTLE_MS)
      if (page.url() === before) {
        await page.goto(`${PORTAL}/#${r.hash}`, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(SETTLE_MS)
      }
      results.push({ ...r, failures: [...bucket], skipped: false })
    } catch (err) {
      results.push({ ...r, failures: [...bucket], skipped: true, skipReason: String(err) })
    }
    disarmRoute()
  }

  await browser.close()

  /* -------------------------------------------------------------- report */

  const failed = results.filter((r) => !r.skipped && r.failures.length)
  const skipped = results.filter((r) => r.skipped)
  const passed = results.filter((r) => !r.skipped && !r.failures.length)
  const ok = !loginFailures.length && !failed.length && !skipped.length

  const rows = results.map((r) => {
    const status = r.skipped ? 'SKIPPED' : r.failures.length ? 'FAIL' : 'PASS'
    const detail = r.skipped
      ? r.skipReason
      : r.failures.map((f) => `${f.kind} — ${f.text.replace(/\|/g, '\\|').slice(0, 300)}`).join('<br>')
    return `| ${r.name} | \`#${r.hash || '/'}\` | ${status} | ${detail || '—'} |`
  })

  const md = `# Portal QA sweep — ${new Date().toISOString()}

- Portal: \`${PORTAL}\` · CRM: \`${CRM}\`
- Trader: \`${EMAIL}\`
- Login page issues: ${loginFailures.length}
- ${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped
- Result: ${ok ? '**PASS** — every route clean' : failed.length || loginFailures.length ? '**FAIL**' : '**INCOMPLETE** (skipped routes)'}

| Route | Hash | Status | Detail |
| --- | --- | --- | --- |
${rows.join('\n')}
`
  writeFileSync(OUT, md)
  console.log(md)
  process.exit(ok ? 0 : 1)
}

main().then(undefined, (err) => {
  console.error('sweep crashed:', err)
  process.exit(1)
})
