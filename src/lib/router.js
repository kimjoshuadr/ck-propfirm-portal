import { reactive } from 'vue'

/*
 * Hash routes, no dependency.
 *
 * Links are hash-only (`#accounts`, `#account/412907/trades`, `#help/faq`), so
 * navigation happens inside the document: it works wherever the app is served
 * from — dev server, built dist/, a nested preview path — and never reloads the
 * page. The hash is read once at boot and again on every hashchange, so the
 * sidebar highlight follows an in-app jump without a full page load. Swap this
 * for vue-router when the app outgrows one hash switch.
 *
 * Every screen in the portal is in this table: there are no HTML pages left to
 * navigate out to, so a sidebar row and a palette entry are the same kind of
 * link as an account card.
 */

export const ROUTES = {
  login: { page: 'login' },
  overview: { page: 'overview' },
  'market/calendar': { page: 'market', tab: 'calendar' },
  'market/news': { page: 'market', tab: 'news' },
  accounts: { page: 'accounts', tab: 'all' },
  'accounts/favorites': { page: 'accounts', tab: 'favorites' },
  'accounts/certificates': { page: 'accounts', tab: 'certificates' },
  learn: { page: 'learn' },
  'tools/sizer': { page: 'sizer' },
  'tools/platforms': { page: 'platforms' },
  'manage/billing': { page: 'payouts', tab: 'billing' },
  'manage/withdrawals': { page: 'payouts', tab: 'withdrawals' },
  'manage/methods': { page: 'payouts', tab: 'methods' },
  'manage/agreements': { page: 'agreements' },
  'community/leaderboard': { page: 'leaderboard', tab: 'leaderboard' },
  /* The competitions view is gone; an old link opens the leaderboard. */
  'community/competitions': { page: 'leaderboard', tab: 'leaderboard' },
  'community/affiliates': { page: 'affiliates' },
  'help/support': { page: 'help', tab: 'support' },
  'help/faq': { page: 'help', tab: 'faq' },
  /* The room page is gone; an old link to it opens its replacement. */
  'help/room': { page: 'learn' },
  settings: { page: 'settings' },
  /* The affiliates screen predates the nested hash and is linked from elsewhere. */
  affiliates: { page: 'affiliates' },
}

/* #account/<number> and #account/<number>/<tab> */
/* Section keys, in page order. `score` was removed with the Score section —
   an old `#account/<n>/score` link now falls back to Overview. */
export const ACCOUNT_TABS = ['overview', 'rules', 'trades', 'calendar', 'analytics']
const ACCOUNT = /^account\/(\d{3,8})(?:\/([a-z]+))?$/
/* `#settings/<tab>` never matched anything: the settings screen writes those
   hashes with `history.replaceState`, so they only surfaced when someone opened
   or reloaded one — and the fallback dropped them on the Overview. */
const SETTINGS = /^settings(?:\/([a-z-]+))?$/
export const SETTINGS_TABS = ['profile', 'password', 'identity', 'two-factor', 'notifications']

export const accountHref = (number, tab) =>
  `#account/${number}${tab && tab !== 'overview' ? `/${tab}` : ''}`

const readHash = () => {
  /* A screen may hang a view off its own hash (`#account/1/trades?view=open`),
     so the route is matched on the path half only. */
  const hash = (typeof location === 'undefined' ? '' : location.hash || '')
    .replace(/^#\/?/, '')
    .split('?')[0]
  const match = ACCOUNT.exec(hash)
  if (match) {
    const tab = ACCOUNT_TABS.includes(match[2]) ? match[2] : 'overview'
    return { page: 'account', number: match[1], tab }
  }
  const settings = SETTINGS.exec(hash)
  if (settings) {
    const tab = SETTINGS_TABS.includes(settings[1]) ? settings[1] : 'profile'
    return { page: 'settings', tab }
  }
  return ROUTES[hash] || ROUTES.overview
}

export const route = reactive({ page: 'overview', tab: '', number: '' })

function apply(entry) {
  route.page = entry.page
  route.tab = entry.tab || ''
  route.number = entry.number || ''
}

apply(readHash())

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => apply(readHash()))
}

export const isPage = (key) => route.page === key
