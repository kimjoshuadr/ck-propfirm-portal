<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { ECONOMIC_EVENTS, IMPACTS, TIMEZONES } from '../data/market.js'
import { NEWS } from '../data/portal.js'
import { newsroom, timeAgo } from '../lib/news.js'
import { pushToast } from '../lib/ui.js'
import { route } from '../lib/router.js'

/*
 * Market · Economic calendar + Newsroom.
 *
 * Events are stored as UTC instants and read in the zone the reader picks —
 * shifting the zone moves rows between days rather than only relabelling the
 * hours, which is the point of the control.
 *
 * One deliberate departure from the reference: its last column is RESTRICTED.
 * CK's own rules say news trading is allowed with no restricted windows, so
 * that column would contradict the product. It carries ACTUAL instead, and the
 * status card states the policy rather than pretending some windows are shut.
 */
const TABS = [
  { key: 'calendar', label: 'Economic calendar' },
  { key: 'news', label: 'Newsroom' },
]

const tab = ref(route.tab === 'news' ? 'news' : 'calendar')

function select(key) {
  tab.value = key
  history.replaceState(null, '', `${location.pathname}#market/${key}`)
}

/* A hash jump from the sidebar swaps the page in place, so follow the route. */
watch(() => route.tab, (next) => {
  if (next === 'calendar' || next === 'news') tab.value = next
})
const zone = ref(TIMEZONES[0].id)
const currency = ref('all')
const impact = ref('all')
const status = ref('all')
const collapsed = ref(new Set())

/* The demo week, Monday first. */
const WEEK_START = new Date(Date.UTC(2026, 8, 21))
const weekOffset = ref(0)

const dayKey = (date, tz) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)

const dayLabel = (key) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(`${key}T12:00:00Z`)).replace(',', '')

const clock = (date, tz) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date).toLowerCase().replace(/\s/g, '')

const rangeLabel = computed(() => {
  const from = new Date(WEEK_START)
  from.setUTCDate(from.getUTCDate() + weekOffset.value * 7)
  const to = new Date(from)
  to.setUTCDate(to.getUTCDate() + 6)
  const fmt = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(d)
  return `${fmt(from)} - ${fmt(to)}`
})

/* Seven day buckets for the visible week, in the chosen zone. */
const days = computed(() => {
  const from = new Date(WEEK_START)
  from.setUTCDate(from.getUTCDate() + weekOffset.value * 7)
  const list = []
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(from)
    d.setUTCDate(d.getUTCDate() + i)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    const rows = ECONOMIC_EVENTS
      .filter((e) => dayKey(new Date(e.at), zone.value) === key)
      .filter((e) => currency.value === 'all' || e.ccy === currency.value)
      .filter((e) => impact.value === 'all' || e.impact === impact.value)
      .filter((e) => status.value === 'all'
        || (status.value === 'released' ? e.actual !== '—' : e.actual === '—'))
      .sort((a, b) => new Date(a.at) - new Date(b.at))
    list.push({ key, label: dayLabel(key), rows })
  }
  return list
})

/* The week's own day keys, so the totals ignore the filters while the visible
   count honours them. */
const weekKeys = computed(() => {
  const from = new Date(WEEK_START)
  from.setUTCDate(from.getUTCDate() + weekOffset.value * 7)
  return new Set(Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from)
    d.setUTCDate(d.getUTCDate() + i)
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  }))
})

const totals = computed(() => {
  const inWeek = ECONOMIC_EVENTS.filter((e) => weekKeys.value.has(dayKey(new Date(e.at), zone.value)))
  return {
    count: inWeek.length,
    high: inWeek.filter((e) => e.impact === 'high').length,
    released: inWeek.filter((e) => e.actual !== '—').length,
  }
})

/* CK allows news trading, so the status card states the policy instead of
   pretending some windows are gated. */
const policy = computed(() => (totals.value.high
  ? `No restricted windows — the ${totals.value.high} high-impact release${totals.value.high === 1 ? '' : 's'} this week ${totals.value.high === 1 ? 'is' : 'are'} tradeable as ${totals.value.high === 1 ? 'it' : 'they'} print.`
  : 'No restricted windows — nothing on this week’s calendar is gated.'))

const currencies = computed(() => [...new Set(ECONOMIC_EVENTS.map((e) => e.ccy))].sort())

const visibleCount = computed(() => days.value.reduce((n, d) => n + d.rows.length, 0))

