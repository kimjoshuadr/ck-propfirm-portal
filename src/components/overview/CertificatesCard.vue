<script setup>
import AppIcon from '../AppIcon.vue'
import { brand } from '../../lib/assets.js'
import { CERTIFICATES } from '../../data/portal.js'
import { accountHref } from '../../lib/router.js'

const latest = CERTIFICATES[0]
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
      <p class="cert__meta">
        <b>{{ latest.title }}</b>
        <span>· <a :href="accountHref(latest.number)">Account {{ latest.number }}</a> · {{ latest.issues }}</span>
      </p>
    </div>

    <div class="panel__foot">
      <a class="btn btn--ghost btn--sm" href="#accounts/certificates">
        <AppIcon name="certificate" :size="15" />View all certificates
      </a>
    </div>
  </section>
</template>
