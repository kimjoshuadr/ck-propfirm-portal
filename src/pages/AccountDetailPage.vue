<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import ModalDialog from '../components/ModalDialog.vue'
import OverviewTab from '../components/account/OverviewTab.vue'
import RulesTab from '../components/account/RulesTab.vue'
import CalendarPanel from '../components/account/CalendarPanel.vue'
import TradesTab from '../components/account/TradesTab.vue'
import AnalyticsTab from '../components/account/AnalyticsTab.vue'
import { accountByNumber } from '../data/portal.js'
import { account, accountDetails, copyText, isFavorite, loadAccountDetail, openChallenge, reloadAccountDetail, setActiveAccount, toggleFavorite } from '../lib/portal.js'
import { fetchCredentials } from '../lib/api.js'
import { pushToast } from '../lib/ui.js'
import { ACCOUNT_TABS, route } from '../lib/router.js'
import { longDateISO, money } from '../lib/format.js'

/*
 * One account, one page.
 *
 * The tabs used to swap the page body, which hid five sixths of the account
 * behind a click and made the hash the only way to know what existed. They are a
 * section nav now: everything is on the page in order and a tab scrolls to its
 * section, with the strip sticking under the top bar and the current section
 * following the scroll. The hash still names the section
 * (`#account/412907/trades`), so links from the sidebar, an alert or another
 * trader's clipboard land in the same place they always did — they just scroll
 * there instead of swapping the document.
 */
/*
 * The order is how a trader reads the account, not how the reference listed it:
 * what is live, what is required, what I traded and when, then the deep dive.
 * The Score section is gone — its gauge was an invented composite drawn in a
 * card three quarters empty — and the two figures it carried that this page did
 * not already show (consistency, recovery factor) now sit in Overview's
 * trade-quality row, so nothing was lost with the section.
 */
const SECTIONS = [
  { key: 'overview', label: 'Overview', note: 'Performance, the metrics that matter and what is live right now' },
  { key: 'rules', label: 'Objectives', note: 'The objectives this account is measured against' },
  { key: 'trades', label: 'Trades', note: 'Open positions and every closed trade' },
  { key: 'calendar', label: 'Calendar', note: 'The month as bars, then every session newest first' },
  { key: 'analytics', label: 'Analysis', note: 'Where the edge is and where it leaks' },
]

const detail = computed(() => accountByNumber(route.number))
const active = ref(ACCOUNT_TABS.includes(route.tab) ? route.tab : 'overview')

/*
 * Section elements are looked up by id, not collected through template refs.
 * The ref callbacks were being recreated on every render, so Vue called the old
 * ones with `null` and the map emptied itself mid-scroll — the jumps then quietly
 * targeted the wrong section, or nothing. The ids are static and unique, so
 * asking the document is both simpler and correct.
 */
const elFor = (key) => document.getElementById(`acc-${key}`)

/* The strip is sticky under the top bar, so a section is "current" once its head
   passes that line rather than the top of the window. */
const stickOffset = () => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')
  return (Number.parseInt(raw, 10) || 68) + 60
}

/* A click animates the scroll; the observer must not fight it while it runs. */
let gliding = false
let glideTimer = 0

function go(key, { smooth = true } = {}) {
  active.value = key
  const hash = `#account/${route.number}${key === 'overview' ? '' : `/${key}`}`
  history.replaceState(null, '', `${location.pathname}${hash}`)

  const el = elFor(key)
  if (!el) return

  /* An instant jump needs no guard — only a smooth one, where the observer would
     otherwise overtake the animation and flip the tab mid-glide. */
  if (!smooth) {
    el.scrollIntoView({ behavior: 'instant', block: 'start' })
    return
  }

  gliding = true
  window.clearTimeout(glideTimer)
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  glideTimer = window.setTimeout(() => { gliding = false }, 700)
}

/* Reading the scroll position is steadier than an IntersectionObserver here:
   sections differ wildly in height, so "the one whose head is above the line"
   is the rule a reader would use. */
function readScroll() {
  if (gliding) return
  const line = stickOffset()
  let current = SECTIONS[0].key
  SECTIONS.forEach(({ key }) => {
    const el = elFor(key)
    if (el && el.getBoundingClientRect().top <= line) current = key
  })
  if (current === active.value) return
  active.value = current
  history.replaceState(
    null,
    '',
    `${location.pathname}#account/${route.number}${current === 'overview' ? '' : `/${current}`}`,
  )
}

