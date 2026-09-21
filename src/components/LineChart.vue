<script setup>
import { computed } from 'vue'

/*
 * Sparkline / area chart. Values are plotted as given — no smoothing magic on
 * the numbers, only a light Catmull-Rom curve between the real points — and the
 * area fill encodes the same series, so the shape and the number agree.
 */
const props = defineProps({
  values: { type: Array, required: true },
  tone: { type: String, default: 'violet' },   // violet | green | red
  viewBoxHeight: { type: Number, default: 100 },
  baseline: { type: Number, default: null },   // dashed reference line
  /* [min, max] to plot against a caller's own scale — the account chart needs
     its level tags to land on exactly the same range as the curve. */
  domain: { type: Array, default: null },
  pad: { type: Number, default: 6 },
  uid: { type: String, required: true },
})

const W = 600
const PAD = computed(() => props.pad)

const bounds = computed(() => {
  if (props.domain) return [props.domain[0], props.domain[1]]
  const vs = props.values.length > 1 ? props.values : [0, 0]
  return [
    Math.min(...vs, props.baseline ?? Infinity),
    Math.max(...vs, props.baseline ?? -Infinity),
  ]
})

const scale = computed(() => {
  const vs = props.values.length > 1 ? props.values : [0, 0]
  const [min, max] = bounds.value
  const span = max - min || 1
  const pad = PAD.value
  const stepX = (W - pad * 2) / Math.max(vs.length - 1, 1)
  const h = props.viewBoxHeight
  return vs.map((v, i) => [pad + i * stepX, h - pad - ((v - min) / span) * (h - pad * 2)])
})

/* Catmull-Rom → cubic bezier, tension 1/6 of the segment. */
const line = computed(() => {
  const p = scale.value
  if (p.length < 2) return ''
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`
  for (let i = 0; i < p.length - 1; i += 1) {
    const p0 = p[i - 1] || p[i]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
})

const area = computed(() => {
  const h = props.viewBoxHeight
  const pad = PAD.value
  return `${line.value} L${W - pad} ${h} L${pad} ${h} Z`
})

const baselineY = computed(() => {
  if (props.baseline == null) return null
  const [min, max] = bounds.value
  const span = max - min || 1
  const h = props.viewBoxHeight
  const pad = PAD.value
  return h - pad - ((props.baseline - min) / span) * (h - pad * 2)
})
</script>

<template>
  <div class="chart" :class="`chart--${tone}`">
    <svg :viewBox="`0 0 ${W} ${viewBoxHeight}`" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient :id="`grad-${uid}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="currentColor" stop-opacity="0.34" />
          <stop offset="1" stop-color="currentColor" stop-opacity="0" />
        </linearGradient>
      </defs>
      <line
        v-if="baselineY !== null"
        :x1="PAD" :x2="W - PAD" :y1="baselineY" :y2="baselineY"
        stroke="currentColor" stroke-opacity="0.4" stroke-width="1"
        stroke-dasharray="5 5" vector-effect="non-scaling-stroke"
      />
      <path :d="area" :fill="`url(#grad-${uid})`" stroke="none" />
      <path
        :d="line" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"
      />
    </svg>
  </div>
</template>
