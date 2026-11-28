<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import TheSidebar from './components/TheSidebar.vue'
import TheTopbar from './components/TheTopbar.vue'
import ToastStack from './components/ToastStack.vue'
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
import ChallengeCheckout from './components/ChallengeCheckout.vue'
import { auth, bootSession, closeChallenge, closeDrawer, shell } from './lib/portal.js'
import { isPage, route } from './lib/router.js'

const paletteOpen = ref(false)

function onKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    if (auth.status === 'authed') {
      event.preventDefault()
      paletteOpen.value = !paletteOpen.value
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  bootSession()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

/* An in-app jump swaps the page without a reload, so close the drawer and put
   the new page back at the top like a real navigation would. */
watch(() => route.page, () => {
  closeDrawer()
  closeChallenge()
  if (auth.status === 'authed') window.scrollTo({ top: 0 })
})

/* A signed-in trader landing on #login (an old link, the back button) goes to
   the dashboard; the login screen is for the signed-out state only. */
watch(() => auth.status, (status) => {
  if (status === 'authed' && isPage('login')) location.hash = '#overview'
})
</script>

<template>
  <!-- Restoring the sessionStorage token: a quiet navy beat, no shell flash. -->
  <div v-if="auth.status === 'init'" class="boot" aria-busy="true" aria-label="Loading your session" />

  <LoginPage v-else-if="auth.status !== 'authed'" />

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

  <ChallengeCheckout v-if="shell.challenge" @close="closeChallenge()" />
  </template>
</template>
