import { computed, reactive } from 'vue'
import { ACCOUNTS, NOTIFICATIONS, pendingPayoutCount } from '../data/portal.js'
import { route } from './router.js'
import { pushToast } from './ui.js'

/* The store is the public surface for the shell, so account data is
   re-exported alongside the state that manages it. */
export { ACCOUNTS }

/* --------------------------------------------------------------- storage */

export const LS = {
  get(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem(key, value) } catch { /* ignore */ }
  },
}

/* --------------------------------------------------------- notifications */

const notifKey = (n) => n.id || n.title

const readIds = (storeKey) => {
  try {
    const raw = JSON.parse(LS.get(storeKey, '[]'))
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}

export const notifState = reactive({
  read: readIds('ck.notifRead'),
  dismissed: readIds('ck.notifDismissed'),
})

export const isNotifRead = (n) => notifState.read.includes(notifKey(n))

/* Dismissed alerts leave both the drawer and the Overview feed, so the bell
   count and the page always agree. */
export const visibleNotifications = computed(() =>
  NOTIFICATIONS.filter((n) => !notifState.dismissed.includes(notifKey(n))))

export const unreadCount = computed(() =>
  visibleNotifications.value.filter((n) => !isNotifRead(n)).length)

export function markAllNotifRead() {
  notifState.read = visibleNotifications.value.map(notifKey)
  LS.set('ck.notifRead', JSON.stringify(notifState.read))
  pushToast({ tone: 'info', title: 'Notifications cleared', msg: 'All notifications marked as read.' })
}

export function dismissNotification(n) {
  const key = notifKey(n)
  if (notifState.dismissed.includes(key)) return
  notifState.dismissed = [...notifState.dismissed, key]
  LS.set('ck.notifDismissed', JSON.stringify(notifState.dismissed))
  pushToast({ tone: 'info', title: 'Alert dismissed', msg: n.title })
}

/* ------------------------------------------------------------------- nav */

export const NAV = [
  {
    label: 'Main',
    items: [
      { key: 'dashboard', label: 'Overview', href: '#overview', icon: 'overview' },
      {
        key: 'accounts', label: 'Accounts', icon: 'accounts',
        children: [
          { key: 'accounts-all', label: 'All accounts', href: '#accounts', page: 'accounts', tab: 'all', owns: true },
          { key: 'accounts-favorites', label: 'Favorites', href: '#accounts/favorites', page: 'accounts', tab: 'favorites' },
          { key: 'accounts-certificates', label: 'Certificates', href: '#accounts/certificates', page: 'accounts', tab: 'certificates' },
        ],
      },
      {
        key: 'market', label: 'Market', icon: 'market',
        children: [
          { key: 'market-calendar', label: 'Calendar', href: '#market/calendar', page: 'market', tabs: ['calendar'], owns: true },
          { key: 'market-news', label: 'News', href: '#market/news', page: 'market', tab: 'news' },
        ],
      },
      {
        key: 'tools', label: 'Tools', icon: 'wrench',
        children: [
          { key: 'tools-sizer', label: 'Sizer', href: '#tools/sizer', page: 'sizer', tab: '', owns: true },
          { key: 'tools-platforms', label: 'Platforms', href: '#tools/platforms', page: 'platforms', tab: '', owns: true },
        ],
      },
    ],
  },
  {
    label: 'Learning',
    items: [
      /* Was Learn › CK Room, a community room with nothing to learn in it.
         FPT Learn is the course platform, so the row points at the page. */
      { key: 'learn', label: 'FPT Learn', href: '#learn', page: 'learn', tab: '', icon: 'book', owns: true },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        key: 'manage', label: 'Manage', icon: 'wallet',
        children: [
          { key: 'manage-billing', label: 'Billing', href: '#manage/billing', page: 'payouts', tab: 'billing' },
          { key: 'manage-withdrawals', label: 'Withdrawals', href: '#manage/withdrawals', page: 'payouts', tabs: ['withdrawals', 'payouts', 'methods'], owns: true, badge: pendingPayoutCount },
          { key: 'manage-agreements', label: 'Agreements', href: '#manage/agreements', page: 'agreements', tab: '', owns: true },
        ],
      },
      {
        key: 'community', label: 'Community', icon: 'users',
        children: [
          { key: 'community-leaderboard', label: 'Leaderboard', href: '#community/leaderboard', page: 'leaderboard', tab: '', owns: true },
          { key: 'community-affiliates', label: 'Affiliates', href: '#community/affiliates', page: 'affiliates', tab: '', owns: true },
        ],
      },
      { key: 'settings', label: 'Settings', href: '#settings', icon: 'settings' },
      {
        key: 'help', label: 'Help', icon: 'help',
        children: [
          { key: 'help-support', label: 'Support', href: '#help/support', page: 'help', tab: 'support', owns: true },
          { key: 'help-faq', label: 'FAQ', href: '#help/faq', page: 'help', tab: 'faq' },
        ],
      },
    ],
  },
]

