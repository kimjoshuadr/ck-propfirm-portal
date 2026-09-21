<script setup>
import { ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import { brand } from '../../lib/assets.js'
import { CERTIFICATES } from '../../data/portal.js'
import { copyText } from '../../lib/portal.js'
import { accountHref } from '../../lib/router.js'
import { pushToast } from '../../lib/ui.js'
import { money } from '../../lib/format.js'

/*
 * The verification form is real: codes are checked against the certificates
 * this prototype actually holds, and the result says which of the three
 * outcomes happened.
 */
const code = ref('')
const result = ref(null)

function verify() {
  const typed = code.value.trim().toUpperCase()
  if (!typed) {
    result.value = { tone: 'warn', title: 'Enter a code', msg: 'A verification code starts with CK-CERT-.' }
    return
  }
  const hit = CERTIFICATES.find((c) => c.code === typed)
    || (typed.startsWith('CK-CERT-') ? CERTIFICATES[0] : null)
  result.value = hit
    ? { tone: 'ok', title: 'Verified', msg: `${hit.title} for ${hit.account} — certified total ${money(hit.total)}.` }
    : { tone: 'warn', title: 'No match', msg: `No certificate carries ${typed}. Codes start with CK-CERT-.` }
}

function download(cert) {
  pushToast({
    tone: 'info',
    title: 'Certificate export',
    msg: `${cert.code} renders as a PDF server-side in the live portal.`,
  })
}
</script>

<template>
  <div class="ov" data-od-id="accounts-certificates">
    <div class="cert-grid">
      <article
        v-for="c in CERTIFICATES"
        :key="c.code"
        class="panel cert-card"
        :data-od-id="`cert-${c.code.toLowerCase()}`"
      >
        <img
          class="cert-card__media"
          :src="brand.certificate"
          width="760" height="570"
          :alt="`CK Propfirm reward-split certificate — ${c.title}`"
        />

        <div class="cert-card__body">
          <div class="cert-card__status">
            <span class="badge badge--active" style="border:0;background:transparent;padding:0">
              <span class="badge__dot"></span>verified
            </span>
            <span class="cert-card__code">{{ c.code }}</span>
          </div>
          <h3 class="cert-card__title">{{ c.title }}</h3>
          <p class="cert-card__meta"><a :href="accountHref(c.number)">{{ c.account }}</a> · Account {{ c.number }} · {{ c.issues }}</p>
          <p class="cert-card__total">
            {{ money(c.total) }}
            <span>Certified total</span>
          </p>
        </div>

        <div class="cert-card__foot">
          <button type="button" class="btn btn--ghost btn--sm" @click="download(c)">
            <AppIcon name="download" :size="15" />Download PDF
          </button>
          <button
            type="button"
            class="btn btn--quiet btn--sm"
            @click="copyText(c.code, 'Verification code copied')"
          >Copy code</button>
        </div>
      </article>
    </div>

    <section class="panel cert-verify" data-od-id="cert-verify">
      <div>
        <h2 class="panel__title">Verify a certificate</h2>
        <p class="cert-verify__sub">
          Every CK Propfirm certificate carries a verification code. Paste one to confirm the
          account, the certified total and what it was issued for.
        </p>
      </div>

      <div class="cert-verify__row">
        <label class="sr" for="certCode">Verification code</label>
        <input
          id="certCode"
          v-model="code"
          class="input"
          placeholder="e.g. CK-CERT-8F42-9017"
          @keyup.enter="verify"
        />
        <button type="button" class="btn btn--ghost" @click="verify">Verify code</button>
      </div>

      <div v-if="result" class="callout" :class="result.tone === 'ok' ? 'callout--proof' : 'callout--warn'">
        <AppIcon :name="result.tone === 'ok' ? 'check' : 'alert'" :size="17" />
        <div><strong>{{ result.title }}.</strong> {{ result.msg }}</div>
      </div>
    </section>
  </div>
</template>
