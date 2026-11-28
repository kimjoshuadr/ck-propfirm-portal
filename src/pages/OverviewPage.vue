<script setup>
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import EquityCard from '../components/overview/EquityCard.vue'
import PayoutCard from '../components/overview/PayoutCard.vue'
import AccountsCarousel from '../components/overview/AccountsCarousel.vue'
import LeaderboardCard from '../components/overview/LeaderboardCard.vue'
import CertificatesCard from '../components/overview/CertificatesCard.vue'
import AlertsFeed from '../components/overview/AlertsFeed.vue'
import { maxLossToday } from '../data/portal.js'
import { ACCOUNTS, USER } from '../lib/portal.js'
import { activeAccount, openChallenge } from '../lib/portal.js'
import { accountHref } from '../lib/router.js'
import { longDate, money, signedMoney, signedPct, timeOfDay } from '../lib/format.js'
import { pushToast } from '../lib/ui.js'

/*
 * Overview.
 *
 * Short on purpose. Six blocks: greeting, the balance/payout panel (with the
 * book totals as its footer), the accounts rail, the two ranking panels, the
 * alert feed, and one row of community links.
 *
 * What used to sit here — a standalone portfolio strip repeating the equity
 * card, a CK Room promo band, an FAQ card and two full-height promo image cards
 * — was four more blocks of near-duplicate content. Their destinations are all
 * still one click away in the sidebar and on Help, and the links row at the
 * bottom keeps the community ones.
 */
const part = timeOfDay()

/* Every figure is derived from ACCOUNTS, so the header can never disagree with
   the cards under it. "Risk left today" is each live account's daily-loss
   allowance minus what its most recent logged session already took. */
const book = computed(() => {
  const live = ACCOUNTS.filter((a) => a.status !== 'breached')
  const equity = ACCOUNTS.reduce((n, a) => n + a.equity, 0)
  const capital = ACCOUNTS.reduce((n, a) => n + a.size, 0)
  const pnl = ACCOUNTS.reduce((n, a) => n + a.pnl, 0)
  const headroom = live.reduce((n, a) => n + Math.max(0, a.dailyLoss - maxLossToday(a.number)), 0)
  const evaluations = ACCOUNTS.filter((a) => a.status === 'active').length
  const funded = ACCOUNTS.filter((a) => a.status === 'funded').length
  const breached = ACCOUNTS.filter((a) => a.status === 'breached').length

  return {
    equity,
    capital,
    pnl,
    roi: capital > 0 ? (pnl / capital) * 100 : 0,
    headroom,
    live: live.length,
    total: ACCOUNTS.length,
    breakdown: [
      evaluations ? `${evaluations} evaluation${evaluations === 1 ? '' : 's'}` : '',
      funded ? `${funded} funded` : '',
      breached ? `${breached} breached` : '',
    ].filter(Boolean).join(' · '),
  }
})

function planned(title, msg) {
  pushToast({ tone: 'info', title, msg })
}
</script>

