<script setup>
import { PROMO } from '../lib/portal.js'
import { brand } from '../lib/assets.js'
</script>

<template>
  <section class="card card--flush promo">
    <img :src="brand.promo" width="1600" height="689" alt="CK Propfirm limited-time promotion banner" />
    <div class="promo__body">
      <span class="badge badge--passed"><span class="badge__dot"></span>limited time</span>
      <h3>70% off your next challenge</h3>
      <span class="dim" style="font-size:12.5px">Use code <span class="mono">{{ PROMO.code }}</span> at checkout</span>
    </div>
  </section>
</template>