export const PROMO = {
  title: 'Trade with the best, for less',
  sub: 'Limited-time: 70% off your next evaluation. Code',
  code: '10KFOR19',
  cta: 'Get 70% off right now',
}

/*
 * Every screen in the portal. All of them are Vue components now — the sidebar
 * resolves each row to a hash route, so there is no HTML page to navigate out
 * to and the sidebar highlight survives the jump.
 */
export const PAGES = {
  dashboard: { title: 'Overview', root: 'Main' },
  accounts: { title: 'Accounts', root: 'Main' },
  market: { title: 'Market', root: 'Main' },
  sizer: { title: 'Position sizer', root: 'Main' },
  platforms: { title: 'Platforms', root: 'Main' },
  payouts: { title: 'Payouts', root: 'Account' },
  leaderboard: { title: 'Leaderboard', root: 'Account' },
  agreements: { title: 'Agreements', root: 'Account' },
  affiliates: { title: 'Affiliates', root: 'Account' },
  settings: { title: 'Settings', root: 'Account' },
  learn: { title: 'FPT Learn', root: 'Learning' },
  help: { title: 'Help & support', root: 'Account' },
}

/* Which screen the shell is rendering, so the nav highlights the right row.
   Both are computed: a hash change re-resolves the nav without a reload. */
const PAGE_BY_ROUTE = {
  overview: 'dashboard',
  accounts: 'accounts',
  account: 'accounts',
  market: 'market',
  sizer: 'sizer',
  platforms: 'platforms',
  payouts: 'payouts',
  agreements: 'agreements',
  leaderboard: 'leaderboard',
  affiliates: 'affiliates',
  learn: 'learn',
  help: 'help',
  settings: 'settings',
}
export const PAGE_KEY = computed(() => PAGE_BY_ROUTE[route.page] || 'dashboard')
/* The accounts screen's tab doubles as the nav's current sub-item. */
export const PAGE_TAB = computed(() => (route.page === 'account' ? 'all' : route.tab || ''))

const childMatches = (child, pageKey, tab) => {
  if (child.page !== pageKey) return false
  const tabs = child.tabs || [child.tab || '']
  return tabs.includes(tab)
}

export function resolveNav(pageKey = PAGE_KEY.value, tab = PAGE_TAB.value) {
  const activeKeys = new Set()
  let owner = null
  let firstMatch = null
  let direct = null

  NAV.forEach((group) => group.items.forEach((item) => {
    if (!item.children) return
    item.children.forEach((child) => {
      if (!childMatches(child, pageKey, tab)) return
      if (!firstMatch) firstMatch = { key: child.key, owner: item.key }
      if (child.owns && !owner) owner = { key: child.key, owner: item.key }
    })
  }))

  NAV.forEach((group) => group.items.forEach((item) => {
    if (!item.children && item.key === pageKey) direct = item.key
  }))

  const hit = owner || firstMatch
  if (hit) activeKeys.add(hit.key)
  if (direct) activeKeys.add(direct)
  return { activeKeys, openKey: hit ? hit.owner : null }
}

const navMatch = computed(() => resolveNav(PAGE_KEY.value, PAGE_TAB.value))
export const activeKeys = computed(() => navMatch.value.activeKeys)
export const autoOpenKey = computed(() => navMatch.value.openKey)

function readNavOpen() {
  try {
    const raw = JSON.parse(LS.get('ck.navOpen', 'null'))
    return Array.isArray(raw) ? raw : null
  } catch { return null }
}

/* ---------------------------------------------------------------- shell */

