import { onBeforeUnmount, ref } from 'vue'

/* A ticking clock for the counters that move on their own — the daily-loss
   reset and time-since-first-trade both read from this one ref per consumer. */
export function useNow(intervalMs = 1000) {
  const now = ref(new Date())
  const id = setInterval(() => { now.value = new Date() }, intervalMs)
  onBeforeUnmount(() => clearInterval(id))
  return now
}

/* Countdown to the next midnight UTC, zero-padded for a mono readout. */
export function untilUtcMidnight(now) {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  const left = Math.max(0, end - now.getTime())
  const s = Math.floor(left / 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return { h: pad(Math.floor(s / 3600)), m: pad(Math.floor((s % 3600) / 60)), s: pad(s % 60) }
}

/* Days / hours / minutes / seconds since a date, for the elapsed readout. */
export function elapsedSince(iso, now) {
  const from = new Date(`${iso}T09:30:00Z`).getTime()
  const s = Math.max(0, Math.floor((now.getTime() - from) / 1000))
  const pad = (n) => String(n).padStart(2, '0')
  return {
    days: Math.floor(s / 86400),
    hours: pad(Math.floor((s % 86400) / 3600)),
    minutes: pad(Math.floor((s % 3600) / 60)),
    seconds: pad(s % 60),
  }
}

/* "2h 4m" — hold times. */
export const duration = (min) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`)
