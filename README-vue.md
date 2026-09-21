# CK Propfirm portal — Vue 3 (primary app)

**Vue is the whole app.** `index.html` is the Vite entry and the only HTML file
in the project; every screen is a component behind a hash route
(see `src/lib/router.js`). There are no static pages to navigate out to — a
sidebar row, a palette entry and an account card are all the same kind of link.

Routes:

| Route | Screen |
| --- | --- |
| `/` | Overview |
| `/#accounts`, `/favorites`, `/certificates` | All accounts |
| `/#account/<number>[/<tab>]` | One account (`overview · rules · score · calendar · trades · analytics`) |
| `/#market/calendar`, `/#market/news` | Market |
| `/#tools/sizer`, `/#tools/platforms` | Tools |
| `/#manage/withdrawals`, `/methods`, `/billing`, `/#manage/agreements` | Manage |
| `/#community/leaderboard`, `/competitions`, `/#community/affiliates` | Community |
| `/#help/support`, `/faq`, `/room` | Help & support |
| `/#settings[/<tab>]`, `/#login` | Settings · sign-in (no shell) |

Vue owns the shell (sidebar, topbar, footer, toasts, modals, command palette) and
every screen under it. `assets/js/app.js` + `widgets.js` + `data.js` are the
vanilla shell the port replaced: nothing loads them any more, and they are kept
only as the reference implementation of the screens that were translated.

## Run

```bash
npm install
npm run dev        # opens http://localhost:5173/
```

Production build:

```bash
npm run build      # -> dist-vue/
npm run preview
```

Refresh the newsroom's wire copy (writes `src/data/newsroom.json` and downloads
each article's thumbnail into `assets/news/`):

```bash
npm run news                    # Google News · Business topic
npm run news -- --limit 30      # fewer stories
npm run news -- --html page.html
```

> The workspace root already held the static prototype's `assets/`, so the Vite
> root is the workspace root. Nothing is duplicated: the stylesheet, the
> self-hosted fonts and the brand images are shared through `assets/`.

## Layout

```
index.html                   Vite entry (mounts #app) — the only HTML file
vite.config.js               root = workspace, entry = index.html
src/
  main.js                    createApp, global CSS, v-click-outside
  App.vue                    shell: sidebar + topbar + page + footer + overlays
  styles/vue.css             small bridges only (icon wrapper, menu, transitions)
  styles/product.css         Vue-only styles for the ported product screens
  lib/
    icons.js                 icon path set + iconSvg()
    assets.js                brand asset URLs (Vite-resolved)
    portal.js                NAV data, resolveNav(), sidebar + account + region store
    format.js                longDate() session-date formatter
    ui.js                    toast store
  data/
    portal.js                user, accounts, payouts, notifications
    affiliates.js            referral funnel, tiers, referrals
  components/
    AppIcon.vue              renders an icon by name
    TheSidebar.vue           reference nav, Start New Challenge, Shortcuts, offer
    TheTopbar.vue            session date, search, region + avatar menus, notification drawer
    CommandPalette.vue       ⌘K jump-to
    ModalDialog.vue          dialog with scrim, Escape, backdrop close
    ToastStack.vue           transition-group toasts
    PromoCard.vue            reusable limited-offer card
    ReferralTable.vue        filter + sortable referrals
    TierTable.vue            commission tiers
  pages/
    OverviewPage.vue         Overview (root route)
    AccountsPage.vue         All accounts (#accounts)
    AccountDetailPage.vue    one account (#account/<number>[/<tab>])
    MarketPage.vue           Economic calendar + Newsroom (#market/*)
    SizerPage.vue            Position size calculator (#tools/sizer)
    PlatformsPage.vue        Platforms + symbol coverage (#tools/platforms)
    ManagePage.vue           Payouts, methods, billing (#manage/*)
    AgreementsPage.vue       Agreements + account holder (#manage/agreements)
    LeaderboardPage.vue      Standings + competitions (#community/*)
    AffiliatesPage.vue       Affiliates (#community/affiliates)
    HelpPage.vue             Support, FAQ, CK Room (#help/*)
    SettingsPage.vue         Profile, security, notifications, preferences
    LoginPage.vue            Sign-in — renders without the portal shell (#login)
  components/account/        the detail page's tabs and its banded chart
```

## Routing today

`src/lib/router.js` is a hash switch, not `vue-router`: it reads
`location.hash` at boot and on every `hashchange`, mapping `''`/`#overview` →
Overview, `#accounts` (plus `#accounts/favorites` and `#accounts/certificates`)
→ All accounts, `#affiliates` → Affiliates. **Links are hash-only on purpose** —
a path like `index.html#accounts` only resolves when the app is served from
that exact path, which broke the nav when the app ran from `dist-vue/` or a
nested preview URL. A hash jump swaps the page in place: no reload, and
`PAGE_KEY` / `activeKeys` are computeds so the sidebar highlight follows.
`App.vue` renders the matching page from one `v-if`/`v-else-if` chain, and every
nav entry points at a hash. `#login` is the exception in presentation only: it
mounts the same app but skips the shell, so signing out is still an in-app jump.
Adding `vue-router` is the next step if the app outgrows one hash switch.

## What the Vue port changed

- Vanilla DOM building is gone: the sidebar, topbar, footer, nav accordion and
  page are declarative components with reactive state.
- `initTables` sorting/filtering became computed state inside `ReferralTable`.
- Modals are declarative (`<ModalDialog>` + slots) instead of HTML strings.
- Toasts are a reactive store rendered by `<ToastStack>` with a transition group.
- localStorage keys are unchanged (`ck.sidebar`, `ck.navOpen`, `ck.activeAccount`)
  so state carries over from the static prototype.

## Retired with the port

`assets/js/app.js`, `assets/js/widgets.js` and `assets/js/data.js` are the
vanilla shell: the sidebar/topbar/palette builder, the chart and table widgets,
and the original demo dataset. Nothing loads them now — `assets/css/app.css`
stays because `src/main.js` imports it as the design system. They are kept as
the reference implementation for the screens that were translated.
