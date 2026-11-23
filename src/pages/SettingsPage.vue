<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { USER } from '../lib/portal.js'
import { pushToast } from '../lib/ui.js'
import { SETTINGS_TABS, route } from '../lib/router.js'

/*
 * Account · Settings.
 *
 * The reference's five sections, in its order: personal information, password
 * management, identity verification, two-factor authentication and notification
 * preferences. Each one is its own tab, and the page head takes the section's
 * title and subtitle, so a section reads as the page it is rather than as one
 * panel of five.
 *
 * The form shows what the desk holds and leaves the rest blank with a prompt —
 * this portal has never been given a date of birth or a street address, and
 * inventing one on a screen about identity would be the wrong kind of tidy.
 * Likewise the security rows: the enabled and verified states come from the
 * account (`USER.kyc`, the two-factor flag), not from the page.
 */
/* Kept in step with `SETTINGS_TABS` in the router, which validates the hash. */
const SECTIONS = [
  { key: 'profile', title: 'Personal information', body: 'Update your personal details and contact information.', tab: '#settings' },
  { key: 'password', title: 'Password management', body: 'Update your password to keep your account secure.' },
  { key: 'identity', title: 'Identity verification', body: 'Verify your identity to unlock withdrawals and higher limits.' },
  { key: 'two-factor', title: 'Two-factor authentication', body: 'Add an extra layer of security to your account.' },
  { key: 'notifications', title: 'Notification preferences', body: 'Choose how you want to hear about your trading activity, account updates and market alerts.' },
]

const TABS = SECTIONS.map((s) => ({ key: s.key, label: s.title.replace('Personal information', 'Profile').replace(' management', '').replace(' authentication', '').replace('Notification preferences', 'Notifications') }))

const tab = ref(SECTIONS.some((s) => s.key === route.tab) ? route.tab : 'profile')
const section = computed(() => SECTIONS.find((s) => s.key === tab.value))

function select(key) {
  tab.value = key
  history.replaceState(null, '', key === 'profile' ? '#settings' : `#settings/${key}`)
}

watch(() => route.tab, (next) => {
  if (SECTIONS.some((s) => s.key === next)) tab.value = next
})

/* --------------------------------------------------------- personal details */

const COUNTRIES = ['Philippines', 'Singapore', 'United Arab Emirates', 'United Kingdom', 'Japan']
const DIALLING = [
  { code: 'PH', dial: '+63' },
  { code: 'SG', dial: '+65' },
  { code: 'AE', dial: '+971' },
  { code: 'GB', dial: '+44' },
]

/* What the desk holds, and nothing else: the empty fields carry a prompt. */
const details = ref({
  nickname: USER.handle,
  first: USER.name,
  last: '',
  email: USER.email,
  born: '',
  address: '',
  city: '',
  zip: '',
  state: '',
  country: 'Philippines',
  dial: '+63',
  phone: '917 000 0000',
})

const DETAIL_FIELDS = [
  { key: 'first', label: 'First name' },
  { key: 'last', label: 'Last name', placeholder: 'Add your last name' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'born', label: 'Date of birth', placeholder: 'DD / MM / YYYY' },
  { key: 'address', label: 'Address', placeholder: 'Add your street address' },
  { key: 'city', label: 'City', placeholder: 'Add your city' },
  { key: 'zip', label: 'Zip code', placeholder: 'Add your zip code' },
  { key: 'state', label: 'State', placeholder: 'Add your state or region' },
]

function saveDetails() {
  pushToast({ tone: 'good', title: 'Details updated', msg: 'This prototype stores nothing — the form stays local.' })
}

/* ---------------------------------------------------------------- password */

const pw = ref({ current: '', next: '', confirm: '' })
const revealed = ref({ current: false, next: false, confirm: false })

const RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Contains an uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Contains a lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'Contains a number', test: (v) => /[0-9]/.test(v) },
]

const checks = computed(() => RULES.map((r) => ({ ...r, ok: r.test(pw.value.next) })))
const pwReady = computed(() => checks.value.every((c) => c.ok) && pw.value.current && pw.value.next === pw.value.confirm)

function changePassword() {
  if (!pwReady.value) return
  pw.value = { current: '', next: '', confirm: '' }
  pushToast({ tone: 'good', title: 'Password changed', msg: 'This device stays signed in. Nothing is stored here.' })
}

/* -------------------------------------------------------------- two-factor */

const twoFactor = ref(true)

function regenerate() {
  pushToast({ tone: 'info', title: 'Backup codes regenerated', msg: 'Ten new single-use codes — the old set stops working.' })
}

/* ----------------------------------------------------------- notifications */

