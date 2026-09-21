<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import {
  dismissNotification, isNotifRead, openNotifications, visibleNotifications,
} from '../../lib/portal.js'
import { accountHref } from '../../lib/router.js'

/* The page shows the newest three; the drawer owns the full list and the
   category filters. Dismissing here still clears the bell count. */
const PREVIEW = 3

const rows = computed(() => visibleNotifications.value.slice(0, PREVIEW))
const hiddenCount = computed(() => Math.max(0, visibleNotifications.value.length - PREVIEW))
const isNew = (n) => !isNotifRead(n)
</script>

<template>
  <section class="panel" data-od-id="overview-alerts">
    <div class="panel__head">
      <span class="panel__title">Alerts</span>
      <div class="panel__actions">
        <button type="button" class="btn btn--ghost btn--sm" @click="openNotifications()">
          <AppIcon name="bell" :size="15" />Open all
        </button>
      </div>
    </div>

    <div>
      <article
        v-for="n in rows"
        :key="n.id"
        class="alert"
        :data-tone="n.tone"
        :data-od-id="`overview-alert-${n.id}`"
      >
        <span class="alert__icon"><AppIcon :name="n.icon" :size="18" /></span>
        <div class="alert__body">
          <h3 class="alert__title">
            <a v-if="n.account" :href="accountHref(n.account)">{{ n.title }}</a>
            <template v-else>{{ n.title }}</template>
            <span v-if="isNew(n)" class="notif__chip">New</span>
          </h3>
          <p class="alert__msg">{{ n.msg }}</p>
          <span class="alert__time">{{ n.time }}</span>
        </div>
        <button
          type="button"
          class="alert__dismiss"
          :aria-label="`Dismiss ${n.title}`"
          @click="dismissNotification(n)"
        >
          <AppIcon name="close" :size="15" />
        </button>
      </article>

      <p v-if="!rows.length" class="alert__msg" style="padding:18px">
        No alerts here right now.
      </p>
    </div>

    <div v-if="hiddenCount" class="panel__foot">
      <button type="button" class="btn btn--ghost btn--sm" @click="openNotifications()">
        <AppIcon name="bell" :size="15" />{{ hiddenCount }} more in notifications
      </button>
    </div>
  </section>
</template>