const isOpen = (key) => !collapsed.value.has(key)
function toggle(key) {
  const next = new Set(collapsed.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsed.value = next
}

function stepWeek(dir) {
  weekOffset.value += dir
  collapsed.value = new Set()
}

function refresh() {
  pushToast({
    tone: 'info',
    title: 'Calendar refreshed',
    msg: 'This prototype reads a local demo dataset, so the week is already current.',
  })
}

/* ---------------------------------------------------------------- newsroom */

/*
 * The wire copy comes from a dated snapshot (src/data/newsroom.json) written by
 * `npm run news`, not a live browser fetch — the feed is not CORS-enabled and a
 * snapshot keeps the page offline-safe. The desk notes above it are ours.
 */
const q = ref('')
const source = ref('all')

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return newsroom.articles.filter((a) => {
    if (source.value !== 'all' && a.source !== source.value) return false
    if (!needle) return true
    return `${a.title} ${a.source}`.toLowerCase().includes(needle)
  })
})

/* The lead story only exists while browsing the full feed unfiltered — a search
   result set should read as a plain list rather than promoting one hit. */
const browsing = computed(() => source.value === 'all' && !q.value.trim())
const lead = computed(() => (browsing.value ? filtered.value[0] : null))
const rest = computed(() => (lead.value ? filtered.value.slice(1) : filtered.value))

const takenAt = computed(() => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(newsroom.fetchedAt)))

function refreshFeed() {
  pushToast({
    tone: 'info',
    title: 'Newsroom snapshot',
    msg: `This page reads a snapshot taken ${timeAgo(newsroom.fetchedAt)}. Run "npm run news" to pull the newest wire copy.`,
  })
}
</script>

