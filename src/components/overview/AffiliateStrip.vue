<script setup>
import AppIcon from '../AppIcon.vue'

/* Not joined yet, so this is a strip — one line, one action, no band. The
   numbers are genuinely zero because the affiliate account was never opened. */
</script>

<template>
  <section class="aff" data-od-id="overview-affiliate">
    <span class="aff__icon" aria-hidden="true"><AppIcon name="lock" :size="18" /></span>
    <div style="min-width:0">
      <h3 class="aff__title">Affiliate program</h3>
      <p class="aff__sub">Not joined yet — refer traders and earn commission on every evaluation they pass. Total earned to date: $0.00.</p>
    </div>
    <div class="aff__actions">
      <a class="btn btn--ghost btn--sm" href="#affiliates">
        <AppIcon name="link2" :size="15" />Join the program
      </a>
    </div>
  </section>
</template>
