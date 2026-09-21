<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { ACCOUNTS } from '../data/portal.js'
import { accountHref } from '../lib/router.js'
import { brand } from '../lib/assets.js'
import { pushToast } from '../lib/ui.js'

/*
 * Main · Platforms — a downloads page.
 *
 * Pick a terminal, then take it for the device you are on. Nothing here is
 * gated: no connection guide, no logins, no credentials (the desk issues those
 * at purchase), and no desktop-only call to action, because a reader can just
 * as easily be on a Mac or a phone.
 *
 * The installer links are demo values and the callout at the foot says so. The
 * counts and the account list are not — they are read from the platform list
 * and the account book.
 */
const PLATFORMS = [
  {
    id: 'tradelocker',
    name: 'TradeLocker',
    logo: brand.tradeLocker,
    note: 'Browser, desktop and mobile',
    downloads: [
      { os: 'Windows', icon: 'monitor', source: 'Direct installer · .exe' },
      { os: 'macOS', icon: 'monitor', source: 'Direct installer · .dmg' },
      { os: 'Web terminal', icon: 'globe', source: 'No install needed' },
      { os: 'iOS', icon: 'phone', source: 'App Store' },
      { os: 'Android', icon: 'phone', source: 'Google Play' },
    ],
  },
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    logo: brand.metaTrader5,
    note: 'Desktop and mobile',
    downloads: [
      { os: 'Windows', icon: 'monitor', source: 'Direct installer · .exe' },
      { os: 'macOS', icon: 'monitor', source: 'Direct installer · .dmg' },
      { os: 'iOS', icon: 'phone', source: 'App Store' },
      { os: 'Android', icon: 'phone', source: 'Google Play' },
    ],
  },
]

const selected = ref(PLATFORMS[0].id)

const platform = computed(() => PLATFORMS.find((p) => p.id === selected.value))
const accountsOn = (p) => ACCOUNTS.filter((a) => a.platform === p.name)
const myAccounts = computed(() => accountsOn(platform.value))

function download(d) {
  pushToast({
    tone: 'info',
    title: `Download for ${d.os}`,
    msg: `This prototype bundles no installer. On the live portal this hands over the ${d.source.toLowerCase()} build of ${platform.value.name}.`,
  })
}
</script>

<template>
  <div class="ov" data-od-id="platforms-page">
    <div class="page-head util-head" data-od-id="page-head-platforms">
      <div class="page-head__text">
        <div class="eyebrow">Main · Platforms</div>
        <h1>Platforms</h1>
        <p class="dim">
          Download either terminal for the device you are on — Windows, macOS, the browser, or your phone.
          Both are wired to your simulated accounts and free to install.
        </p>
      </div>
    </div>

    <!-- Pick a terminal. The whole card is the target. -->
    <section class="panel util-gap" data-od-id="platform-picker">
      <div class="panel__head">
        <span class="panel__title">Trading platforms</span>
        <span class="panel__actions"><span class="stat-card__foot">Pick one to see its downloads</span></span>
      </div>

      <div class="plat-picker">
        <button
          v-for="p in PLATFORMS"
          :key="p.id"
          type="button"
          class="plat-card"
          :class="{ 'is-on': selected === p.id }"
          :aria-pressed="selected === p.id"
          :data-od-id="`platform-${p.id}`"
          @click="selected = p.id"
        >
          <img class="plat-card__logo" :src="p.logo" alt="" width="42" height="42" />
          <span class="plat-card__id">
            <span class="plat-card__name">{{ p.name }}</span>
            <span class="plat-card__surfaces">{{ p.note }}</span>
          </span>
          <span class="plat-card__count">
            <b>{{ p.downloads.length }}</b> downloads available
          </span>
        </button>
      </div>
    </section>

    <section class="panel" data-od-id="platform-downloads">
      <div class="panel__head">
        <span class="panel__title">{{ platform.name }} downloads</span>
        <span class="panel__actions">
          <span class="badge badge--violet">{{ platform.downloads.length }} builds</span>
        </span>
      </div>

      <div class="table-wrap">
        <table class="data data--striped" style="min-width:560px">
          <thead>
            <tr>
              <th>Operating system</th>
              <th>Version</th>
              <th>Source</th>
              <th class="num">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in platform.downloads" :key="d.os">
              <td class="cell-strong">
                <span class="plat-os"><AppIcon :name="d.icon" :size="16" />{{ d.os }}</span>
              </td>
              <td><span class="badge">Latest</span></td>
              <td class="dim">{{ d.source }}</td>
              <td class="num">
                <button type="button" class="btn btn--ghost btn--sm plat-download" @click="download(d)">
                  <AppIcon name="download" :size="15" />Download
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Which of your accounts this terminal is the one for. -->
      <div class="panel__foot">
        <span class="plat-runs">
          <span class="stat-card__foot">Runs your accounts</span>
          <template v-if="myAccounts.length">
            <a v-for="a in myAccounts" :key="a.id" class="plat-runs__link mono" :href="accountHref(a.number)">{{ a.number }}</a>
          </template>
          <span v-else class="stat-card__foot">No account of yours runs on {{ platform.name }} yet.</span>
        </span>
      </div>
    </section>

    <div class="callout callout--warn util-warn">
      <AppIcon name="alert" :size="18" />
      <div><strong>Simulated environment.</strong> Installer links shown here are demo values, and this prototype never connects to a trading server.</div>
    </div>
  </div>
</template>
