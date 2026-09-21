<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { USER } from '../data/portal.js'
import { longDate } from '../lib/format.js'
import { accountHref } from '../lib/router.js'
import {
  ACCOUNTS, REGIONS, account, activeRegion, isNotifRead, markAllNotifRead, region,
  setActiveAccount, setRegion, shell, toggleSidebar, unreadCount, visibleNotifications,
} from '../lib/portal.js'

const emit = defineEmits(['palette'])

/* One open panel at a time: 'region' | 'avatar' | null. The notification
   drawer is a separate, full-height layer rather than a dropdown, and its
   open state lives in the store so the Overview can open it too. */
const open = ref(null)
const notifOpen = computed({
  get: () => shell.notifDrawer,
  set: (v) => { shell.notifDrawer = v },
})

/* The drawer owns the full list, so the category filters live here. */
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'risk', label: 'Risk' },
  { key: 'payout', label: 'Payout' },
  { key: 'info', label: 'Info' },
]
const notifFilter = ref('all')
const notifRows = computed(() => (notifFilter.value === 'all'
  ? visibleNotifications.value
  : visibleNotifications.value.filter((n) => n.category === notifFilter.value)))
const countFor = (key) => (key === 'all'
  ? visibleNotifications.value.length
  : visibleNotifications.value.filter((n) => n.category === key).length)

/* The avatar panel has two views: identity + links, and the account switcher. */
const userView = ref('main')

const closeNotifBtn = ref(null)
const today = longDate()

const statusIcon = (status) =>
  status === 'breached' ? 'alert' : status === 'funded' ? 'check' : 'target'

function toggle(key) {
  open.value = open.value === key ? null : key
  notifOpen.value = false
  if (key === 'avatar') userView.value = 'main'
}

function close() {
  open.value = null
}

function openNotifications() {
  open.value = null
  notifOpen.value = true
  nextTick(() => closeNotifBtn.value?.focus())
}

function pickAccount(id) {
  setActiveAccount(id)
  close()
}

function pickRegion(code) {
  setRegion(code)
  close()
}

/* Navigating from the menu has to close it: `location.href` alone left the
   panel sitting open over the page it had just opened. */
function go(href) {
  close()
  if (href.startsWith('#')) window.location.hash = href
  else window.location.href = href
}

