<script setup>
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { REFERRALS, STATUS_BADGE } from '../data/affiliates.js'

const query = ref('')
const sortKey = ref('joined')
const sortDir = ref('desc')

const columns = [
  { key: 'trader', label: 'Trader' },
  { key: 'country', label: 'Country' },
  { key: 'joined', label: 'Joined' },
  { key: 'status', label: 'Status' },
  { key: 'commission', label: 'Commission', num: true },
]

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  const filtered = REFERRALS.filter((r) =>
    !q || `${r.trader} ${r.status}`.toLowerCase().includes(q))
  return [...filtered].sort((a, b) => {
    const va = a[sortKey.value]
    const vb = b[sortKey.value]
    if (va === vb) return 0
    return (va > vb ? 1 : -1) * (sortDir.value === 'asc' ? 1 : -1)
  })
})

function sortBy(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const ariaSort = (key) =>
  sortKey.value === key ? (sortDir.value === 'asc' ? 'ascending' : 'descending') : null

const badgeFor = (status) => STATUS_BADGE[status] || STATUS_BADGE.evaluating
</script>

<template>
  <section class="card card--flush">
    <div class="card__head">
      <div>
        <h3>Recent referrals</h3>
        <div class="dim" style="font-size:12.5px;margin-top:3px">
          Commission is released when a referred account funds — not when it is created.
        </div>
      </div>
      <div class="card__actions">
        <label class="sr" for="refFilter">Filter referrals</label>
        <input
          id="refFilter"
          v-model="query"
          class="input search-input"
          placeholder="Filter by trader or status"
          style="min-height:34px;font-size:13px"
        />
      </div>
    </div>

    <div class="table-wrap">
      <table class="data" style="min-width:640px">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="{ num: col.num }"
              :aria-sort="ariaSort(col.key)"
            >
              <button type="button" class="th-btn" @click="sortBy(col.key)">
                {{ col.label }}
                <AppIcon v-if="sortKey === col.key" :name="sortDir === 'asc' ? 'arrowUp' : 'arrowDown'" :size="12" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.trader">
            <td class="cell-strong">{{ r.trader }}</td>
            <td>{{ r.country }}</td>
            <td>{{ r.joinedLabel }}</td>
            <td>
              <span class="badge" :class="badgeFor(r.status).cls">
                <span class="badge__dot"></span>{{ badgeFor(r.status).label }}
              </span>
            </td>
            <td class="num">
              <span v-if="r.commission > 0" class="up">${{ r.commission }}</span>
              <span v-else class="dim">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="rows.length === 0" class="empty">
      <strong>No referrals match</strong>Clear the filter to see every trader you referred.
    </div>
  </section>
</template>