<template>
  <div class="ov">
    <!-- canvas · greeting, session state, the page's single gold action -->
    <section class="hero" data-od-id="overview-hero">
      <span class="hero__glow" aria-hidden="true"></span>
      <div class="hero__body">
        <div class="hero__meta">
          <span class="hero__chip"><AppIcon name="calendar" :size="13" />{{ longDate() }}</span>
          <a v-if="activeAccount" class="hero__chip hero__chip--link" :href="accountHref(activeAccount.number)">
            <AppIcon name="user" :size="13" />Active · {{ activeAccount.id }}
          </a>
        </div>
        <h1 class="hero__title">Good {{ part }}, {{ USER.name }}!</h1>
        <p class="hero__sub">Your accounts, payouts and market activity at a glance — everything here is simulated, nothing is real money.</p>
      </div>
      <div class="hero__actions">
        <button type="button" class="btn btn--primary" data-od-id="hero-start-challenge" @click="openChallenge()">
          <AppIcon name="rocket" :size="16" />Start New Challenge
        </button>
        <a class="btn btn--ghost" href="#accounts/certificates">
          <AppIcon name="certificate" :size="16" />View Certificates
        </a>
        <a class="btn btn--ghost" href="#settings">
          <AppIcon name="user" :size="16" />Go to My Account
        </a>
      </div>
    </section>

    <!-- panel · the balance, the payout, and what the whole book is doing -->
    <section class="panel panel--split" data-od-id="overview-balance">
      <EquityCard />
      <PayoutCard />

      <div class="book-row" data-od-id="overview-book">
        <div class="grid grid--cols-4 portfolio">
          <div class="portfolio__cell">
            <span class="portfolio__k">Accounts</span>
            <span class="portfolio__v">{{ book.total }}</span>
            <span class="portfolio__meta">{{ book.breakdown }}</span>
          </div>
          <div class="portfolio__cell">
            <span class="portfolio__k">Total equity</span>
            <span class="portfolio__v">{{ money(book.equity) }}</span>
            <span class="portfolio__meta">Across every account you hold</span>
          </div>
          <div class="portfolio__cell">
            <span class="portfolio__k">Open P&amp;L</span>
            <span class="portfolio__v" :class="book.pnl >= 0 ? 'up' : 'down'">{{ signedMoney(book.pnl) }}</span>
            <span class="portfolio__meta">{{ signedPct(book.roi, 1) }} on {{ money(book.capital) }} of allocated capital</span>
          </div>
          <div class="portfolio__cell">
            <span class="portfolio__k">Risk left today</span>
            <span class="portfolio__v">{{ money(book.headroom) }}</span>
            <span class="portfolio__meta">Daily-loss headroom across {{ book.live }} live account{{ book.live === 1 ? '' : 's' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- canvas + cards · click any card to open that account -->
    <section class="ov__zone" data-od-id="overview-accounts-zone">
      <AccountsCarousel />
    </section>

    <!-- panels · rankings and certificates -->
    <div class="ov__row-2 ov__row-2--even">
      <LeaderboardCard />
      <CertificatesCard />
    </div>

    <!-- panel · what happened on the account -->
    <AlertsFeed />

    <!-- canvas · the community, as three links rather than two promo cards -->
    <section class="ov__zone" data-od-id="overview-community">
      <div class="sec">
        <div class="sec__body">
          <h2 class="sec__title">More from CK Propfirm</h2>
          <p class="sec__sub">The three places the community and the desk actually live.</p>
        </div>
      </div>

      <div class="grid grid--cols-3">
        <a class="quick" href="#community/affiliates" data-od-id="overview-quick-affiliate">
          <span class="quick__icon"><AppIcon name="link2" :size="18" /></span>
          <span class="quick__title">Affiliate program</span>
          <span class="quick__sub">Not joined yet — refer traders and earn commission on every evaluation they pass. Earned to date: $0.00.</span>
          <span class="quick__go">Join the program<AppIcon name="chevronRight" :size="14" /></span>
        </a>

        <a class="quick" href="#learn" data-od-id="overview-quick-learn">
          <span class="quick__icon"><AppIcon name="book" :size="18" /></span>
          <span class="quick__title">FPT Learn</span>
          <span class="quick__sub">Structured courses on drawdown control, consistency rules and challenge psychology — free to start.</span>
          <span class="quick__go">Open the courses<AppIcon name="chevronRight" :size="14" /></span>
        </a>

        <button
          type="button"
          class="quick"
          data-od-id="overview-quick-youtube"
          @click="planned('Watch and learn', 'Market recaps and trader stories are published weekly in the live portal.')"
        >
          <span class="quick__icon"><AppIcon name="play" :size="18" /></span>
          <span class="quick__title">Watch and learn</span>
          <span class="quick__sub">Trading insights, market recaps and trader stories from the desk, recorded live every week.</span>
          <span class="quick__go">Subscribe to the channel<AppIcon name="chevronRight" :size="14" /></span>
        </button>
      </div>
    </section>
  </div>
</template>