function onKeydown(event) {
  if (event.key === 'Escape' && notifOpen.value) notifOpen.value = false
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="topbar" data-od-id="topbar">
    <button class="topbar__menu" aria-label="Open navigation" @click="toggleSidebar">
      <AppIcon name="menu" :size="19" />
    </button>

    <div class="topbar__spacer"></div>

    <div class="topbar__date" data-od-id="topbar-date">
      <AppIcon name="calendar" :size="16" />
      <span>{{ today }}</span>
    </div>

    <button
      type="button"
      class="search-field"
      data-od-id="topbar-search"
      aria-label="Search — open the command palette"
      aria-haspopup="dialog"
      @click="emit('palette')"
    >
      <AppIcon name="search" :size="17" />
      <span class="search-field__hint">Search accounts, tools…</span>
      <kbd>⌘K</kbd>
    </button>

    <button
      class="icon-btn"
      data-od-id="topbar-notifications"
      :aria-label="unreadCount ? `Notifications — ${unreadCount} unread` : 'Notifications — nothing unread'"
      aria-haspopup="dialog"
      aria-controls="notifDrawer"
      :aria-expanded="notifOpen"
      @click="openNotifications"
    >
      <AppIcon name="bell" :size="18" />
      <span v-if="unreadCount" class="icon-btn__badge">{{ unreadCount }}</span>
    </button>

    <div class="menu-host" v-click-outside="close">
      <button
        class="icon-btn"
        data-od-id="topbar-region"
        :aria-label="`Region and language — ${activeRegion.label}`"
        aria-haspopup="true"
        :aria-expanded="open === 'region'"
        @click="toggle('region')"
      >
        <AppIcon name="globe" :size="18" />
      </button>

      <div v-if="open === 'region'" class="menu menu--tall" style="min-width:272px">
        <div class="menu__label">Region &amp; language</div>
        <button
          v-for="r in REGIONS"
          :key="r.code"
          class="menu__item"
          :class="{ 'is-selected': r.code === region.code }"
          @click="pickRegion(r.code)"
        >
          <AppIcon name="globe" :size="16" />
          <span style="min-width:0">
            <span style="display:block;font-weight:600">{{ r.label }}</span>
            <span style="display:block;font-size:11.5px;color:var(--muted)">{{ r.note }}</span>
          </span>
          <span v-if="r.code === region.code" class="menu__check"><AppIcon name="check" :size="15" /></span>
        </button>
      </div>
    </div>

    <div class="menu-host" v-click-outside="close">
      <button
        class="avatar avatar-btn"
        data-od-id="topbar-avatar"
        aria-label="Profile and active account"
        aria-haspopup="true"
        :aria-expanded="open === 'avatar'"
        @click="toggle('avatar')"
      >
        {{ USER.initials }}
      </button>

      <div v-if="open === 'avatar'" class="menu" style="min-width:320px">
        <template v-if="userView === 'main'">
          <div class="user-menu__id">
            <span class="user-menu__avatar">{{ USER.initials }}</span>
            <span style="min-width:0">
              <span class="user-menu__name">{{ USER.name }}</span>
              <span class="user-menu__mail">{{ USER.email }}</span>
            </span>
          </div>
          <div class="menu__sep"></div>
          <button class="menu__item" @click="go('#settings')">
            <AppIcon name="settings" :size="16" />Settings
          </button>
          <button class="menu__item" @click="go('#manage/billing')">
            <AppIcon name="wallet" :size="16" />Billing
          </button>
          <button class="menu__item" @click="go('#learn')">
            <AppIcon name="book" :size="16" />FPT Learn
          </button>
          <button class="menu__item" @click="go('#help/support')">
            <AppIcon name="headset" :size="16" />Support
          </button>
          <div class="menu__sep"></div>
          <button class="menu__item" @click="userView = 'accounts'">
            <AppIcon name="accounts" :size="16" />Your accounts
            <span class="menu__chevron"><AppIcon name="chevronRight" :size="15" /></span>
          </button>
          <div class="menu__sep"></div>
          <div class="menu__foot">
            <button class="btn btn--ghost menu__logout" @click="go('#login')">
              <AppIcon name="logout" :size="16" />Logout
            </button>
          </div>
        </template>

        <template v-else>
          <button class="menu__item menu__back" @click="userView = 'main'">
            <AppIcon name="chevronLeft" :size="16" />Your accounts
          </button>
          <div class="menu__label">Switch active account</div>
          <div v-for="a in ACCOUNTS" :key="a.id" class="menu__row">
            <button
              type="button"
              class="menu__item"
              :class="{ 'is-selected': a.id === account.activeId }"
              @click="pickAccount(a.id)"
            >
              <AppIcon :name="statusIcon(a.status)" :size="16" />
              <span style="min-width:0">
                <span style="display:block;font-weight:600">{{ a.label }}</span>
                <span style="display:block;font-size:11.5px;color:var(--muted)">Account {{ a.number }} · {{ a.phase }}</span>
              </span>
              <span v-if="a.id === account.activeId" class="menu__check"><AppIcon name="check" :size="15" /></span>
            </button>
            <a
              class="menu__open"
              :href="accountHref(a.number)"
              :aria-label="`Open account ${a.number}`"
              @click="close()"
            ><AppIcon name="chevronRight" :size="15" /></a>
          </div>
          <div class="menu__sep"></div>
          <button class="menu__item" @click="go('#accounts')">
            <AppIcon name="accounts" :size="16" />All accounts
          </button>
        </template>
      </div>
    </div>
  </header>

  <div
    class="scrim scrim--drawer"
    :class="{ 'is-on': notifOpen }"
    @click="notifOpen = false"
  />

  <aside
    id="notifDrawer"
    class="notif-drawer"
    :class="{ 'is-on': notifOpen }"
    role="dialog"
    aria-modal="true"
    aria-label="Notifications"
    data-od-id="notifications-drawer"
  >
    <header class="notif-panel__head">
      <h3>Notifications</h3>
      <button
        class="btn btn--ghost btn--sm"
        data-od-id="notif-mark-read"
        @click="markAllNotifRead()"
      >Mark all as read</button>
      <button
        ref="closeNotifBtn"
        class="icon-btn"
        data-od-id="notif-close"
        aria-label="Close notifications"
        @click="notifOpen = false"
      >
        <AppIcon name="close" :size="16" />
      </button>
    </header>

    <div class="notif-filters">
      <div class="seg" role="tablist" aria-label="Notification category">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          type="button"
          class="seg__btn"
          :class="{ 'is-on': notifFilter === f.key }"
          role="tab"
          :aria-selected="notifFilter === f.key"
          :disabled="countFor(f.key) === 0"
          @click="notifFilter = f.key"
        >{{ f.label }}</button>
      </div>
    </div>

    <div class="notif-list">
      <article
        v-for="n in notifRows"
        :key="n.id"
        class="notif"
        :class="{ 'is-read': isNotifRead(n) }"
        :data-tone="n.tone"
        :data-od-id="`notif-${n.id}`"
      >
        <span class="notif__rule" aria-hidden="true"></span>
        <div class="notif__body">
          <div class="notif__top">
            <span class="notif__icon"><AppIcon :name="n.icon" :size="17" /></span>
            <span class="notif__title">{{ n.title }}</span>
            <span v-if="!isNotifRead(n)" class="notif__chip">New</span>
          </div>
          <p class="notif__msg" :title="n.msg">{{ n.msg }}</p>
          <span class="notif__time">{{ n.time }}</span>
        </div>
      </article>

      <p v-if="!notifRows.length" class="notif__msg" style="padding:6px 2px">
        Nothing in this category right now.
      </p>
    </div>
  </aside>
</template>