let ticking = false
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => { ticking = false; readScroll() })
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  await nextTick()
  /*
   * A deep link arrives on a section. That jump is instant — animating a long
   * scroll the reader did not ask for just makes the page feel slow — but the
   * sections below the fold grow a frame or two after mount as their charts and
   * tables lay out, which moves the target back down. So land, then land again
   * once the page has stopped changing height.
   */
  if (active.value !== 'overview') {
    const target = active.value
    await nextTick()
    land(target, readScroll)
  } else {
    readScroll()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.clearTimeout(glideTimer)
})

/*
 * Land on a section and stay landed.
 *
 * Everything mounts at once, and the heavy blocks below the fold (the trades
 * table, the ticket tables, the charts) lay out late — so a jump made on mount
 * is short by however much the page grew behind it afterwards. Rather than guess
 * a delay, watch the document height: re-aim whenever it changes, and stop once
 * it has held still for a moment. That lands on the right section whatever the
 * layout happens to be doing.
 */
function land(target, onDone) {
  /* `scrollIntoView` is the one thing that works whatever the scroller is — the
     page's own scroller is not the window here — and the section's
     `scroll-margin-top` keeps the sticky bar clear of its heading. */
  /* 'instant' matters: app.css sets `scroll-behavior: smooth` on html, so a jump
     without an explicit behaviour animates — and re-aiming restarts the
     animation, which means it never finishes arriving. */
  const aim = () => elFor(target)?.scrollIntoView({ behavior: 'instant', block: 'start' })

  aim()
  /* The scroll height is the honest signal that layout is finished — a
     ResizeObserver on body did not fire for these growths. Aim again on every
     change, and stop once the height has held still for about half a second. */
  let lastHeight = 0
  let stable = 0
  const deadline = Date.now() + 6000
  const tick = window.setInterval(() => {
    const height = document.documentElement.scrollHeight
    if (height !== lastHeight) {
      lastHeight = height
      stable = 0
      aim()
    } else {
      stable += 1
    }
    /* A section below can finish laying out well after the first quiet moment,
       so hold on for a second of stillness rather than a few frames. */
    if (stable > 20 || Date.now() > deadline) {
      window.clearInterval(tick)
      aim()
      onDone?.()
    }
  }, 60)
}

/* The sidebar and the alerts link by hash, which changes the route underneath
   us — follow it to the section rather than swapping the body. */
watch(() => route.tab, (next) => {
  if (!ACCOUNT_TABS.includes(next) || next === active.value) return
  nextTick(() => go(next))
})

/* ------------------------------------------------------------- live data */

const isActive = computed(() => detail.value && detail.value.id === account.activeId)
const kind = computed(() => (detail.value?.status === 'funded' ? 'Funded' : 'Evaluation'))
const phase = computed(() => detail.value?.phase.split(' · ')[0] || '')

function makeActive() {
  setActiveAccount(detail.value.id)
}

/* The API detail (trades, rules snapshot, violations, validation status)
   loads per account id; the trades also feed the tabs below through the
   store's registry, so every section reads the same server data. */
const apiDetail = computed(() => (detail.value ? accountDetails.byId[detail.value.id] || null : null))

watch(() => detail.value?.id, (id) => {
  if (!id) return
  loadAccountDetail(id).catch((err) => {
    pushToast({ tone: 'bad', title: 'Could not load the account', msg: err?.message || 'Please try again.' })
  })
}, { immediate: true })

/* ---------------------------------------------------------- credentials */

const credsOpen = ref(false)
const credsLoading = ref(false)
const credsError = ref('')
const creds = ref(null)
const credsShown = ref(false)

async function credentials() {
  if (!detail.value) return
  credsOpen.value = true
  credsLoading.value = true
  credsError.value = ''
  creds.value = null
  credsShown.value = false
  try {
    creds.value = await fetchCredentials(detail.value.id)
  } catch (err) {
    /* Rate limit (429), nothing-stored (404) and auth errors all surface
       with the server's own message. */
    credsError.value = err?.message || 'Could not reveal the credentials. Please try again.'
  } finally {
    credsLoading.value = false
  }
}

function refresh() {
  if (!detail.value) return
  pushToast({ tone: 'info', title: 'Refreshing account', msg: 'Re-reading trades, equity and status from the CRM.' })
  reloadAccountDetail(detail.value.id)
    .catch((err) => pushToast({ tone: 'bad', title: 'Refresh failed', msg: err?.message || 'Please try again.' }))
}
</script>

