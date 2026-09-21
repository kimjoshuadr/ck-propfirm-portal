<script setup>
import AppIcon from '../components/AppIcon.vue'

/*
 * Learning · FPT Learn.
 *
 * A hub, and nothing else: the four things the desk teaches, the path they sit
 * on, where the material actually lives, and the community that surrounds it.
 *
 * Deliberately absent — anything that sells. No featured material, no names of
 * programmes, no "free to start", no partner wall. The page states what can be
 * learned and where it is kept; one ghost action opens the platform, in the
 * same button style every other page uses in its head.
 *
 * The two sentences that carry copy are the platform's own, read from
 * learn.fundedproptraders.com, with the wording about its material edited out
 * along with the references to it.
 */
const SITE = 'https://learn.fundedproptraders.com'

/* The spine of the hub: what the teaching is built around, in the order the
   platform lists it. */
const PILLARS = [
  { id: 'drawdown', icon: 'target', label: 'Drawdown control', note: 'Sizing and stops that respect the limit you are measured against.' },
  { id: 'consistency', icon: 'layers', label: 'Consistency rules', note: 'Why one outsized day can cost a pass, and how to spread the risk.' },
  { id: 'psychology', icon: 'spark', label: 'Challenge psychology', note: 'Holding the plan together once the target is close.' },
  { id: 'execution', icon: 'candles', label: 'Execution under pressure', note: 'News, sessions and the moments that break a rule set.' },
]

const PATH = 'Most trading education teaches theory. We teach exactly what prop firms test for: drawdown control, consistency rules, challenge psychology, and execution under pressure. Every lesson is built from real funded trader experience, not textbooks.'

const COMMUNITY = {
  eyebrow: 'Funded Prop Traders',
  title: 'Your community of funded traders starts here',
  body: 'Learning alone is slow. Inside Funded Prop Traders you are surrounded by traders at every stage — beginners studying their first challenge rules, veterans managing multiple funded accounts. Ask questions, share your progress, and stay accountable.',
}

function openPlatform() {
  window.open(SITE, '_blank', 'noopener')
}
</script>

<template>
  <div class="ov" data-od-id="learn-page">
    <div class="page-head util-head" data-od-id="page-head-learn">
      <div class="page-head__text">
        <div class="eyebrow">Learning · FPT Learn</div>
        <h1>FPT Learn</h1>
        <p class="dim">
          Everything Funded Prop Traders teaches, gathered in one place: risk management, challenge psychology
          and consistent execution — built around how prop firms actually evaluate traders.
        </p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--ghost" data-od-id="learn-open" @click="openPlatform">
          <AppIcon name="external" :size="15" />Open the platform
        </button>
      </div>
    </div>

    <!-- The spine: four things worth being able to do. -->
    <div class="grid grid--cols-4 util-gap" data-od-id="learn-pillars">
      <article v-for="p in PILLARS" :key="p.id" class="panel stat-card learn-pillar" :data-od-id="`learn-pillar-${p.id}`">
        <span class="learn-pillar__icon"><AppIcon :name="p.icon" :size="18" /></span>
        <h2 class="learn-pillar__label">{{ p.label }}</h2>
        <p class="learn-pillar__note">{{ p.note }}</p>
      </article>
    </div>

    <div class="grid grid--cols-2" data-od-id="learn-path">
      <section class="panel" data-od-id="learn-approach">
        <div class="panel__head"><span class="panel__title">A learning path built around prop trading reality</span></div>
        <div class="panel__body">
          <p class="learn-body">{{ PATH }}</p>
          <dl class="learn-facts">
            <div><dt>Pillars</dt><dd>{{ PILLARS.length }}</dd></div>
            <div><dt>Taught by</dt><dd>Funded traders</dd></div>
            <div><dt>Material held</dt><dd>On the platform</dd></div>
          </dl>
        </div>
      </section>

      <!-- Where the material lives — the page's own honesty, in a panel. -->
      <section class="panel" data-od-id="learn-note">
        <div class="panel__head">
          <span class="panel__title">Where the material lives</span>
          <span class="panel__actions"><span class="badge"><span class="badge__dot" />Opens elsewhere</span></span>
        </div>
        <div class="panel__body">
          <p class="learn-body">
            The teaching is kept on <b>learn.fundedproptraders.com</b> rather than inside the portal. Your
            progress and certificates stay with that account, and every link here opens it in a new tab.
          </p>
          <p class="learn-body">
            The pillars above are what this portal points you at; the material behind them is Funded Prop
            Traders' own.
          </p>
        </div>
      </section>
    </div>

    <section class="panel learn-community" data-od-id="learn-community">
      <div class="learn-community__body">
        <div class="eyebrow">{{ COMMUNITY.eyebrow }}</div>
        <h2 class="learn-community__title">{{ COMMUNITY.title }}</h2>
        <p class="learn-body">{{ COMMUNITY.body }}</p>
      </div>
    </section>
  </div>
</template>