<template>
  <div class="ov" data-od-id="market-page">
    <div class="tabs" role="tablist" aria-label="Market views">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        class="tab"
        role="tab"
        :aria-selected="tab === t.key"
        :data-od-id="`market-tab-${t.key}`"
        @click="select(t.key)"
      >{{ t.label }}</button>
    </div>

    <template v-if="tab === 'calendar'">
      <header class="mcal-head">
        <h1 class="mcal-title">Economic Calendar</h1>
        <div class="mcal-head__actions">
          <label class="sr" for="mcalZone">Timezone</label>
          <select id="mcalZone" v-model="zone" class="select mcal-zone">
            <option v-for="z in TIMEZONES" :key="z.id" :value="z.id">{{ z.label }}</option>
          </select>
          <button type="button" class="btn btn--ghost" @click="refresh">
            <AppIcon name="download" :size="15" />Refresh
          </button>
        </div>
      </header>

      <section class="mcal-status" data-od-id="market-status">
        <div class="mcal-status__row">
          <AppIcon name="shield" :size="18" /><b>News windows</b>
        </div>
        <div class="mcal-status__row">
          <AppIcon name="check" :size="18" />
          <span>{{ policy }}</span>
        </div>
      </section>

      <div class="mcal-filters">
        <label class="sr" for="mcalCcy">Currency</label>
        <select id="mcalCcy" v-model="currency" class="select">
          <option value="all">All currencies</option>
          <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
        </select>

        <label class="sr" for="mcalImpact">Impact</label>
        <select id="mcalImpact" v-model="impact" class="select">
          <option value="all">All impacts</option>
          <option v-for="i in IMPACTS" :key="i.id" :value="i.id">{{ i.label }}</option>
        </select>

        <label class="sr" for="mcalStatus">Status</label>
        <select id="mcalStatus" v-model="status" class="select">
          <option value="all">All status</option>
          <option value="released">Released</option>
          <option value="pending">Pending</option>
        </select>

        <div class="mcal-range">
          <button type="button" class="rail__arrow" aria-label="Previous week" @click="stepWeek(-1)">
            <AppIcon name="chevronLeft" :size="16" />
          </button>
          <span class="mcal-range__label"><AppIcon name="calendar" :size="16" />{{ rangeLabel }}</span>
          <button type="button" class="rail__arrow" aria-label="Next week" @click="stepWeek(1)">
            <AppIcon name="chevronRight" :size="16" />
          </button>
        </div>

        <span class="mcal-filters__count">{{ visibleCount }} of {{ totals.count }} events</span>
      </div>

      <section class="panel mcal" data-od-id="market-events">
        <div class="mcal__cols">
          <span>Time</span><span>Currency</span><span>Impact</span><span>Title</span>
          <span class="num">Forecast</span><span class="num">Previous</span><span class="num">Actual</span>
        </div>

        <div v-for="d in days" :key="d.key" class="mcal__day">
          <button
            type="button"
            class="mcal__bar"
            :aria-expanded="isOpen(d.key)"
            @click="toggle(d.key)"
          >
            <span class="mcal__chevron" :class="{ 'is-closed': !isOpen(d.key) }">
              <AppIcon name="chevronDown" :size="16" />
            </span>
            <b>{{ d.label }}</b>
            <span class="mcal__count">({{ d.rows.length }} {{ d.rows.length === 1 ? 'event' : 'events' }})</span>
          </button>

          <template v-if="isOpen(d.key)">
            <div v-for="e in d.rows" :key="e.at + e.title" class="mcal__row">
              <span class="mono">{{ clock(new Date(e.at), zone) }}</span>
              <span class="mcal__ccy">{{ e.ccy }}</span>
              <span><span class="impact" :class="`impact--${e.impact}`">{{ e.impact }}</span></span>
              <span class="mcal__title">{{ e.title }}</span>
              <span class="num">{{ e.forecast }}</span>
              <span class="num">{{ e.previous }}</span>
              <span class="num" :class="e.actual === '—' ? 'dim' : 'mcal__actual'">{{ e.actual }}</span>
            </div>

            <p v-if="!d.rows.length" class="mcal__none">No events available for this day</p>
          </template>
        </div>
      </section>
    </template>

    <template v-else>
      <header class="mcal-head">
        <h1 class="mcal-title">Newsroom</h1>
        <div class="mcal-head__actions">
          <span class="nr-feed"><AppIcon name="globe" :size="15" />{{ newsroom.feed }}</span>
          <span class="nr-stamp">Snapshot · {{ timeAgo(newsroom.fetchedAt) }}</span>
          <button type="button" class="btn btn--ghost" @click="refreshFeed">
            <AppIcon name="download" :size="15" />Refresh
          </button>
        </div>
      </header>

      <a
        v-if="lead"
        class="panel nr-lead"
        :href="lead.url"
        target="_blank"
        rel="noopener noreferrer"
        data-od-id="news-lead"
      >
        <span class="nr-lead__media">
          <img v-if="lead.image" :src="lead.image" :alt="`${lead.source} coverage`" width="560" height="336" />
        </span>
        <span class="nr-lead__body">
          <span class="nr-lead__kicker">
            <span class="badge">Lead story</span>
            <b>{{ lead.source }}</b>
            <span class="dim">{{ timeAgo(lead.publishedAt) }}</span>
          </span>
          <span class="nr-lead__title">{{ lead.title }}</span>
          <span class="nr-lead__cta">Read at {{ lead.source }}<AppIcon name="external" :size="15" /></span>
        </span>
      </a>

      <section class="nr-desk">
        <div class="nr-sub">
          <h2>From the CK desk</h2>
          <span class="stat-card__foot">Our own notes, written for clients — not aggregated · <span class="demo-badge">Demo data</span></span>
        </div>
        <div class="acc-grid-2">
          <article v-for="n in NEWS" :key="n.title" class="panel news-card news-card--desk" :data-od-id="`news-${n.tag.toLowerCase()}`">
            <div class="news-card__head">
              <span class="badge">{{ n.tag }}</span>
              <span class="stat-card__foot">{{ n.source }} · {{ n.time }}</span>
            </div>
            <h3 class="news-card__title">{{ n.title }}</h3>
            <p class="news-card__body">{{ n.body }}</p>
          </article>
        </div>
      </section>

      <section class="nr-wire">
        <div class="nr-sub">
          <h2>Wire copy</h2>
          <span class="stat-card__foot">{{ filtered.length }} of {{ newsroom.articles.length }} stories</span>
        </div>

        <div class="nr-tools">
          <label class="sr" for="nrSearch">Search headlines</label>
          <div class="nr-search">
            <AppIcon name="search" :size="16" />
            <input id="nrSearch" v-model="q" type="search" placeholder="Search headlines or sources" autocomplete="off" />
          </div>

          <label class="sr" for="nrSource">Source</label>
          <select id="nrSource" v-model="source" class="select">
            <option value="all">All sources</option>
            <option v-for="s in newsroom.sources" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div v-if="rest.length" class="nr-grid">
          <a
            v-for="a in rest"
            :key="a.id"
            class="nr-card"
            :href="a.url"
            target="_blank"
            rel="noopener noreferrer"
            :data-od-id="`news-${a.id.slice(0, 6)}`"
          >
            <span class="nr-card__thumb">
              <img v-if="a.image" :src="a.image" alt="" loading="lazy" width="280" height="168" />
            </span>
            <span class="nr-card__meta">
              <b>{{ a.source }}</b>
              <span>{{ timeAgo(a.publishedAt) }}</span>
            </span>
            <span class="nr-card__title">{{ a.title }}</span>
            <span class="nr-card__go"><AppIcon name="external" :size="14" /></span>
          </a>
        </div>

        <p v-else class="mcal__none">No stories match this search.</p>
      </section>

      <p class="nr-note">
        Headlines, excerpts and images belong to the publishers listed on each card and come from the
        Google News <b>Business</b> topic. Every card opens the publisher's own article in a new tab;
        nothing is re-hosted for republication. Snapshot taken {{ takenAt }}, refreshed with
        <code>npm run news</code>.
      </p>
    </template>
  </div>
</template>