<template>
  <div class="ov" data-od-id="account-detail">
    <!-- The back link belongs with the header, not on the 34px zone rhythm. -->
    <div class="ov__zone">
      <a class="acc-back" href="#accounts">
        <AppIcon name="chevronLeft" :size="15" />All accounts
      </a>

      <section v-if="detail" class="panel acc-head">
        <div class="acc-head__top">
          <button
            type="button"
            class="row-btn"
            :class="{ 'is-on': isFavorite(detail.id) }"
            :aria-pressed="isFavorite(detail.id)"
            :aria-label="`${isFavorite(detail.id) ? 'Remove' : 'Add'} account ${detail.number} ${isFavorite(detail.id) ? 'from' : 'to'} favorites`"
            @click="toggleFavorite(detail)"
          >
            <AppIcon name="star" :size="17" />
          </button>

          <h1 class="acc-title">Account #{{ detail.number }}</h1>
          <span class="acc-status" :class="`acc-status--${detail.status}`">{{ detail.status }}</span>
          <span
            v-if="apiDetail && apiDetail.validationStatus && apiDetail.validationStatus !== detail.status"
            class="acc-status"
            :title="'The platform’s live validation state for this account'"
          >{{ apiDetail.validationStatus }}</span>

          <div class="acc-head__actions">
            <button type="button" class="btn btn--ghost btn--sm" @click="credentials">
              <AppIcon name="lock" :size="15" />Credentials
            </button>
            <button type="button" class="btn btn--ghost btn--sm" @click="refresh">
              <AppIcon name="download" :size="15" />Refresh
            </button>
            <span v-if="isActive" class="badge badge--active"><span class="badge__dot"></span>active account</span>
            <button v-else type="button" class="btn btn--ghost btn--sm" @click="makeActive">
              <AppIcon name="check" :size="15" />Make active
            </button>
          </div>
        </div>

        <p class="acc-meta">
          <span>{{ detail.label }}</span>
          <span class="acc-meta__sep">|</span>
          <span>{{ kind }} · {{ phase }}</span>
          <span class="acc-meta__sep">|</span>
          <span>{{ money(detail.size) }}</span>
          <span class="acc-meta__sep">|</span>
          <span>{{ detail.platform }}</span>
          <span class="acc-meta__sep">|</span>
          <span>{{ longDateISO(detail.started) }}</span>
        </p>
      </section>
    </div>

    <div v-if="detail" class="acc-body">
    <!-- Section nav: sticks under the top bar and follows the scroll. -->
    <nav class="tabs acc-tabs" aria-label="Account sections">
      <button
        v-for="s in SECTIONS"
        :key="s.key"
        type="button"
        class="tab"
        :class="{ 'is-current': active === s.key }"
        :aria-current="active === s.key ? 'true' : undefined"
        :data-od-id="`account-tab-${s.key}`"
        @click="go(s.key)"
      >{{ s.label }}</button>

      <span class="acc-tabs__pos">{{ SECTIONS.findIndex((s) => s.key === active) + 1 }} / {{ SECTIONS.length }}</span>
    </nav>

      <section id="acc-overview" class="acc-section" data-od-id="account-section-overview">
        <div class="acc-section__head">
          <h2 class="acc-section__title">{{ SECTIONS[0].label }}</h2>
          <span class="acc-section__note">{{ SECTIONS[0].note }}</span>
        </div>
        <OverviewTab :account="detail" @challenge="openChallenge()" />
      </section>

      <section id="acc-rules" class="acc-section" data-od-id="account-section-objectives">
        <div class="acc-section__head">
          <h2 class="acc-section__title">{{ SECTIONS[1].label }}</h2>
          <span class="acc-section__note">{{ SECTIONS[1].note }}</span>
        </div>
        <RulesTab :account="detail" />

        <!-- The CRM's frozen rules snapshot + the risk engine's violations.
             Both arrive with the account detail; absent, the section stays
             empty rather than guessing. -->
        <template v-if="apiDetail && (apiDetail.rulesSummary.length || apiDetail.violations.length)">
          <div class="acc-section__head" style="margin-top:26px">
            <h3 class="acc-section__title" style="font-size:15px">Rules snapshot</h3>
            <span class="acc-section__note">Frozen when the account was provisioned; staff overrides merged in</span>
          </div>
          <section class="panel" style="margin-top:10px">
            <div class="panel__body">
              <ul v-if="apiDetail.rulesSummary.length" class="stg-rules" style="margin:0 0 6px">
                <li v-for="line in apiDetail.rulesSummary" :key="line" class="is-ok">
                  <AppIcon name="check" :size="15" />{{ line }}
                </li>
              </ul>
              <span v-else class="dim" style="font-size:13px">No rules snapshot has been recorded for this account yet.</span>

              <template v-if="apiDetail.violations.length">
                <div class="panel__head" style="margin-top:16px">
                  <span class="panel__title">Rule violations</span>
                  <span class="panel__actions">
                    <span class="badge badge--rejected"><span class="badge__dot" />{{ apiDetail.violations.length }}</span>
                  </span>
                </div>
                <div class="table-wrap">
                  <table class="data" style="min-width:560px">
                    <thead>
                      <tr><th>Rule</th><th>Action</th><th>Ticket</th><th>Detail</th><th>When</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(v, i) in apiDetail.violations" :key="`${v.rule}-${v.at}-${i}`">
                        <td class="cell-strong">{{ v.rule }}</td>
                        <td>{{ v.action }}</td>
                        <td class="mono-id">{{ v.ticket || '—' }}</td>
                        <td class="dim">{{ v.detail }}</td>
                        <td class="dim">{{ longDateISO(String(v.at).slice(0, 10)) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </div>
          </section>
        </template>
      </section>

      <section id="acc-trades" class="acc-section" data-od-id="account-section-trades">
        <div class="acc-section__head">
          <h2 class="acc-section__title">{{ SECTIONS[2].label }}</h2>
          <span class="acc-section__note">{{ SECTIONS[2].note }}</span>
        </div>
        <TradesTab :account="detail" />
      </section>

      <section id="acc-calendar" class="acc-section" data-od-id="account-section-calendar">
        <div class="acc-section__head">
          <h2 class="acc-section__title">{{ SECTIONS[3].label }}</h2>
          <span class="acc-section__note">{{ SECTIONS[3].note }}</span>
        </div>
        <CalendarPanel :account="detail" />
      </section>

      <section id="acc-analytics" class="acc-section" data-od-id="account-section-analytics">
        <div class="acc-section__head">
          <h2 class="acc-section__title">{{ SECTIONS[4].label }}</h2>
          <span class="acc-section__note">{{ SECTIONS[4].note }}</span>
        </div>
        <AnalyticsTab :account="detail" />
      </section>
    </div>

    <section v-else class="panel stat-card">
      <span class="stat-card__value stat-card__value--sm">Account not found</span>
      <p class="stat-card__foot">
        No account carries that number. Pick one from
        <a href="#accounts" style="color:var(--violet-text)">All accounts</a>.
      </p>
    </section>

    <!-- Platform credentials: decrypted server-side on demand (rate-limited:
         10 reveals an hour — the server's message shows in the modal). -->
    <ModalDialog
      v-if="credsOpen"
      title="Platform credentials"
      :subtitle="detail ? `${detail.platform} · account ${detail.number}` : ''"
      @close="credsOpen = false"
    >
      <p v-if="credsLoading" class="dim" style="padding:8px 0">Decrypting…</p>

      <template v-else-if="creds">
        <div class="kv">
          <div class="kv__row"><span class="kv__k">Platform</span><span class="kv__v">{{ creds.platform }}</span></div>
          <div class="kv__row"><span class="kv__k">Login</span><span class="kv__v mono">{{ creds.login || '—' }}</span></div>
          <div class="kv__row"><span class="kv__k">Server</span><span class="kv__v mono">{{ creds.server || '—' }}</span></div>
          <div class="kv__row">
            <span class="kv__k">Password</span>
            <span class="kv__v mono" style="display:flex;gap:8px;align-items:center">
              {{ credsShown ? (creds.password || '—') : '••••••••••' }}
              <button
                type="button"
                class="btn btn--ghost btn--sm"
                :aria-label="credsShown ? 'Hide password' : 'Show password'"
                @click="credsShown = !credsShown"
              >{{ credsShown ? 'Hide' : 'Show' }}</button>
            </span>
          </div>
        </div>
        <div class="callout">
          <AppIcon name="shield" :size="17" />
          <div>Every reveal is rate-limited and written to the audit log. Never share these on socials or in the room.</div>
        </div>
      </template>

      <p v-else class="stat-card__foot" role="alert">{{ credsError }}</p>

      <template #actions>
        <button class="btn btn--ghost" @click="credsOpen = false">Close</button>
        <button
          v-if="creds?.password"
          class="btn btn--secondary"
          @click="copyText(creds.password, 'Password copied')"
        >Copy password</button>
      </template>
    </ModalDialog>
  </div>
</template>
