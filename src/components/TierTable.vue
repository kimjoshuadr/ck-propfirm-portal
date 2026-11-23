<script setup>
import { TIERS } from '../data/affiliates.js'
</script>

<template>
  <section class="card card--flush">
    <div class="card__head">
      <div>
        <h3>Commission tiers <span class="demo-badge">Demo data</span></h3>
        <div class="dim" style="font-size:12.5px;margin-top:3px">
          Tier is set by how many referred accounts are funded, and is reviewed every cycle.
        </div>
      </div>
      <div class="card__actions">
        <span class="badge badge--violet"><span class="badge__dot"></span>you are Silver</span>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data" style="min-width:620px">
        <thead>
          <tr>
            <th>Tier</th>
            <th class="num">Funded referrals</th>
            <th class="num">Per funded account</th>
            <th class="num">Revenue share</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in TIERS" :key="t.tier" :class="{ 'is-highlight': t.current }">
            <td class="cell-strong">{{ t.tier }}</td>
            <td class="num">{{ t.range }}</td>
            <td class="num">${{ t.perFunded }}</td>
            <td class="num">{{ t.share }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
