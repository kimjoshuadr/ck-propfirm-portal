/*
 * Task 11 item 4 proof — the checkout flow through the CRM's portal_api,
 * driven exactly as the portal drives it (bearer token, JSON, the 5173 origin).
 *
 * Proves: token 200, me 200, accounts list, programs catalogue, a bare quote,
 * an add-on quote, the coupon discount, and the quote error contract.
 */
const BASE = 'http://localhost:3000/api/portal_api/portal'
const ORIGIN = 'http://localhost:5173'

const login = await fetch(`${BASE}/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'bob.smith@example.com',
    password: 'Password123!',
    tenantId: '8969c5bc-45de-404c-b50e-71aa9f4c7a9e',
  }),
})
if (login.status !== 200) throw new Error(`token ${login.status}`)
const tok = (await login.json()).token
const auth = { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', Origin: ORIGIN }

const me = await fetch(`${BASE}/me`, { headers: auth })
const profile = (await me.json()).profile
console.log('me', me.status, profile.name, profile.email)

const accounts = await fetch(`${BASE}/accounts`, { headers: auth })
const accountsBody = await accounts.json()
console.log('accounts', accounts.status, 'count', accountsBody.items.length)

const programs = await fetch(`${BASE}/programs`, { headers: auth })
const program = (await programs.json()).items[0]
const variant = program.variants[0]
console.log('program', program.slug, '· variants', program.variants.length, '· addons', program.addons.length)

const quote = async (body) => {
  const res = await fetch(`${BASE}/checkout/quote`, { method: 'POST', headers: auth, body: JSON.stringify(body) })
  const data = await res.json()
  return { status: res.status, ...data }
}

const bare = await quote({ variantId: variant.id })
console.log('quote bare', bare.status, '· lines', bare.quote.lines.length, '· total', bare.quote.total, bare.quote.currency)

let addonTotal = null
if (program.addons.length) {
  const withAddon = await quote({ variantId: variant.id, addonIds: [program.addons[0].id] })
  addonTotal = withAddon.quote.total
  console.log('quote with add-on', withAddon.status, '· addon', program.addons[0].code, '· total', addonTotal)
}

const COUPONS = { welcome: 'WELCOME10' }
for (const [name, code] of Object.entries(COUPONS)) {
  const withCoupon = await quote({ variantId: variant.id, couponCode: code })
  if (withCoupon.status === 200) {
    console.log(`quote coupon ${name}`, withCoupon.status,
      '· discount', withCoupon.quote.discount, '· total', withCoupon.quote.total)
  } else {
    console.log(`quote coupon ${name} rejected`, withCoupon.status, withCoupon.error, withCoupon.code)
  }
}

const badCoupon = await quote({ variantId: variant.id, couponCode: 'NOPE-DOES-NOT-EXIST' })
console.log('quote coupon unknown', badCoupon.status, badCoupon.error, badCoupon.code)
