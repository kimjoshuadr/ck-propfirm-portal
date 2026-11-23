<script setup>
import { computed, onMounted, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { LEADERBOARD, TOURNAMENTS, joinTournament } from '../lib/portal.js'
import { money, signedPct } from '../lib/format.js'
import { pushToast } from '../lib/ui.js'

/*
 * Account · Community · Leaderboard — live.
 *
 * GET /leaderboard returns the top 20 funded/active accounts by ROI this
 * month, trader names masked server-side ("Kim J."). The demo season table's
 * invented columns (country, streak, verified flag) are gone: what the API
 * certifies is the rank, the masked trader and the month's ROI.
 *
 * Under it, the tournament list from GET /tournaments with the caller's
 * joined flag; joining posts through the store.
 */
const podium = computed(() => LEADERBOARD.filter((r) => r.rank <= 3))

const filter = ref('')

const standings = computed(() => {
  const needle = filter.value.trim().toLowerCase()
  if (!needle) return LEADERBOARD
  return LEADERBOARD.filter((r) => `${r.trader} ${r.status}`.toLowerCase().includes(needle))
})

function seasonRules() {
  pushToast({ tone: 'info', title: 'Season rules', msg: 'The board ranks funded and active accounts by this month\'s ROI; trader names are always masked.' })
}

/* ------------------------------------------------------------- tournaments */

const joining = ref('') // tournament id being joined
const joinError = ref('')

const formatDay = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const statusBadge = (status) => (status === 'running' ? 'badge--active' : status === 'registration' ? 'badge--pending' : '')

const entryFee = (t) => (t.entry_fee_cents ? money(t.entry_fee_cents) : 'Free')

async function join(t) {
  joining.value = t.id
  joinError.value = ''
  try {
    await joinTournament(t.id)
    t.joined = true
    t.participant_count += 1
    pushToast({ tone: 'good', title: 'Joined', msg: `You are in ${t.name}. Your tournament account is on its way.` })
  } catch (err) {
    joinError.value = err?.message || 'Could not join this tournament. Please try again.'
    pushToast({ tone: 'bad', title: 'Tournament', msg: joinError.value })
  } finally {
    joining.value = ''
  }
}

const prizesText = (t) => {
  if (!Array.isArray(t.prizes) || !t.prizes.length) return 'Prizes announced at the start'
  return t.prizes.slice(0, 3).map((p, i) => {
    const place = ['1st', '2nd', '3rd'][i] || `#${i + 1}`
    const amount = p.amount_cents != null ? money(Number(p.amount_cents)) : (p.label || p.name || '')
    return `${place} ${amount}`.trim()
  }).join(' · ')
}

onMounted(() => {})
</script>

<template>
  <div class="ov" data-od-id="leaderboard-page">
    <div class="page-head util-head" data-od-id="page-head-leaderboard">
      <div class="page-head__text">
        <div class="eyebrow">Account · Leaderboard</div>
        <h1>Leaderboard</h1>
        <p class="dim">
          Real traders, real rewards, real impact. The board ranks funded and active accounts by
          this month's ROI on verified simulated results — names are always masked.
        </p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--ghost" @click="seasonRules">Season rules</button>
      </div>
    </div>

    <div class="grid grid--cols-3 util-gap lb-podium" style="margin-top:18px" data-od-id="podium">
        <article v-for="r in podium" :key="r.handle + r.rank" class="card glow-card" :data-od-id="`podium-${r.rank}`">
          <div class="card__body stack lb-podium__body">
            <div class="lb-podium__id">
              <span class="rank" :class="`rank--${r.rank}`">{{ r.rank }}</span>
              <div style="min-width:0">
                <div class="lb-podium__handle">{{ r.trader }}</div>
                <div class="mono-id">{{ r.status || 'Funded' }} account</div>
              </div>
            </div>
            <div class="stat-inline">
              <div class="stat-inline__item"><b class="up">{{ signedPct(r.roi, 1) }}</b><span>Net ROI</span></div>
            </div>
          </div>
      </article>
    </div>

      <section class="card card--flush" data-od-id="leaderboard-card">
        <div class="card__head">
          <h3>This month's standings</h3>
          <div class="card__actions">
            <label class="sr" for="lbFilter">Filter traders</label>
            <input id="lbFilter" v-model="filter" class="input search-input lb-filter" placeholder="Filter by trader or status" />
          </div>
        </div>

        <div class="table-wrap">
          <table class="data" data-table="leaderboard">
            <thead>
              <tr>
                <th class="num">#</th>
                <th>Trader</th>
                <th>Account</th>
                <th class="num">Net ROI</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in standings" :key="`${r.rank}-${r.accountId}`">
                <td class="num"><span class="rank" :class="r.rank <= 3 ? `rank--${r.rank}` : ''">{{ r.rank }}</span></td>
                <td class="cell-strong">{{ r.trader }}</td>
                <td>{{ r.status || '—' }}</td>
                <td class="num up">{{ signedPct(r.roi, 1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!standings.length" class="empty">
          <strong>No traders match</strong>Clear the filter to see the full standings.
        </div>
    </section>

    <!-- Tournaments: registration, running, finished — with the caller's flag. -->
    <section class="card card--flush" style="margin-top:18px" data-od-id="tournaments">
      <div class="card__head">
        <h3>Tournaments</h3>
        <div class="card__actions"><span class="stat-card__foot">Entry is per tournament; fees are quoted in money, not margin</span></div>
      </div>

      <div v-if="TOURNAMENTS.length" class="stack" style="gap:0">
        <div v-for="t in TOURNAMENTS" :key="t.id" class="mth-row" :data-od-id="`tournament-${t.slug}`">
          <span class="mth-row__mark"><AppIcon name="trophy" :size="20" /></span>

          <span class="mth-row__id">
            <b>{{ t.name }}</b>
            <span>
              {{ formatDay(t.starts_at) }} – {{ formatDay(t.ends_at) }}
              · {{ t.participant_count }}{{ t.max_participants ? ` / ${t.max_participants}` : '' }} entrants
              · {{ t.ranking_metric }} ranking
            </span>
            <span class="stat-card__foot">{{ prizesText(t) }}</span>
          </span>

          <span class="mth-row__facts">
            <span class="mth-row__fact"><em>Entry</em><b>{{ entryFee(t) }}</b></span>
          </span>

          <span class="mth-row__actions">
            <span class="badge" :class="statusBadge(t.status)"><span class="badge__dot" />{{ t.status }}</span>
            <span v-if="t.joined" class="badge badge--passed"><span class="badge__dot" />joined</span>
            <button
              v-else-if="t.status === 'registration'"
              type="button"
              class="btn btn--secondary btn--sm"
              :disabled="joining === t.id"
              :data-od-id="`tournament-join-${t.slug}`"
              @click="join(t)"
            >{{ joining === t.id ? 'Joining…' : 'Join' }}</button>
          </span>
        </div>
      </div>

      <p v-else class="empty"><strong>No tournaments right now</strong>Registration windows open here as the desk schedules them.</p>
    </section>
  </div>
</template>
