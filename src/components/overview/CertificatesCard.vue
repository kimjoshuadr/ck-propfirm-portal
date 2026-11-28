<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import { brand } from '../../lib/assets.js'
import { CERTIFICATES } from '../../lib/portal.js'
import { accountHref } from '../../lib/router.js'

const latest = computed(() => CERTIFICATES[0] || null)
</script>

<template>
  <section class="panel" data-od-id="overview-certificates">
    <div class="panel__head">
      <span class="panel__title">Latest certificate</span>
    </div>

    <div class="cert">
      <img
        class="cert__media"
        :src="brand.certificate"
        width="760" height="570"
        alt="CK Propfirm reward-split certificate, presented to a funded trader"
      />
      <p v-if="latest" class="cert__meta">
        <b>{{ latest.title }}</b>
        <span>· <a :href="accountHref(latest.number)">Account {{ latest.number }}</a> · {{ latest.issues }}</span>
      </p>
      <p v-else class="cert__meta">
        <b>No certificates yet</b>
        <span>Clearing an evaluation issues your first one.</span>
      </p>
    </div>

    <div class="panel__foot">
      <a class="btn btn--ghost btn--sm" href="#accounts/certificates">
        <AppIcon name="certificate" :size="15" />View all certificates
      </a>
    </div>
  </section>
</template>