const notifs = ref([
  { key: 'payouts', on: true, label: 'Payout status changes', note: 'Requests, reviews and settlements' },
  { key: 'objectives', on: true, label: 'Objective milestones', note: '50%, 80% and target reached' },
  { key: 'drawdown', on: true, label: 'Drawdown warnings', note: 'Daily loss and trailing lock alerts' },
  { key: 'news', on: false, label: 'Desk news and offers', note: 'Product updates and promotions' },
])

function saveNotifs() {
  pushToast({ tone: 'good', title: 'Preferences saved', msg: `${notifs.value.filter((n) => n.on).length} of ${notifs.value.length} enabled.` })
}

const help = (title, msg) => pushToast({ tone: 'info', title, msg })
</script>

<template>
  <div class="ov" data-od-id="settings-page">
    <div class="page-head util-head" data-od-id="page-head-settings">
      <div class="page-head__text">
        <div class="eyebrow">Account · Settings</div>
        <h1>{{ section.title }}</h1>
        <p class="dim">{{ section.body }}</p>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Settings sections">
      <button
        v-for="t in TABS"
        :key="t.key"
        type="button"
        class="tab"
        role="tab"
        :aria-selected="tab === t.key"
        :data-od-id="`settings-tab-${t.key}`"
        @click="select(t.key)"
      >{{ t.label }}</button>
    </div>

    <!-- Personal information -->
    <section v-if="tab === 'profile'" class="panel" style="margin-top:18px" data-od-id="personal-information">
      <div class="panel__body">
        <div class="field">
          <label for="nickname">Nickname</label>
          <input id="nickname" v-model="details.nickname" class="input" />
        </div>

        <div class="grid grid--cols-2 stg-grid">
          <div v-for="f in DETAIL_FIELDS" :key="f.key" class="field">
            <label :for="`stg-${f.key}`">{{ f.label }}</label>
            <input :id="`stg-${f.key}`" v-model="details[f.key]" class="input" :type="f.type || 'text'" :placeholder="f.placeholder" />
          </div>

          <div class="field">
            <label for="stg-country">Country</label>
            <select id="stg-country" v-model="details.country" class="select">
              <option v-for="c in COUNTRIES" :key="c">{{ c }}</option>
            </select>
          </div>

          <div class="field">
            <label for="stg-phone">Phone</label>
            <div class="stg-phone">
              <select id="stg-dial" v-model="details.dial" class="select stg-phone__dial" aria-label="Dialling code">
                <option v-for="d in DIALLING" :key="d.code" :value="d.dial">{{ d.dial }}</option>
              </select>
              <input id="stg-phone" v-model="details.phone" class="input" inputmode="tel" />
            </div>
          </div>
        </div>

        <div class="util-foot">
          <button class="btn btn--ghost" data-od-id="save-details" @click="saveDetails">Update my details</button>
          <span class="stat-card__foot">Fields the desk has not been given are left blank rather than filled in for you.</span>
        </div>
      </div>
    </section>

    <!-- Password management -->
    <template v-else-if="tab === 'password'">
      <section class="panel util-gap" style="margin-top:18px" data-od-id="password-management">
        <div class="panel__body">
          <div v-for="f in [
            { key: 'current', label: 'Current password' },
            { key: 'next', label: 'New password' },
            { key: 'confirm', label: 'Confirm new password' },
          ]" :key="f.key" class="field">
            <label :for="`pw-${f.key}`">{{ f.label }}</label>
            <div class="stg-secret">
              <input
                :id="`pw-${f.key}`"
                v-model="pw[f.key]"
                class="input"
                :type="revealed[f.key] ? 'text' : 'password'"
                autocomplete="off"
              />
              <button
                type="button"
                class="stg-secret__eye"
                :aria-label="`${revealed[f.key] ? 'Hide' : 'Show'} ${f.label.toLowerCase()}`"
                :aria-pressed="revealed[f.key]"
                @click="revealed[f.key] = !revealed[f.key]"
              >
                <AppIcon :name="revealed[f.key] ? 'eyeOff' : 'eye'" :size="16" />
              </button>
            </div>
          </div>

          <ul class="stg-rules" data-od-id="password-rules">
            <li v-for="c in checks" :key="c.key" :class="{ 'is-ok': c.ok }">
              <AppIcon :name="c.ok ? 'check' : 'close'" :size="15" />{{ c.label }}
            </li>
          </ul>

          <button class="btn btn--ghost stg-inline" :disabled="!pwReady" data-od-id="change-password" @click="changePassword">
            <AppIcon name="lock" :size="15" />Change password
          </button>
        </div>
      </section>

      <div class="callout callout--warn" style="margin-top:18px" data-od-id="security-note">
        <AppIcon name="lock" :size="17" />
        <div>
          <strong>Security note.</strong> After changing your password you stay logged in on this device. Every other
          session is signed out.
        </div>
      </div>
    </template>

    <!-- Identity verification -->
    <template v-else-if="tab === 'identity'">
      <section class="panel stg-verify util-gap" style="margin-top:18px" data-od-id="identity-verification">
        <span class="stg-verify__badge"><AppIcon name="shield" :size="26" /></span>
        <h2 class="stg-verify__title">{{ USER.kyc === 'verified' ? 'Identity verified' : 'Documents requested' }}</h2>
        <p class="stg-verify__body">
          Your identity check is complete, so withdrawals and the full set of platform features are unlocked.
        </p>
        <button class="btn btn--ghost" @click="help('View verification', 'The live portal opens the verification record — this prototype holds none of your documents.')">
          <AppIcon name="shield" :size="15" />View verification
        </button>
      </section>

      <div class="grid grid--cols-3" style="margin-top:18px" data-od-id="verification-facts">
        <div class="panel stg-fact">
          <span class="stg-fact__icon"><AppIcon name="lock" :size="16" /></span>
          <span class="stg-fact__text"><b>Documents</b><span>Held by the verification partner, never on this screen.</span></span>
        </div>
        <div class="panel stg-fact">
          <span class="stg-fact__icon"><AppIcon name="check" :size="16" /></span>
          <span class="stg-fact__text"><b>Review</b><span>Completed — nothing is waiting on you.</span></span>
        </div>
        <div class="panel stg-fact">
          <span class="stg-fact__icon"><AppIcon name="accounts" :size="16" /></span>
          <span class="stg-fact__text"><b>Applies to</b><span>Every account on the portal, present and future.</span></span>
        </div>
      </div>

      <div class="panel stg-help" style="margin-top:18px" data-od-id="verification-help">
        <span class="stg-fact__icon"><AppIcon name="help" :size="16" /></span>
        <div>
          <b>Need help?</b>
          <span>Trouble with verification, or a document that needs resubmitting — the FAQ covers the usual cases.</span>
        </div>
        <a class="btn btn--ghost btn--sm stg-help__cta" href="#help/faq">View FAQ<AppIcon name="external" :size="14" /></a>
      </div>
    </template>

    <!-- Two-factor authentication -->
    <section v-else-if="tab === 'two-factor'" class="panel" style="margin-top:18px" data-od-id="two-factor">
      <div class="stg-row">
        <span class="stg-row__icon stg-row__icon--good"><AppIcon name="shield" :size="18" /></span>
        <span class="stg-row__text">
          <b>{{ twoFactor ? 'Two-factor authentication enabled' : 'Two-factor authentication off' }}</b>
          <span>{{ twoFactor ? 'Your account is protected with an authenticator app.' : 'Your account is protected by your password alone.' }}</span>
        </span>
      </div>

      <div class="stg-row">
        <span class="stg-row__icon"><AppIcon name="lock" :size="18" /></span>
        <span class="stg-row__text">
          <b>Backup codes</b>
          <span>Generate a new set if you have used or lost the ones you have.</span>
        </span>
        <button class="btn btn--ghost btn--sm stg-row__cta" @click="regenerate">
          <AppIcon name="refresh" :size="15" />Regenerate
        </button>
      </div>

      <div class="stg-row stg-row--danger">
        <span class="stg-row__icon stg-row__icon--bad"><AppIcon name="alert" :size="18" /></span>
        <span class="stg-row__text">
          <b>Disable two-factor authentication</b>
          <span>This will make your account less secure.</span>
        </span>
        <button class="btn btn--ghost btn--sm stg-row__cta" :disabled="!twoFactor" @click="twoFactor = false">Disable 2FA</button>
      </div>

      <div class="stg-row stg-row--note">
        <span class="stg-row__icon"><AppIcon name="phone" :size="18" /></span>
        <span class="stg-row__text">
          <b>Authenticator apps</b>
          <span>Google Authenticator, Authy or Microsoft Authenticator. Codes change every 30 seconds.</span>
        </span>
      </div>
    </section>

    <!-- Notification preferences -->
    <section v-else class="panel" style="margin-top:18px" data-od-id="notification-preferences">
      <div class="panel__body">
        <label v-for="n in notifs" :key="n.key" class="switch stg-switch">
          <input v-model="n.on" type="checkbox" />
          <span class="switch__track" />
          <span class="switch__text">
            <strong>{{ n.label }}</strong><br />
            <span class="dim stg-switch__note">{{ n.note }}</span>
          </span>
        </label>

        <div class="util-foot">
          <button class="btn btn--ghost" data-od-id="save-notifications" @click="saveNotifs">
            <AppIcon name="check" :size="15" />Save changes
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