export const shell = reactive({
  collapsed: LS.get('ck.sidebar', '0') === '1',
  drawer: false,
  navOpen: readNavOpen(),
  /* The challenge picker is shell-level: the sidebar, the hero band and the
     offer cards all open the same dialog. */
  challenge: false,
  /* Notifications likewise — the bell owns the drawer, and the Overview's
     "Open all" link opens the same one. */
  notifDrawer: false,
})

export const openChallenge = () => { shell.challenge = true }
export const closeChallenge = () => { shell.challenge = false }
export const openNotifications = () => { shell.notifDrawer = true }
export const closeNotifications = () => { shell.notifDrawer = false }

export const openKeys = computed(() => {
  const base = Array.isArray(shell.navOpen) ? shell.navOpen : (autoOpenKey.value ? [autoOpenKey.value] : ['accounts'])
  const set = new Set(base)
  if (autoOpenKey.value) set.add(autoOpenKey.value)
  return set
})

export function toggleGroup(key) {
  const set = new Set(openKeys.value)
  if (set.has(key)) set.delete(key)
  else set.add(key)
  shell.navOpen = [...set]
  LS.set('ck.navOpen', JSON.stringify(shell.navOpen))
}

export function toggleSidebar() {
  if (typeof window !== 'undefined' && window.innerWidth <= 900) {
    shell.drawer = !shell.drawer
    return
  }
  shell.collapsed = !shell.collapsed
  LS.set('ck.sidebar', shell.collapsed ? '1' : '0')
}

export function closeDrawer() {
  shell.drawer = false
}

/* --------------------------------------------------------------- region */

/* The globe in the top bar switches the portal's region/language preset.
   Prototype scope: the choice persists and is announced, nothing localises. */
export const REGIONS = [
  { code: 'global', label: 'Global', note: 'English (international)' },
  { code: 'ph', label: 'Philippines', note: 'English (PH) · GMT+8' },
  { code: 'uk', label: 'United Kingdom', note: 'English (UK) · GMT' },
  { code: 'eu', label: 'European Union', note: 'English (EU) · GMT+1' },
  { code: 'us', label: 'United States', note: 'English (US) · GMT-5' },
  { code: 'apac', label: 'Asia-Pacific', note: 'English (APAC) · GMT+7' },
]

export const region = reactive({
  code: LS.get('ck.region', REGIONS[0].code),
})

export const activeRegion = computed(() =>
  REGIONS.find((r) => r.code === region.code) || REGIONS[0])

export function setRegion(code) {
  const hit = REGIONS.find((r) => r.code === code)
  if (!hit) return
  region.code = hit.code
  LS.set('ck.region', hit.code)
  pushToast({ tone: 'info', title: 'Region updated', msg: `${hit.label} · ${hit.note}` })
}

/* -------------------------------------------------------------- account */

export const account = reactive({
  activeId: LS.get('ck.activeAccount', ACCOUNTS[0].id),
})

export const activeAccount = computed(() =>
  ACCOUNTS.find((a) => a.id === account.activeId) || ACCOUNTS[0])

export function setActiveAccount(id) {
  account.activeId = id
  LS.set('ck.activeAccount', id)
  pushToast({ tone: 'info', title: 'Active account switched', msg: `${id} is now streaming on the dashboard.` })
}

/* ------------------------------------------------------------ favourites */

const readFavoriteIds = () => {
  try {
    const raw = JSON.parse(LS.get('ck.favorites', '[]'))
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}

/* Same key the accounts screen uses, so a star set here shows up there. */
export const favoriteState = reactive({ ids: readFavoriteIds() })

export const isFavorite = (id) => favoriteState.ids.includes(id)

export function toggleFavorite({ id, label }) {
  const on = !isFavorite(id)
  favoriteState.ids = on
    ? [...favoriteState.ids, id]
    : favoriteState.ids.filter((x) => x !== id)
  LS.set('ck.favorites', JSON.stringify(favoriteState.ids))
  pushToast({
    tone: on ? 'good' : 'info',
    title: on ? 'Added to favorites' : 'Removed from favorites',
    msg: on ? `${label} is pinned under Favorites.` : `${label} left your favorites.`,
  })
}

/* ------------------------------------------------------------ clipboard */

export function copyText(text, label = 'Copied') {
  try { navigator.clipboard?.writeText(text) } catch { /* ignore */ }
  pushToast({ tone: 'good', title: label, msg: text })
}
