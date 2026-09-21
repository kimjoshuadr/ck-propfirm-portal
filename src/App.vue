<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import TheSidebar from './components/TheSidebar.vue'
import TheTopbar from './components/TheTopbar.vue'
import ToastStack from './components/ToastStack.vue'
import ModalDialog from './components/ModalDialog.vue'
import CommandPalette from './components/CommandPalette.vue'
import OverviewPage from './pages/OverviewPage.vue'
import AccountsPage from './pages/AccountsPage.vue'
import AccountDetailPage from './pages/AccountDetailPage.vue'
import MarketPage from './pages/MarketPage.vue'
import AffiliatesPage from './pages/AffiliatesPage.vue'
import SizerPage from './pages/SizerPage.vue'
import PlatformsPage from './pages/PlatformsPage.vue'
import ManagePage from './pages/ManagePage.vue'
import AgreementsPage from './pages/AgreementsPage.vue'
import LeaderboardPage from './pages/LeaderboardPage.vue'
import LearnPage from './pages/LearnPage.vue'
import HelpPage from './pages/HelpPage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import LoginPage from './pages/LoginPage.vue'
import { PROMO, closeChallenge, closeDrawer, shell } from './lib/portal.js'
import { isPage, route } from './lib/router.js'
import { pushToast } from './lib/ui.js'

const paletteOpen = ref(false)

const CHALLENGE_ROWS = [
  { size: 25000, price: 58, target: 2000, loss: 2000, days: 4 },
  { size: 50000, price: 118, target: 2500, loss: 4000, days: 4 },
  { size: 100000, price: 193, target: 8000, loss: 8000, days: 4 },
  { size: 200000, price: 359, target: 14000, loss: 16000, days: 4 },
]

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`

function onKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    paletteOpen.value = !paletteOpen.value
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

/* An in-app jump swaps the page without a reload, so close the drawer and put
   the new page back at the top like a real navigation would. */
watch(() => route.page, () => {
  closeDrawer()
  closeChallenge()
  window.scrollTo({ top: 0 })
})

function startEvaluation() {
  closeChallenge()
  pushToast({
    tone: 'good',
    title: 'Checkout opened',
    msg: `Simulated evaluation · code ${PROMO.code} applied.`,
  })
}
</script>

<template>
  <LoginPage v-if="isPage('login')" />

  <template v-else>
  <TheSidebar />

  <div class="scrim" :class="{ 'is-on': shell.drawer }" @click="closeDrawer" />

  <div class="main">
    <TheTopbar @palette="paletteOpen = true" />

    <main class="content">
      <MarketPage v-if="isPage('market')" />
      <AccountDetailPage v-else-if="isPage('account')" />
      <AccountsPage v-else-if="isPage('accounts')" />
      <SizerPage v-else-if="isPage('sizer')" />
      <PlatformsPage v-else-if="isPage('platforms')" />
      <ManagePage v-else-if="isPage('payouts')" />
      <AgreementsPage v-else-if="isPage('agreements')" />
      <LeaderboardPage v-else-if="isPage('leaderboard')" />
      <AffiliatesPage v-else-if="isPage('affiliates')" />
      <LearnPage v-else-if="isPage('learn')" />
      <HelpPage v-else-if="isPage('help')" />
      <SettingsPage v-else-if="isPage('settings')" />
      <OverviewPage v-else />
    </main>

    <footer class="foot-note" data-od-id="app-footer">
      <!-- The reference's footer: one row of links, nothing else. Terms and
           privacy both live on the agreements page — the trader agreement and
           the data processing addendum — so both point there. -->
      <nav class="foot-note__links" aria-label="Legal and support">
        <a href="#manage/agreements">Terms &amp; conditions</a>
        <a href="#manage/agreements">Privacy policy</a>
        <a href="#help/support">Contact us</a>
        <a href="#help/faq">Help centre</a>
      </nav>

      <div class="foot-note__fine">
        <span>
          <strong>Simulated environment.</strong>
          All accounts are demo accounts on simulated capital. Performance is not indicative of real results.
          CK Propfirm is a trading-evaluation product, not a broker.
        </span>
        <span class="foot-note__mark">© 2026 CK Propfirm</span>
      </div>
    </footer>
  </div>

  <ToastStack />
  <CommandPalette :open="paletteOpen" @close="paletteOpen = false" />

  <ModalDialog
    v-if="shell.challenge"
    title="Choose your next challenge"
    subtitle="70% off this week — one-time fee, simulated evaluation. No hidden fees, no time limits, news trading allowed."
    @close="closeChallenge()"
  >
    <div class="table-wrap">
      <table class="data" style="min-width:520px">
        <thead>
          <tr>
            <th>Size</th>
            <th class="num">Profit target</th>
            <th class="num">Max loss</th>
            <th class="num">Min days</th>
            <th class="num">Today</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in CHALLENGE_ROWS" :key="row.size">
            <td class="cell-strong">{{ money(row.size) }}</td>
            <td class="num">{{ money(row.target) }}</td>
            <td class="num">{{ money(row.loss) }}</td>
            <td class="num">{{ row.days }}</td>
            <td class="num">
              <span class="dim" style="text-decoration:line-through">{{ money(row.price * 3.33) }}</span>
              <span class="up">{{ money(row.price) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #actions>
      <button class="btn btn--ghost" @click="closeChallenge()">Not now</button>
      <button class="btn btn--primary" @click="startEvaluation">Start evaluation</button>
    </template>
  </ModalDialog>
  </template>
</template>
