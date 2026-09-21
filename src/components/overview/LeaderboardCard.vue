<script setup>
import AppIcon from '../AppIcon.vue'
import { LEADERBOARD } from '../../data/portal.js'
import { initials, signedPct } from '../../lib/format.js'

const top = LEADERBOARD.filter((r) => r.rank <= 3)
</script>

<template>
  <section class="panel" data-od-id="overview-leaderboard">
    <div class="panel__head">
      <span class="panel__title">Trader leaderboard</span>
      <div class="panel__actions">
        <span class="floor__chip"><span class="badge__dot"></span>Live rankings</span>
      </div>
    </div>

    <div class="lb">
      <div
        v-for="r in top"
        :key="r.handle"
        class="lb__row"
        :class="{ 'is-lead': r.rank === 1 }"
        :data-od-id="`leaderboard-${r.rank}`"
      >
        <span class="lb__rank">{{ r.rank }}</span>
        <span class="lb__avatar">
          {{ initials(r.handle) }}
          <span v-if="r.rank === 1" class="lb__crown"><AppIcon name="crown" :size="16" /></span>
        </span>
        <span style="min-width:0">
          <span class="lb__name">{{ r.handle }}</span>
          <span class="lb__meta">{{ r.country }} · {{ r.account }} account · {{ r.streak }} weeks green</span>
        </span>
        <span class="lb__roi"><AppIcon name="arrowUp" :size="14" />{{ signedPct(r.roi, 1) }}</span>
      </div>
    </div>

    <div class="panel__foot">
      <a class="btn btn--ghost btn--sm" href="#community/leaderboard">
        <AppIcon name="trophy" :size="15" />View full leaderboard
      </a>
    </div>
  </section>
</template>
