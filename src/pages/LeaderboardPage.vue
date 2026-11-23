<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { ACCOUNTS, LEADERBOARD } from '../lib/portal.js'
import { money, signedPct } from '../lib/format.js'
import { pushToast } from '../lib/ui.js'

/*
 * Account · Community · Leaderboard.
 *
 * Rankings are the same season table the Overview card reads, so a handle and
 * its ROI agree in both places. Unverified rows are marked and dropped by the
 * switch — the reference's own rule is that they never count toward prizes.
 *
 * The competitions view that used to share this screen is gone: the reference
 * has one leaderboard, and a season table plus an enrolment grid underneath it
 * was two screens pretending to be one.
 */
const podium = computed(() => LEADERBOARD.filter((r) => r.rank <= 3))

const filter = ref('')
const verifiedOnly = ref(true)

const standings = computed(() => {
  const needle = filter.value.trim().toLowerCase()
  return LEADERBOARD.filter((r) => {
    if (verifiedOnly.value && !r.verified) return false
    if (!needle) return true
    return `${r.handle} ${r.country} ${r.account}`.toLowerCase().includes(needle)
  })
})

const you = LEADERBOARD.find((r) => r.isUser)
/* The standing is a 25K account — name it by the account the portal shows. */
const yourAccount = ACCOUNTS.find((a) => a.size === 25000) || ACCOUNTS[0]

function seasonRules() {
  pushToast({ tone: 'info', title: 'Season rules', msg: 'Verified simulated results only; unverified handles are excluded from prizes.' })
}
</script>

<template>
  <div class="ov" data-od-id="leaderboard-page">
    <div class="page-head util-head" data-od-id="page-head-leaderboard">
      <div class="page-head__text">
        <div class="eyebrow">Account · Leaderboard</div>
        <h1>Leaderboard</h1>
        <p class="dim">
          Real traders, real rewards, real impact. Rankings use verified simulated results only —
          unverified handles are marked and never counted toward prizes.
        </p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--ghost" @click="seasonRules">Season rules</button>
      </div>
    </div>

    <div class="grid grid--cols-3 util-gap lb-podium" style="margin-top:18px" data-od-id="podium">
        <article v-for="r in podium" :key="r.handle" class="card glow-card" :data-od-id="`podium-${r.rank}`">
          <div class="card__body stack lb-podium__body">
            <div class="lb-podium__id">
              <span class="rank" :class="`rank--${r.rank}`">{{ r.rank }}</span>
              <div style="min-width:0">
                <div class="lb-podium__handle">{{ r.handle }}</div>
                <div class="mono-id">{{ r.account }} account · <span class="flag">{{ r.country }}</span></div>
              </div>
            </div>
            <div class="stat-inline">
              <div class="stat-inline__item"><b class="up">{{ signedPct(r.roi, 1) }}</b><span>Net ROI</span></div>
              <div class="stat-inline__item"><b>{{ money(r.profit) }}</b><span>Profit</span></div>
              <div class="stat-inline__item"><b>{{ r.streak }} d</b><span>Green streak</span></div>
            </div>
          </div>
      </article>
    </div>

    <div v-if="you" class="callout callout--proof util-gap">
        <AppIcon name="spark" :size="17" />
        <div>
          You are ranked <strong>#{{ you.rank }}</strong> this season with
          <strong>{{ signedPct(you.roi, 2) }}</strong> net ROI on
          <span class="mono">{{ yourAccount.id }}</span>.
          Two more green sessions push you into the prize band.
        </div>
      </div>

      <section class="card card--flush" data-od-id="leaderboard-card">
        <div class="card__head">
          <h3>Season standings</h3>
          <div class="card__actions">
            <label class="sr" for="lbFilter">Filter traders</label>
            <input id="lbFilter" v-model="filter" class="input search-input lb-filter" placeholder="Filter by handle or region" />
            <label class="switch">
              <input v-model="verifiedOnly" type="checkbox" />
              <span class="switch__track" />
              <span class="switch__text">Verified only</span>
            </label>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data" data-table="leaderboard">
            <thead>
              <tr>
                <th class="num">#</th>
                <th>Trader</th>
                <th>Region</th>
                <th class="num">Account</th>
                <th class="num">Net ROI</th>
                <th class="num">Profit</th>
                <th class="num">Green streak</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in standings" :key="r.handle" :class="{ 'is-you': r.isUser }">
                <td class="num"><span class="rank" :class="r.rank <= 3 ? `rank--${r.rank}` : ''">{{ r.rank }}</span></td>
                <td class="cell-strong">
                  {{ r.handle }}
                  <span v-if="r.isUser" class="tag">you</span>
                </td>
                <td><span class="flag">{{ r.country }}</span></td>
                <td class="num">{{ r.account }}</td>
                <td class="num up">{{ signedPct(r.roi, 1) }}</td>
                <td class="num">{{ money(r.profit) }}</td>
                <td class="num">{{ r.streak }} d</td>
                <td>
                  <span v-if="r.verified" class="badge badge--active"><span class="badge__dot" />verified</span>
                  <span v-else class="badge">unverified</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!standings.length" class="empty">
          <strong>No traders match</strong>Clear the filter to see the full standings.
        </div>
    </section>
  </div>
</template>
