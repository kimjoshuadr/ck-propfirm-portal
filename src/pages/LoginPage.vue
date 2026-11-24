<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { brand } from '../lib/assets.js'
import { login } from '../lib/portal.js'
import { pushToast } from '../lib/ui.js'

/*
 * Sign-in screen — the one page that renders without the portal shell.
 *
 * It is a route like any other (`#login`), so signing out is an in-app jump
 * rather than a second HTML document. Submitting posts the CRM's
 * /portal/token endpoint (the cross-domain bearer login) and lands on the
 * dashboard with the JWT in sessionStorage; server errors show inline.
 */
const email = ref('')
const password = ref('')
const remember = ref(true)
const reveal = ref(false)
const touched = ref(false)
const submitting = ref(false)
const serverError = ref('')

const emailError = computed(() => touched.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim()))
const passwordError = computed(() => touched.value && password.value.length < 1)

async function submit() {
  touched.value = true
  serverError.value = ''
  if (emailError.value || passwordError.value) return
  submitting.value = true
  try {
    const { user } = await login(email.value.trim(), password.value)
    pushToast({
      tone: 'good',
      title: 'Signed in',
      msg: `Welcome back${user?.displayName ? `, ${user.displayName}` : ''}.`,
    })
    location.hash = '#overview'
  } catch (err) {
    serverError.value = err?.message || 'Sign-in failed. Please try again.'
  } finally {
    submitting.value = false
  }
}

function planned(title, msg) {
  pushToast({ tone: 'info', title, msg })
}
</script>

<template>
  <div class="auth" data-od-id="login-page">
    <div class="auth__side">
      <form class="auth__form" novalidate data-od-id="login-form" @submit.prevent="submit">
        <a class="auth__brand" href="#login" aria-label="CK Propfirm">
          <img :src="brand.logo" alt="CK Propfirm" width="1095" height="198" />
        </a>

        <div class="auth__title">
          <div class="eyebrow">Trader portal</div>
          <h1>Login to your account</h1>
          <p>Welcome back. Your evaluations, objectives and payouts are waiting.</p>
        </div>

        <div class="auth__social">
          <button type="button" class="btn btn--ghost" @click="planned('Google sign-in', 'Third-party sign-in is not wired in this prototype.')">
            <AppIcon name="globe" :size="18" />Google
          </button>
          <button type="button" class="btn btn--ghost" @click="planned('Apple sign-in', 'Third-party sign-in is not wired in this prototype.')">
            <AppIcon name="user" :size="18" />Apple
          </button>
        </div>

        <div class="auth__divider">or</div>

        <div class="field" :class="{ 'is-invalid': emailError }">
          <label for="email">Email</label>
          <div class="input-group">
            <AppIcon name="bell" :size="16" />
            <input
              id="email"
              v-model="email"
              class="input"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="you@example.com"
            />
          </div>
          <span class="field__error">Enter a valid email address.</span>
        </div>

        <div class="field" :class="{ 'is-invalid': passwordError }">
          <label for="password">Password</label>
          <div class="input-group">
            <AppIcon name="lock" :size="16" />
            <input
              id="password"
              v-model="password"
              class="input"
              :type="reveal ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              placeholder="••••••••"
              style="padding-right:66px"
            />
            <button
              type="button"
              class="input-affix lg-toggle"
              :aria-label="reveal ? 'Hide password' : 'Show password'"
              @click="reveal = !reveal"
            >{{ reveal ? 'Hide' : 'Show' }}</button>
          </div>
          <span class="field__error">Enter your password.</span>
        </div>

        <p v-if="serverError" class="field__error auth__server-error" role="alert" data-od-id="login-error">
          {{ serverError }}
        </p>

        <div class="auth__row">
          <label class="check"><input v-model="remember" type="checkbox" />Remember me</label>
          <a class="auth__link" href="#" @click.prevent="planned('Reset password', 'A reset link would be emailed in the live portal.')">Forgot password?</a>
        </div>

        <button class="btn btn--primary btn--lg btn--block" type="submit" :disabled="submitting" data-od-id="login-submit">
          {{ submitting ? 'Signing in…' : 'Login to your account' }}
        </button>

        <p class="auth__foot">
          Don't have a profile yet?
          <a class="auth__link" href="#" @click.prevent="planned('Create a profile', 'Checkout opens in the live portal.')">Create a profile</a>
        </p>
        <p class="auth__foot lg-cookies">
          <a class="auth__link lg-cookies__link" href="#" @click.prevent="planned('Cookie settings', 'No tracking scripts run in this prototype.')">Cookie settings</a>
        </p>

        <div class="callout lg-note">
          <AppIcon name="shield" :size="17" />
          <div>All accounts are <strong>simulated evaluations</strong>. CK Propfirm is a trading-evaluation product, not a broker, and no real money is ever traded.</div>
        </div>
      </form>
    </div>

    <aside class="auth__art" aria-hidden="true">
      <div class="auth__art-inner">
        <img class="auth__mascot" :src="brand.mascot" width="1000" height="1000" alt="" />
        <p class="auth__quote">“Your skill is our capital. Trade the evaluation, keep the proof.”</p>

        <div class="auth__hero-card">
          <div class="lg-hero__id">
            <span class="avatar avatar--lg">CK</span>
            <div style="min-width:0">
              <div class="lg-hero__name">CK 100K Evaluation</div>
              <div class="mono-id">profit target $8,000 · trailing lock</div>
            </div>
            <span class="badge badge--active" style="margin-left:auto"><span class="badge__dot" />active</span>
          </div>

          <div class="meter">
            <div class="meter__top">
              <span class="meter__label">Profit target</span>
              <span class="meter__val">$1,593 / $8,000</span>
            </div>
            <div class="meter__track"><div class="meter__fill" style="width:19.9%" /></div>
          </div>

          <div class="stat-inline">
            <div class="stat-inline__item"><b>1.82</b><span>Profit factor</span></div>
            <div class="stat-inline__item"><b>61.4%</b><span>Win rate</span></div>
            <div class="stat-inline__item"><b>2/4</b><span>Trading days</span></div>
          </div>
        </div>

        <div class="auth__trust">
          <span class="badge badge--active"><span class="badge__dot" />Trustpilot 4.8</span>
          <span><b>20,000+</b> active traders</span>
          <span><b>$1.2M+</b> paid out</span>
        </div>
      </div>
    </aside>
  </div>
</template>
