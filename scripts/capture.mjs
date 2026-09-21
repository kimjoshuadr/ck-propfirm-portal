#!/usr/bin/env node
/*
 * Renders the built app in the system Chrome and checks the account page.
 *
 * The account revamp moved sections around and replaced a chart with a table,
 * so this script does two things in one pass: it captures the sections that
 * changed, and it asserts the things that are easy to get wrong — section
 * order, the number of quality tiles, that a bar cannot escape its cell, that
 * every sort and every metric selection produces finite numbers, and that the
 * results table's own total reconciles with the account's net P&L.
 *
 * The CDP adapter evaluates real functions (its arguments are JSON injected),
 * so nothing here may close over a variable — pass values in explicitly.
 *
 *   node scripts/capture.mjs            # check + capture
 *   node scripts/capture.mjs --check    # check only, no screenshots
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPlaywright, findSystemChromiumExecutable } from '../.od-skills/web-clone-e758880f1b/scripts/lib/playwright-loader.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const checkOnly = process.argv.includes('--check')
const shotDir = path.join(root, 'RECON/screenshots')
const dist = path.join(root, 'dist-vue')

/* The build has to be served: its entry is an ES module, and a module script
   loaded over file:// is refused for being a cross-origin request. */
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
}

function serve(dir) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0].split('#')[0])
    const file = path.join(dir, rel === '/' ? 'index.html' : rel)
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404)
      res.end('not found')
      return
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })))
}

/* The project root is served, not just the build, so the RECON harness pages
   and the app they frame come from one origin — the harness has to be able to
   reach its iframe's document to aim it. */
const { server, port } = await serve(root)
const appUrl = (hash) => `http://127.0.0.1:${port}/dist-vue/index.html${hash}`
const SIZE = { width: 1440, height: 900 }

const ACCOUNTS = ['412907', '418233', '401566', '409118']
const SECTION_ORDER = ['acc-overview', 'acc-rules', 'acc-trades', 'acc-calendar', 'acc-analytics']

const checks = []
const shots = []
const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail })

const { chromium } = loadPlaywright()
const browser = await chromium.launch({ executablePath: findSystemChromiumExecutable() })

async function open(hash) {
  const page = await browser.newPage({ viewport: SIZE })
  await page.goto(appUrl(hash), { waitUntil: 'load' })
  await page.waitForTimeout(900)
  return page
}

function shapeOf() {
  const tabs = [...document.querySelectorAll('.acc-tabs .tab')].map((b) => b.textContent.trim())
  const sections = [...document.querySelectorAll('.acc-section')].map((s) => s.id)
  const grid = document.querySelector('.acc-grid-5')
  const tiles = grid ? [...grid.children] : []
  const tops = [...new Set(tiles.map((t) => Math.round(t.getBoundingClientRect().top)))]
  return {
    tabs,
    chip: (document.querySelector('.acc-tabs__pos') || {}).textContent.trim(),
    sections,
    scoreSection: Boolean(document.querySelector('[data-od-id="account-score"]')),
    tiles: tiles.length,
    perRow: tops.map((top) => tiles.filter((t) => Math.round(t.getBoundingClientRect().top) === top).length),
    labels: tiles.map((t) => ((t.querySelector('.stat-card__head') || {}).textContent || '').trim().split(/\s+/)[0]),
  }
}

function tableOf() {
  const ROOT = '#acc-analytics'
  const SEL = `${ROOT} .data--bars`
  const heads = [...document.querySelectorAll(`${SEL} thead th`)].map((th) => th.textContent.trim())
  const rows = [...document.querySelectorAll(`${SEL} tbody tr`)].map((tr) => [...tr.children].map((td) => td.textContent.trim()))
  const bars = [...document.querySelectorAll(`${SEL} .cell-bar`)]
  const cells = [...document.querySelectorAll(`${SEL} tbody td.has-bar`)]
  /* A bar must stay inside the cell it belongs to, which is what the old
     absolutely positioned chart failed to do. */
  const inside = bars.every((bar, i) => {
    const cell = cells[i]
    if (!cell) return false
    const b = bar.getBoundingClientRect()
    const c = cell.getBoundingClientRect()
    return b.left >= c.left - 0.5 && b.right <= c.right + 0.5
  })
  return { heads, rows, bars: bars.length, inside, foot: ((document.querySelector(`${ROOT} .panel__foot span`) || {}).textContent || '').trim() }
}

/*
 * Sweeps the results table through both groupings and all three metrics.
 *
 * The segs are found by their aria-label and the table by its section: the page
 * renders every section at once, so a bare `.seg` query used to pick up the
 * topbar's notification filter and the chart's Trades/Daily toggle, and a bare
 * `.data--bars` query picks up the calendar ledger as well. Getting that wrong
 * made this check pass while clicking nothing that mattered, so it now also
 * asserts that the has-bar column follows the metric.
 */
async function sweepAll() {
  const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  const seg = (label) => document.querySelector(`.seg[aria-label="${label}"]`)
  const groups = [...seg('Group results by').querySelectorAll('.seg__btn')]
  const metrics = [...seg('Chart encoding').querySelectorAll('.seg__btn')]
  const SEL = '#acc-analytics .data--bars'
  const heads = () => [...document.querySelectorAll(`${SEL} thead th`)].map((th) => th.textContent.trim())
  const rows = () => [...document.querySelectorAll(`${SEL} tbody tr`)]
  const columnOf = (label) => heads().indexOf(label)
  const metricColumn = { 'Net PnL': 'Net P&L', '# Trades': '# Trades', 'Win rate': 'Win rate' }
  const out = []
  for (const g of groups) {
    g.click()
    await wait()
    for (const m of metrics) {
      m.click()
      await wait()
      const name = m.textContent.trim()
      const column = columnOf(metricColumn[name])
      const values = rows().map((tr) => Number((tr.children[column]?.textContent || '').replace(/[^0-9.-]/g, '')))
      const barColumn = [...(rows()[0]?.children || [])].findIndex((td) => td.classList.contains('has-bar'))
      out.push({
        view: `${g.textContent.trim()}/${name}`,
        group: g.textContent.trim(),
        rows: values.length,
        column,
        barColumn,
        labels: rows().map((tr) => (tr.children[0]?.textContent || '').trim()),
        descending: values.length > 0 && values.every((v, i) => i === 0 || values[i - 1] >= v),
        finite: values.length > 0 && values.every((v) => Number.isFinite(v)) && values.some((v) => v !== 0),
      })
    }
  }
  /* Sorting is asserted on the values, not on the first label: instruments can
     share a trade count, and a tie keeps the previous order. The first header
     click opens on descending, the second flips it. */
  const header = document.querySelectorAll(`${SEL} thead th`)[1]
  const values = () => rows().map((tr) => Number((tr.children[1]?.textContent || '').replace(/[^0-9.-]/g, '')))
  const before = values()
  header.click()
  await wait()
  const desc = values()
  header.click()
  await wait()
  const asc = values()
  return { out, before, desc, asc }
}

/*
 * Screenshots come from the RECON harness, not from the app document itself.
 * The app paints a sticky top bar and a sticky section strip, and capturing it
 * directly drops those layers; inside a viewport-sized iframe on a normal page
 * everything composites the way the reader sees it. Each iframe is scrolled
 * into the harness viewport in turn, so one capture is exactly one app
 * viewport with nothing clipped.
 */
async function shootHarness(shots = ['overview', 'objectives', 'trades', 'calendar', 'calendar-open', 'analysis', 'sizer', 'sizer-bottom', 'platforms', 'platforms-alt', 'platforms-foot', 'learn', 'learn-foot', 'billing', 'withdrawals', 'methods', 'agreements', 'leaderboard', 'settings-profile', 'settings-password', 'settings-identity', 'settings-two-factor', 'settings-notifications', 'support', 'faq', 'user-menu', 'footer']) {
  const written = []
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: SIZE })
    await page.goto(`http://127.0.0.1:${port}/RECON/account-revamp-check.html?shot=${shot}`, { waitUntil: 'load' })
    await page.waitForTimeout(2800)
    /* Read back what the frame is showing, so a capture cannot silently be of
       the wrong section or the wrong scroll position. */
    const seen = await page.evaluate(() => {
      const win = document.getElementById('view').contentWindow
      const headings = [...win.document.querySelectorAll('.acc-section__title')].map((h) => h.textContent.trim())
      const current = (win.document.querySelector('.acc-tabs .is-current') || {}).textContent || ''
      const boxes = [...win.document.querySelectorAll('.acc-section')].map((s) => ({
        id: s.id,
        top: Math.round(s.getBoundingClientRect().top),
        bottom: Math.round(s.getBoundingClientRect().bottom),
      }))
      const inView = boxes.filter((b) => b.bottom > 0 && b.top < win.innerHeight).map((b) => b.id)
      return {
        scrollY: Math.round(win.scrollY),
        current: current.trim(),
        headings,
        inView,
        height: Math.round(win.innerHeight),
        detail: win.document.querySelectorAll('.cal-ledger__detail').length,
      }
    })
    await page.screenshot({ path: path.join(shotDir, `account-revamp-${shot}.png`) })
    written.push(`account-revamp-${shot}.png — ${shot}${seen.detail ? ` with ${seen.detail} session open` : ''}, ${seen.inView.join('+')} in a ${seen.height}px frame, tab "${seen.current}"`)
    await page.close()
  }
  return written
}

try {
  /* --- the page's shape ------------------------------------------------- */
  const overview = await open('#account/412907')
  const shape = await overview.evaluate(shapeOf)
  check('sections are Overview · Objectives · Trades · Calendar · Analysis', JSON.stringify(shape.sections) === JSON.stringify(SECTION_ORDER), shape.sections.join(' · '))
  check('tab strip matches the sections', JSON.stringify(shape.tabs) === JSON.stringify(['Overview', 'Objectives', 'Trades', 'Calendar', 'Analysis']) && shape.chip === '1 / 5', `${shape.tabs.join(' · ')} — chip ${shape.chip}`)
  check('the Score section is gone', shape.scoreSection === false)
  check('ten trade-quality tiles on two rows of five', shape.tiles === 10 && shape.perRow.length === 2 && shape.perRow.every((n) => n === 5), `${shape.tiles} tiles, rows ${JSON.stringify(shape.perRow)}`)
  check('consistency and recovery came across', shape.labels.includes('Consistency') && shape.labels.includes('Recovery'), shape.labels.join(','))

  await overview.close()

  /* --- the results table, on every account, both groupings, all metrics -- */
  for (const number of ACCOUNTS) {
    const netPage = await open(`#account/${number}`)
    const net = await netPage.evaluate(() => ((document.querySelector('[data-od-id="account-net-pnl"] .stat-card__value') || {}).textContent || '').trim())
    await netPage.close()

    const page = await open(`#account/${number}/analytics`)
    /* A deep link must land straight down: horizontal overflow used to give
       `scrollIntoView` 76px of sideways travel and push the sidebar off-screen. */
    const fit = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      view: window.innerWidth,
      x: Math.round(window.scrollX),
      sidebar: Math.round(document.querySelector('.sidebar').getBoundingClientRect().left),
    }))
    check(`account ${number}: the page does not scroll sideways`, fit.page <= fit.view && fit.x === 0 && fit.sidebar === 0, `page ${fit.page}px in a ${fit.view}px viewport, scrollX ${fit.x}, sidebar at ${fit.sidebar}`)

    const table = await page.evaluate(tableOf)
    check(`account ${number}: the table renders rows with no NaN/undefined`, table.rows.length > 0 && !/NaN|undefined|Infinity/.test(JSON.stringify(table.rows)), `${table.rows.length} rows — ${table.heads.join(' / ')}`)
    check(`account ${number}: one inline bar per row, inside its own cell`, table.bars === table.rows.length && table.inside, `${table.bars} bars`)
    check(`account ${number}: the table's own total reconciles with net P&L`, table.foot.includes(net), `${table.foot} vs ${net}`)

    const sweep = await page.evaluate(sweepAll)
    check(`account ${number}: all six grouping × metric views are sorted on that metric`, sweep.out.length === 6 && sweep.out.every((r) => r.descending), sweep.out.map((r) => `${r.view}${r.descending ? '' : ' ✗'}`).join(' '))
    check(`account ${number}: all six views read real numbers`, sweep.out.every((r) => r.finite && r.rows > 1), sweep.out.map((r) => `${r.view}:${r.rows}`).join(' '))
    check(`account ${number}: the bar follows the metric seg into its column`, sweep.out.every((r) => r.barColumn === r.column && r.column > 0), sweep.out.map((r) => `${r.view}→col ${r.barColumn}`).join(' '))
    const byGroup = {}
    sweep.out.forEach((r) => { byGroup[r.group] = byGroup[r.group] || new Set(); r.labels.forEach((l) => byGroup[r.group].add(l)) })
    check(`account ${number}: the grouping seg changes what is grouped`, Object.keys(byGroup).length === 2 && [...byGroup[Object.keys(byGroup)[0]]].join() !== [...byGroup[Object.keys(byGroup)[1]]].join(), Object.entries(byGroup).map(([g, set]) => `${g}: ${[...set].slice(0, 3).join(', ')}`).join(' · '))
    const falls = (list) => list.every((v, i) => i === 0 || list[i - 1] >= v)
    const rises = (list) => list.every((v, i) => i === 0 || list[i - 1] <= v)
    check(
      `account ${number}: clicking a header sorts that column both ways`,
      falls(sweep.desc) && rises(sweep.asc) && sweep.desc[0] !== sweep.asc[0] && sweep.desc.length === sweep.before.length,
      `desc ${sweep.desc.join(',')} · asc ${sweep.asc.join(',')}`,
    )

    await page.close()
  }

  /* --- the restyled trade tables ---------------------------------------- */
  const trades = await open('#account/412907/trades')
  /* Only one of the two tables is in the document at a time, so this is read
     before and after switching the Open/Closed seg. */
  function tableShape() {
    const SEL = '#acc-trades .data--striped'
    return {
      striped: document.querySelectorAll(SEL).length,
      roomy: document.querySelectorAll(`${SEL}.data--roomy`).length,
      heads: [...document.querySelectorAll(`${SEL} thead th`)].map((th) => th.textContent.trim()),
      net: ((document.querySelector(`${SEL} tbody td.net`) || {}).textContent || '').trim(),
      rowHeight: Math.round((document.querySelector(`${SEL} tbody tr`) || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height),
    }
  }
  const closed = await trades.evaluate(tableShape)
  check('the closed table is striped, tighter and keeps eleven columns', closed.striped === 1 && closed.roomy === 0 && closed.heads.length === 11, `${closed.heads.length} columns · row ${closed.rowHeight}px`)
  check('the closed net column carries the weight and a value', Boolean(closed.net) && closed.rowHeight > 0, `${closed.net} · row ${closed.rowHeight}px`)

  await trades.evaluate(() => [...document.querySelectorAll('.seg__btn')].find((b) => b.textContent.trim() === 'Open').click())
  await trades.waitForTimeout(400)
  const openTable = await trades.evaluate(tableShape)
  check('the open table is striped too and keeps eleven columns', openTable.striped === 1 && openTable.roomy === 0 && openTable.heads.length === 11, `${openTable.heads.length} columns · row ${openTable.rowHeight}px`)
  await trades.close()

  /* --- the calendar: a month strip over a session ledger ----------------- */
  const calendar = await open('#account/412907/calendar')
  const cal = await calendar.evaluate(() => {
    const num = (s) => Number((s || '').replace(/[^0-9.-]/g, '')) || 0
    const SEL = '#acc-calendar'
    const ticks = [...document.querySelectorAll(`${SEL} .cal-tick`)]
    const rows = [...document.querySelectorAll(`${SEL} .cal-ledger tbody tr.is-row`)]
    const facts = [...document.querySelectorAll(`${SEL} .cal-facts dd`)].map((dd) => dd.textContent.trim())
    const net = (tr) => num(tr.children[3]?.textContent)
    return {
      days: ticks.length,
      traded: ticks.filter((t) => !t.disabled).length,
      heights: ticks.filter((t) => !t.disabled).map((t) => Math.round(t.querySelector('i').getBoundingClientRect().height)),
      sessions: rows.length,
      dates: rows.map((tr) => tr.id.replace('cal-', '')),
      names: rows.slice(0, 1).map((tr) => tr.children[0].textContent.replace(/\s+/g, ' ').trim()),
      monthFact: num(facts[0]),
      ledgerTotal: Math.round(rows.reduce((t, tr) => t + net(tr), 0) * 100) / 100,
      footer: num((document.querySelector(`${SEL} .panel__foot b`) || {}).textContent),
      perTrade: rows.map((tr) => ({ pnl: net(tr), trades: num(tr.children[1].textContent), shown: num(tr.children[4].textContent) })),
      nextDisabled: document.querySelectorAll(`${SEL} .panel__actions .rail__arrow`)[1].disabled,
      prevDisabled: document.querySelectorAll(`${SEL} .panel__actions .rail__arrow`)[0].disabled,
      label: document.querySelector(`${SEL} .panel__title`).textContent.trim(),
    }
  })
  const descending = cal.dates.every((d, i) => i === 0 || cal.dates[i - 1] > d)
  const perTradeOk = cal.perTrade.every((r) => Math.abs(r.pnl / r.trades - r.shown) < 0.02)
  check('calendar: one bar per day of the month, one per traded day enabled', cal.days >= 28 && cal.days <= 31 && cal.traded === cal.sessions, `${cal.days} days, ${cal.traded} traded, ${cal.sessions} ledger rows`)
  check('calendar: bar heights are a positive share of the biggest day', cal.heights.length > 0 && Math.max(...cal.heights) <= 64 && Math.min(...cal.heights) >= 2 && cal.heights.some((h) => h > 10), `heights ${Math.min(...cal.heights)}–${Math.max(...cal.heights)}px`)
  check('calendar: sessions are listed newest first', descending, cal.dates.slice(0, 3).join(' > ') + ' … ' + cal.dates.slice(-1)[0])
  check('calendar: the month figure, the ledger and the footer agree', Math.abs(cal.monthFact - cal.ledgerTotal) < 0.01 && Math.abs(cal.ledgerTotal - cal.footer) < 0.01, `header ${cal.monthFact}, ledger ${cal.ledgerTotal}, footer ${cal.footer}`)
  check('calendar: each session per-trade figure is its own P&L divided by its trades', perTradeOk, cal.perTrade.map((r) => `${r.pnl}/${r.trades}=${r.shown}`).slice(0, 3).join(' '))
  check('calendar: the stepper will not walk past the log', cal.nextDisabled === true && cal.prevDisabled === false, `${cal.label}: next disabled ${cal.nextDisabled}, prev disabled ${cal.prevDisabled}`)

  /* Opening a session has to expand in place, with the day's trades adding up. */
  const opened = await calendar.evaluate(async () => {
    const num = (s) => Number((s || '').replace(/[^0-9.-]/g, '')) || 0
    const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const row = document.querySelector('.cal-ledger tbody tr.is-row')
    row.click()
    await wait()
    const detail = document.querySelector('.cal-ledger__detail')
    const trades = [...document.querySelectorAll('.cal-detail__table tbody tr')]
    const sum = Math.round(trades.reduce((t, tr) => t + num(tr.children[5].textContent), 0) * 100) / 100
    const expanded = document.querySelector('.cal-ledger tbody tr.is-row').getAttribute('aria-expanded')
    row.click()
    await wait()
    return { rowPnl: num(row.children[3].textContent), rowTrades: num(row.children[1].textContent), sum, rows: trades.length, expanded, closed: document.querySelectorAll('.cal-ledger__detail').length }
  })
  check('calendar: opening a session lists its trades and they add up', opened.rows === opened.rowTrades && Math.abs(opened.sum - opened.rowPnl) < 0.01 && opened.expanded === 'true', `${opened.rows} trades summing ${opened.sum} against a row of ${opened.rowPnl}`)
  check('calendar: closing the session removes the detail row', opened.closed === 0)

  await calendar.close()

  /* --- the sizer: same parts as the rest of the portal -------------------- */
  const sizer = await open('#tools/sizer')
  const siz = await sizer.evaluate(() => {
    const num = (s) => Number((s || '').replace(/[^0-9.-]/g, '')) || 0
    const root = document.querySelector('[data-od-id="sizer-page"]')
    const at = (id) => document.querySelector(`[data-od-id="${id}"]`)
    const value = (id) => num((at(id).querySelector('.stat-card__value') || {}).textContent)
    return {
      eyebrow: (document.querySelector('[data-od-id="page-head-sizer"] .eyebrow') || {}).textContent.trim(),
      psz: document.querySelectorAll('[class*="psz"]').length,
      legacyCards: root.querySelectorAll('.card').length,
      parts: {
        pageHead: Boolean(document.querySelector('.page-head')),
        panels: root.querySelectorAll('.panel').length,
        statCards: root.querySelectorAll('.stat-card').length,
        seg: root.querySelectorAll('.seg').length,
        kvRuled: root.querySelectorAll('.kv-inline--ruled').length,
        meters: root.querySelectorAll('.meter').length,
        fields: root.querySelectorAll('.field').length,
        callout: root.querySelectorAll('.callout--warn').length,
      },
      lots: value('sizer-size'),
      units: value('sizer-units'),
      atRisk: value('sizer-risk'),
      math: [...document.querySelectorAll('.siz-math__step')].map((s) => ({
        label: s.querySelector('.siz-math__label').textContent.trim(),
        value: num(s.querySelector('.siz-math__value').textContent),
        note: s.querySelector('.siz-math__note').textContent.trim(),
      })),
      /* Both rows are two panels side by side; a column that runs away from its
         neighbour is the thing this turn was about. */
      heights: Object.fromEntries(
        ['sizer-inputs', 'sizer-results', 'sizer-summary', 'sizer-limits'].map((id) => {
          const box = document.querySelector(`[data-od-id="${id}"]`).getBoundingClientRect()
          return [id, Math.round(box.height)]
        }),
      ),
      limits: [...document.querySelectorAll('[data-od-id="sizer-limits"] .obj-row')].map((r) => ({
        label: r.querySelector('.obj-row__top span').textContent.trim(),
        value: r.querySelector('.obj-row__value').textContent.trim(),
        state: r.querySelector('.obj-row__state').className.includes('--good') ? 'good' : 'bad',
      })),
      verdict: (document.querySelector('[data-od-id="sizer-limits"] .badge') || {}).textContent.trim(),
      warning: Boolean(document.querySelector('[data-od-id="sizer-warning"]')),
      copy: Boolean([...document.querySelectorAll('.page-head__actions .btn')].find((b) => b.textContent.includes('Copy result'))),
    }
  }
  )
  check('sizer: nothing is left of the bespoke chrome', siz.psz === 0 && siz.legacyCards === 0, `${siz.psz} psz-* nodes, ${siz.legacyCards} .card nodes`)
  check('sizer: built from the portal\'s own parts', siz.parts.pageHead && siz.parts.panels === 6 && siz.parts.statCards >= 3 && siz.parts.seg === 1 && siz.parts.kvRuled === 1 && siz.parts.meters === 2 && siz.parts.fields === 7, JSON.stringify(siz.parts))
  const b = siz.heights
  const pair = (a, z) => `${a} ${b[a]}px vs ${z} ${b[z]}px (gap ${Math.abs(b[a] - b[z])}px)`
  check(
    'sizer: each row is two panels of comparable height',
    Math.abs(b['sizer-inputs'] - b['sizer-results']) <= 160 && Math.abs(b['sizer-summary'] - b['sizer-limits']) <= 160,
    `${pair('sizer-inputs', 'sizer-results')} · ${pair('sizer-summary', 'sizer-limits')}`,
  )
  check(
    'sizer: the results column no longer dwarfs the inputs',
    b['sizer-results'] <= b['sizer-inputs'] * 1.35,
    `${b['sizer-results']}px against ${b['sizer-inputs']}px`,
  )
  check('sizer: the eyebrow names the nav section', siz.eyebrow === 'Main · Position sizer', siz.eyebrow)
  check('sizer: the arithmetic reconciles with the size above it', siz.math.length === 3 && Math.abs(siz.math[0].value / siz.math[1].value - siz.lots) < 0.01 && Math.abs(siz.math[2].value - siz.lots) < 0.01, `${siz.math.map((s) => `${s.label} ${s.value}`).join(' → ')} → ${siz.lots} lots`)
  check('sizer: units and money at risk agree with the size', Math.abs(siz.units - siz.lots * 100000) < 1 && Math.abs(siz.atRisk - siz.lots * 2000) < 0.01, `${siz.lots} lots · ${siz.units} units · ${siz.atRisk} at risk`)
  check('sizer: the risk is checked against the active account', siz.limits.length === 2 && siz.limits.every((r) => r.state === 'good') && /within both limits/.test(siz.verdict), `${siz.limits.map((r) => `${r.label}: ${r.value}`).join(' | ')} — ${siz.verdict}`)
  check('sizer: the copy action exists in the page head', siz.copy === true)

  /* The controls have to actually drive the page, not just render. */
  const driven = await sizer.evaluate(async () => {
    const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const type = (id, v) => {
      const el = document.querySelector(id)
      el.value = String(v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    const num = (s) => Number((s || '').replace(/[^0-9.-]/g, '')) || 0
    const lots = () => num(document.querySelector('[data-od-id="sizer-size"] .stat-card__value').textContent)
    const verdict = () => (document.querySelector('[data-od-id="sizer-limits"] .badge') || {}).textContent.trim()
    const states = () => [...document.querySelectorAll('[data-od-id="sizer-limits"] .obj-row__state')].map((s) => (s.className.includes('--good') ? 'good' : 'bad'))

    /* zero the stop: it must warn rather than divide by zero */
    type('#stop', 0)
    await wait()
    const zeroed = { lots: lots(), warning: Boolean(document.querySelector('[data-od-id="sizer-warning"]')) }
    type('#stop', 200)
    await wait()

    /* switch the risk unit: the number has to carry over. The seg is found by
       its aria-label — a bare `.seg__btn` query picks up the topbar's
       notification filter, which is how this check passed while clicking the
       wrong control. */
    const seg = document.querySelector('.seg[aria-label="Risk unit"]')
    const segs = [...seg.querySelectorAll('.seg__btn')]
    segs[1].click()
    await wait()
    const asAmount = document.querySelector('#risk').value
    segs[0].click()
    await wait()
    const asPercent = document.querySelector('#risk').value

    /* load the balance from the active account */
    document.querySelector('.siz-link').click()
    await wait()
    const loaded = document.querySelector('#balance').value

    /* size a position that cannot fit inside the limits */
    segs[1].click()
    await wait()
    type('#risk', 999999)
    await wait()
    const breach = { verdict: verdict(), states: states() }

    /* and one that does */
    type('#risk', 500)
    await wait()
    const fine = { verdict: verdict(), states: states() }

    return { zeroed, segButtons: segs.length, asAmount, asPercent, loaded, breach, fine }
  })
  check('sizer: a zero stop warns instead of dividing by zero', driven.zeroed.lots === 0 && driven.zeroed.warning, `lots ${driven.zeroed.lots}, warning ${driven.zeroed.warning}`)
  check('sizer: the risk unit seg is the page\'s own, two buttons', driven.segButtons === 2, `${driven.segButtons} buttons`)
  check('sizer: the risk seg carries the number between percent and amount', Number(driven.asAmount) === 2000 && Number(driven.asPercent) === 2, `2000 → ${driven.asAmount} · 2 → ${driven.asPercent}`)
  check('sizer: “Use active” loads the account balance', driven.loaded === '101593', driven.loaded)
  check('sizer: a size that cannot fit flips the verdict and both states', /would breach/.test(driven.breach.verdict) && driven.breach.states.every((s) => s === 'bad'), `${driven.breach.verdict} — ${driven.breach.states.join('/')}`)
  check('sizer: a size that fits clears it again', /within both limits/.test(driven.fine.verdict) && driven.fine.states.every((s) => s === 'good'), `${driven.fine.verdict} — ${driven.fine.states.join('/')}`)
  await sizer.close()

  /* --- platforms: a downloads page and nothing else ---------------------- */
  const platforms = await open('#tools/platforms')
  const plat = await platforms.evaluate(() => {
    const root = document.querySelector('[data-od-id="platforms-page"]')
    const cards = [...root.querySelectorAll('.plat-card')]
    const rows = () => [...document.querySelectorAll('[data-od-id="platform-downloads"] tbody tr')]
    const read = () => ({
      title: document.querySelector('[data-od-id="platform-downloads"] .panel__title').textContent.trim(),
      badge: document.querySelector('[data-od-id="platform-downloads"] .badge').textContent.trim(),
      rows: rows().length,
      systems: rows().map((tr) => tr.children[0].textContent.trim()),
      sources: rows().map((tr) => tr.children[2].textContent.trim()),
      buttons: document.querySelectorAll('[data-od-id="platform-downloads"] .plat-download').length,
      runs: [...document.querySelectorAll('.plat-runs__link')].map((a) => a.textContent.trim()),
    })
    return {
      text: root.innerText.replace(/\s+/g, ' '),
      legacy: root.querySelectorAll('.card, .stat, .kv__row').length,
      headActions: root.querySelectorAll('.page-head__actions button').length,
      credentials: root.querySelectorAll('.kv-inline, .kv-inline__row').length,
      symbols: root.querySelectorAll('[data-table="symbols"]').length,
      statCards: root.querySelectorAll('.stat-card').length,
      panels: root.querySelectorAll('.panel').length,
      callout: root.querySelectorAll('.callout--warn').length,
      cards: cards.map((c) => ({
        name: c.querySelector('.plat-card__name').textContent.trim(),
        pressed: c.getAttribute('aria-pressed'),
        logo: (c.querySelector('.plat-card__logo') || {}).getAttribute ? c.querySelector('.plat-card__logo').getAttribute('src') : '',
        count: c.querySelector('.plat-card__count').textContent.replace(/\s+/g, ' ').trim(),
      })),
      selected: read(),
    }
  })
  check('platforms: the page is downloads and nothing else', plat.headActions === 0 && plat.credentials === 0 && plat.symbols === 0 && plat.statCards === 0 && plat.panels === 2 && plat.legacy === 0, `${plat.panels} panels · ${plat.headActions} head actions · ${plat.credentials} credential rows · ${plat.symbols} symbol tables · ${plat.statCards} stat cards · ${plat.legacy} legacy nodes`)
  check('platforms: nothing offers a connection guide or a desktop-only download', !/connection guide|download desktop/i.test(plat.text) && !/password|copy login/i.test(plat.text), plat.text.slice(0, 120))
  check('platforms: two platforms, each with its own mark', plat.cards.length === 2 && plat.cards[0].logo.includes('platform-tradelocker') && plat.cards[1].logo.includes('platform-metatrader5'), plat.cards.map((c) => `${c.name} → ${c.logo.split('/').pop()}`).join(' | '))
  check('platforms: the first is selected and says how many builds it has', plat.cards[0].pressed === 'true' && plat.cards[1].pressed === 'false' && plat.cards[0].count === '5 downloads available', plat.cards.map((c) => `${c.name} (${c.count})`).join(' | '))
  check('platforms: the rows follow the picked platform', plat.selected.title === 'TradeLocker downloads' && plat.selected.rows === 5 && plat.selected.buttons === 5 && plat.selected.badge === '5 builds', `${plat.selected.title} · ${plat.selected.rows} rows · ${plat.selected.badge}`)
  check('platforms: every row names a device and where the build comes from', new Set(plat.selected.systems).size === plat.selected.rows && plat.selected.sources.every((s) => s.length > 1), plat.selected.systems.map((s, i) => `${s}: ${plat.selected.sources[i]}`).join(' · '))
  check('platforms: the foot line names the accounts that run on it', plat.selected.runs.join() === '412907,401566', plat.selected.runs.join(' '))
  check('platforms: the demo-values callout is still there', plat.callout === 1)

  /* Picking the other platform has to move the rows and the account line. */
  const swapped = await platforms.evaluate(async () => {
    document.querySelector('[data-od-id="platform-mt5"]').click()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    return {
      pressed: [...document.querySelectorAll('.plat-card')].map((c) => c.getAttribute('aria-pressed')),
      title: document.querySelector('[data-od-id="platform-downloads"] .panel__title').textContent.trim(),
      rows: document.querySelectorAll('[data-od-id="platform-downloads"] tbody tr').length,
      systems: [...document.querySelectorAll('[data-od-id="platform-downloads"] tbody tr')].map((tr) => tr.children[0].textContent.trim()),
      runs: [...document.querySelectorAll('.plat-runs__link')].map((a) => a.textContent.trim()),
    }
  })
  check('platforms: picking the other platform moves the rows', swapped.pressed.join() === 'false,true' && /MetaTrader 5 downloads/.test(swapped.title) && swapped.rows === 4, `${swapped.pressed.join('/')} · ${swapped.title} · ${swapped.rows} rows`)
  check('platforms: the two platforms do not list the same builds', swapped.systems.join() !== plat.selected.systems.join() && !swapped.systems.includes('Web terminal'), `${plat.selected.systems.length} rows vs ${swapped.systems.length}`)
  check('platforms: the account foot line follows the platform', swapped.runs.join() === '418233,409118', swapped.runs.join(' '))
  await platforms.close()

  /* --- FPT Learn replaced the reference's room page ---------------------- */
  const learn = await open('#learn')
  const lrn = await learn.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: Math.round(r.top), height: Math.round(r.height) }
    }
    const pillars = [...document.querySelectorAll('[data-od-id^="learn-pillar-"]')].map((el) => {
      const r = el.getBoundingClientRect()
      return { id: el.dataset.odId, top: Math.round(r.top), height: Math.round(r.height) }
    })
    const row = [...document.querySelectorAll('[data-od-id="learn-path"] > *')].map((el) => {
      const r = el.getBoundingClientRect()
      return { id: el.dataset.odId, top: Math.round(r.top), height: Math.round(r.height) }
    })
    const headBtn = document.querySelector('[data-od-id="learn-open"]')
    return {
      eyebrow: document.querySelector('[data-od-id="page-head-learn"] .eyebrow').textContent.trim(),
      title: document.querySelector('[data-od-id="page-head-learn"] h1').textContent.trim(),
      navRow: [...document.querySelectorAll('.sidebar a, .sidebar button')]
        .filter((el) => /FPT Learn/.test(el.textContent))
        .map((el) => el.getAttribute('href') || el.textContent.trim())[0] || '',
      pillars: [...document.querySelectorAll('[data-od-id^="learn-pillar-"] .learn-pillar__label')].map((h) => h.textContent.trim()),
      pillarBoxes: pillars,
      rowBoxes: row,
      headButtonClass: headBtn ? headBtn.className : '',
      text: document.querySelector('[data-od-id="learn-page"]').innerText.replace(/\s+/g, ' '),
    }
  })
  const spread = (list) => Math.max(...list.map((b) => b.height)) - Math.min(...list.map((b) => b.height))
  const topSpread = (list) => Math.max(...list.map((b) => b.top)) - Math.min(...list.map((b) => b.top))
  check('learn: the page is FPT Learn under Learning', lrn.eyebrow === 'Learning · FPT Learn' && lrn.title === 'FPT Learn', `${lrn.eyebrow} · ${lrn.title}`)
  check('learn: the sidebar row points at it', lrn.navRow === '#learn', lrn.navRow)
  check('learn: it is a hub of four pillars', lrn.pillars.length === 4 && lrn.pillars[0] === 'Drawdown control', lrn.pillars.join(' · '))
  check('learn: nothing on the page sells or names material', !/course|programme|program\b/i.test(lrn.text) && !/free to start|start learning free|official partners/i.test(lrn.text), (lrn.text.match(/.{0,40}(course|programme|free to start).{0,40}/i) || ['no match'])[0])
  check('learn: the head action is the same ghost button the other pages use', lrn.headButtonClass === 'btn btn--ghost', lrn.headButtonClass)
  check('learn: the four pillar cards are level, top and bottom', topSpread(lrn.pillarBoxes) === 0 && spread(lrn.pillarBoxes) <= 1, lrn.pillarBoxes.map((b) => `${b.id.replace('learn-pillar-', '')} ${b.top}/${b.height}`).join(' · '))
  check('learn: the two cards in the row below are level', topSpread(lrn.rowBoxes) === 0 && spread(lrn.rowBoxes) <= 1, lrn.rowBoxes.map((b) => `${b.id} top ${b.top} h ${b.height}`).join(' · '))
  check('learn: it says where the material lives', /where the material lives/i.test(lrn.text) && /rather than inside the portal/i.test(lrn.text), lrn.text.slice(lrn.text.search(/Where the material lives/i), lrn.text.search(/Where the material lives/i) + 90))
  await learn.close()

  /* The retired deep link opens its replacement, and the reference's room
     wording is gone from the screens that used to sell it. */
  const room = await open('#help/room')
  const retiredRoom = await room.evaluate(() => ({
    learn: Boolean(document.querySelector('[data-od-id="learn-page"]')),
    wording: document.querySelector('[data-od-id="learn-page"]').innerText,
  }))
  check('learn: an old #help/room link opens FPT Learn', retiredRoom.learn === true)
  check('learn: the reference\'s room wording is gone from the page', !/CK Room|Orion/i.test(retiredRoom.wording))
  await room.close()

  const overviewRoom = await open('#overview')
  const overviewText = await overviewRoom.evaluate(() => document.body.innerText)
  check('learn: the overview no longer advertises a room either', !/CK Room|Orion Room/i.test(overviewText) && /FPT Learn/.test(overviewText), overviewText.includes('FPT Learn') ? 'FPT Learn present, no room wording' : 'FPT Learn missing')
  await overviewRoom.close()

  /* --- billing, withdrawals and agreements ------------------------------- */
  const billing = await open('#manage/billing')
  const bill = await billing.evaluate(() => {
    const rows = () => [...document.querySelectorAll('[data-table="orders"] tbody tr')]
    return {
      title: document.querySelector('[data-od-id="page-head-manage"] h1').textContent.trim(),
      eyebrow: document.querySelector('[data-od-id="page-head-manage"] .eyebrow').textContent.trim(),
      panels: [...document.querySelectorAll('[data-od-id="payouts-page"] .panel__title')].map((t) => t.textContent.trim()),
      hasMethods: /payment method/i.test(document.querySelector('[data-od-id="payouts-page"]').innerText),
      hasSubs: /subscription|lifetime member/i.test(document.querySelector('[data-od-id="payouts-page"]').innerText),
      rows: rows().length,
      heads: [...document.querySelectorAll('[data-table="orders"] thead th')].map((th) => th.textContent.trim()),
      receipts: document.querySelectorAll('.mng-invoice').length,
      range: (document.querySelector('.mng-pager__spacer') || {}).textContent || '',
    }
  })
  const filtered = await billing.evaluate(async () => {
    const box = document.querySelector('[data-od-id="billing-status"]')
    box.value = 'paid'
    box.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    return {
      rows: document.querySelectorAll('[data-table="orders"] tbody tr').length,
      range: document.querySelector('.mng-pager__spacer').textContent,
      statuses: [...document.querySelectorAll('[data-table="orders"] tbody tr')].map((tr) => tr.children[4].textContent.trim()),
    }
  })
  check('billing: the head reads as a billing page', bill.eyebrow === 'Account · Billing' && bill.title === 'Billing', `${bill.eyebrow} · ${bill.title}`)
  check('billing: no payment methods and no subscription block', bill.hasMethods === false && bill.hasSubs === false, `panels: ${bill.panels.join(' · ')}`)
  check('billing: the history lists every order with a receipt action', bill.rows === 6 && bill.receipts === 6 && bill.heads.join() === 'Date,Order,Product,Amount,Status,Receipt', `${bill.rows} rows · ${bill.heads.join(' / ')}`)
  check('billing: the status filter narrows the table and the count', filtered.rows === 4 && filtered.statuses.every((s) => s === 'paid') && filtered.range.includes('of 4'), `${filtered.rows} paid rows · ${filtered.range}`)
  await billing.close()

  const withdrawals = await open('#manage/withdrawals')
  const wd = await withdrawals.evaluate(() => ({
    title: document.querySelector('[data-od-id="page-head-manage"] h1').textContent.trim(),
    total: ((document.querySelector('[data-od-id="total-withdrawn"] .mng-total') || {}).textContent || '').trim(),
    view: [...document.querySelectorAll('.seg__btn')].map((b) => b.textContent.trim()),
    summaryRows: document.querySelectorAll('[data-table="profit-summary"] tbody tr').length,
    summaryHeads: [...document.querySelectorAll('[data-table="profit-summary"] thead th')].map((h) => h.textContent.trim()),
    foot: ((document.querySelector('[data-od-id="profit-summary"] .panel__foot') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
  }))
  const wdHistory = await withdrawals.evaluate(async () => {
    document.querySelector('[data-od-id="withdrawal-view-history"]').click()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    return {
      rows: document.querySelectorAll('[data-table="payouts"] tbody tr').length,
      summaryGone: !document.querySelector('[data-table="profit-summary"]'),
    }
  })
  check('withdrawals: the head reads as a withdrawals page', wd.title === 'Withdrawals', wd.title)
  check('withdrawals: the total withdrawn is the page’s headline figure', wd.total === '$12,950.00', wd.total)
  check('withdrawals: the profit summary lists funded accounts', wd.summaryRows === 1 && wd.summaryHeads.includes('Total withdrawn') && wd.summaryHeads.includes('Next window'), `${wd.summaryRows} row · ${wd.summaryHeads.join(' / ')}`)
  check('withdrawals: the summary reconciles paid plus open profit', /Paid to date \$12,950\.00/.test(wd.foot) && /\$2,640\.00/.test(wd.foot) && /\$15,590\.00/.test(wd.foot), wd.foot.slice(0, 120))
  check('withdrawals: switching to history shows the ledger', wdHistory.rows === 6 && wdHistory.summaryGone, `${wdHistory.rows} ledger rows, summary hidden ${wdHistory.summaryGone}`)
  await withdrawals.close()

  const agreements = await open('#manage/agreements')
  const agr = await agreements.evaluate(() => ({
    heads: [...document.querySelectorAll('[data-table="agreements"] thead th')].map((h) => h.textContent.trim()),
    rows: [...document.querySelectorAll('[data-table="agreements"] tbody tr')].map((tr) => ({
      title: tr.querySelector('.cell-strong').textContent.trim(),
      status: tr.children[1].textContent.trim(),
      effective: tr.children[2].textContent.trim(),
      signed: tr.children[3].textContent.trim(),
      actions: tr.children[4].textContent.replace(/\s+/g, ' ').trim(),
    })),
    panels: [...document.querySelectorAll('[data-od-id="agreements-page"] .panel__title')].map((t) => t.textContent.trim()),
    extra: /account holder|not sure about a clause|limited time|awaiting signature\)\)/i.test(document.querySelector('[data-od-id="agreements-page"]').innerText) ? 'extra panels present' : '',
  }))
  const agrFiltered = await agreements.evaluate(async () => {
    const box = document.querySelector('[data-od-id="agreement-status"]')
    box.value = 'awaiting'
    box.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    return {
      rows: document.querySelectorAll('[data-table="agreements"] tbody tr').length,
      title: document.querySelector('[data-table="agreements"] tbody tr .cell-strong').textContent.trim(),
      action: document.querySelector('[data-table="agreements"] tbody tr').children[4].textContent.replace(/\s+/g, ' ').trim(),
    }
  })
  check('agreements: the page holds one table and nothing else', agr.panels.length === 1 && agr.panels[0] === 'Your agreements' && agr.extra === '', `${agr.panels.join(' · ')}${agr.extra ? ` — ${agr.extra}` : ''}`)
  check('agreements: the table carries the five columns the reference uses', agr.heads.join() === 'Title,Status,Effective date,Signed date,Actions', agr.heads.join(' / '))
  check('agreements: every row states its status and dates', agr.rows.length === 5 && agr.rows.every((r) => /signed|awaiting/.test(r.status) && r.effective && r.signed), agr.rows.map((r) => `${r.title.split(' ')[0]}:${r.status}`).join(' · '))
  check('agreements: only the unsigned one offers to be signed', agr.rows.filter((r) => /sign/i.test(r.actions)).length === 1 && agr.rows.filter((r) => /View/.test(r.actions)).length === 4, agr.rows.map((r) => `${r.title.split(' ')[0]} → ${r.actions || '—'}`).join(' · '))
  check('agreements: the status filter narrows to the unsigned one', agrFiltered.rows === 1 && /Affiliate/.test(agrFiltered.title) && /sign/i.test(agrFiltered.action), `${agrFiltered.rows} row — ${agrFiltered.title} → ${agrFiltered.action}`)
  await agreements.close()

  /* A table wider than its panel is a clipped column, which is how the receipt
     and actions columns first rendered. Measure the fold, not just the page. */
  for (const [hash, table] of [['#manage/billing', 'orders'], ['#manage/agreements', 'agreements'], ['#manage/withdrawals', 'profit-summary']]) {
    const page = await open(hash)
    const fit = await page.evaluate((name) => {
      const wrap = document.querySelector(`[data-table="${name}"]`).closest('.table-wrap')
      const table = wrap.querySelector('table')
      return { panel: Math.round(wrap.clientWidth), table: Math.round(table.scrollWidth), overflow: table.scrollWidth - wrap.clientWidth }
    }, table)
    check(`fit: the ${table} table fits its panel without a hidden column`, fit.overflow <= 1, `${fit.table}px table in a ${fit.panel}px panel`)
    await page.close()
  }

  /* --- the leaderboard, and the five settings sections ------------------- */
  const board = await open('#community/leaderboard')
  const lb = await board.evaluate(() => ({
    tabs: document.querySelectorAll('.tabs .tab').length,
    rows: document.querySelectorAll('[data-table="leaderboard"] tbody tr').length,
    hasCompetitions: /competition/i.test(document.querySelector('[data-od-id="leaderboard-page"]').innerText),
    /* Rendered, not merely present: a stray <template> keeps elements in the DOM
       while painting none of them, which is how this page first shipped. */
    visible: (() => {
      const ov = document.querySelector('[data-od-id="leaderboard-page"]')
      const box = (sel) => {
        const el = document.querySelector(sel)
        return el ? Math.round(el.getBoundingClientRect().height) : 0
      }
      return { ovHeight: Math.round(ov.getBoundingClientRect().height), podium: box('[data-od-id="podium"]'), table: box('[data-od-id="leaderboard-card"]') }
    })(),
    headActions: [...document.querySelectorAll('[data-od-id="page-head-leaderboard"] .btn')].map((b) => b.textContent.trim()),
  }))
  check('leaderboard: the competitions view is gone', lb.tabs === 0 && lb.hasCompetitions === false, `${lb.tabs} tabs, wording present: ${lb.hasCompetitions}`)
  check('leaderboard: the season table still stands', lb.rows > 5 && lb.headActions.join() === 'Season rules', `${lb.rows} rows · actions: ${lb.headActions.join(' / ')}`)
  check('leaderboard: the podium and the table actually paint', lb.visible.podium > 100 && lb.visible.table > 100 && lb.visible.ovHeight > 800, `page ${lb.visible.ovHeight}px · podium ${lb.visible.podium}px · table ${lb.visible.table}px`)
  await board.close()

  const sections = [
    ['settings-profile', 'Personal information', 'personal-information'],
    ['settings-password', 'Password management', 'password-management'],
    ['settings-identity', 'Identity verification', 'identity-verification'],
    ['settings-two-factor', 'Two-factor authentication', 'two-factor'],
    ['settings-notifications', 'Notification preferences', 'notification-preferences'],
  ]
  for (const [shot, title, panel] of sections) {
    const page = await open(shot === 'settings-profile' ? '#settings' : `#settings/${shot.replace('settings-', '')}`)
    const seen = await page.evaluate((id) => ({
      h1: document.querySelector('[data-od-id="page-head-settings"] h1').textContent.trim(),
      body: document.querySelector('[data-od-id="page-head-settings"] .dim').textContent.trim(),
      panel: Boolean(document.querySelector(`[data-od-id="${id}"]`)),
      tabs: [...document.querySelectorAll('.tabs .tab')].map((t) => t.textContent.trim()),
    }), panel)
    check(`settings: ${title} is its own section`, seen.h1 === title && seen.panel, `${seen.h1} — panel ${seen.panel}`)
    if (shot === 'settings-profile') {
      const fields = await page.evaluate(() => {
        const panel = document.querySelector('[data-od-id="personal-information"]')
        const inputs = [...panel.querySelectorAll('input')]
        return {
          count: inputs.length,
          labels: [...panel.querySelectorAll('label')].map((l) => l.textContent.trim()),
          blanks: inputs.filter((i) => !i.value).length,
          tabs: document.querySelectorAll('.tabs .tab').length,
        }
      })
      check('settings: the personal form carries the reference\'s fields', fields.count === 10 && fields.labels.includes('Nickname') && fields.labels.includes('Phone'), `${fields.count} inputs · ${fields.labels.join(', ')}`)
      check('settings: it leaves the fields the desk does not hold blank', fields.blanks === 6, `${fields.blanks} of ${fields.count} blank (last name, date of birth, address, city, zip, state)`)
      check('settings: five sections share the tab strip', fields.tabs === 5, `${fields.tabs} tabs`)
    }
    if (shot === 'settings-password') {
      const pw = await page.evaluate(async () => {
        const box = document.querySelector('#pw-next')
        const rules = () => [...document.querySelectorAll('.stg-rules li')].map((li) => li.className.includes('is-ok'))
        box.value = 'Abcdefg1'
        box.dispatchEvent(new Event('input', { bubbles: true }))
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        const after = rules()
        /* the eye that belongs to this field, not the first one on the page */
        const eye = document.querySelector('#pw-next').closest('.stg-secret').querySelector('.stg-secret__eye')
        const before = document.querySelector('#pw-next').type
        eye.click()
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        return { rules: rules().length, after, toggled: [before, document.querySelector('#pw-next').type] }
      })
      check('settings: the password rules check the field as you type', pw.rules === 4 && pw.after.every(Boolean), `${pw.after.filter(Boolean).length} of ${pw.rules} met for "Abcdefg1"`)
      check('settings: the eye reveals and hides the field', pw.toggled.join('→') === 'password→text', pw.toggled.join('→'))
    }
    if (shot === 'settings-two-factor') {
      const rows = await page.evaluate(() => document.querySelectorAll('[data-od-id="two-factor"] .stg-row').length)
      check('settings: two-factor lists the reference\'s four rows', rows === 4, `${rows} rows`)
    }
    if (shot === 'settings-identity') {
      const verify = await page.evaluate(() => ({
        title: document.querySelector('.stg-verify__title').textContent.trim(),
        facts: document.querySelectorAll('[data-od-id="verification-facts"] .stg-fact').length,
        faq: (document.querySelector('[data-od-id="verification-help"] a') || {}).getAttribute ? document.querySelector('[data-od-id="verification-help"] a').getAttribute('href') : '',
      }))
      check('settings: identity shows the account\'s own state', verify.title === 'Identity verified' && verify.facts === 3 && verify.faq === '#help/faq', `${verify.title} · ${verify.facts} facts · FAQ ${verify.faq}`)

      /* `.panel` is a flex column, and two row-shaped blocks inherited it: the
         fact cards stacked their mark above their text and the help strip put
         its mark on a line of its own. Measure the boxes, not the markup. */
      const rowLayout = await page.evaluate(() => {
        const kids = (sel) => [...document.querySelector(sel).children].map((el) => {
          const r = el.getBoundingClientRect()
          return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }
        })
        const strip = document.querySelector('[data-od-id="verification-help"]')
        return { fact: kids('.stg-fact'), help: kids('[data-od-id="verification-help"]'), stripH: Math.round(strip.getBoundingClientRect().height) }
      })
      const beside = (a, b) => b.x >= a.x + a.w - 1
      check(
        'settings: the verification cards put the mark beside the text',
        beside(rowLayout.fact[0], rowLayout.fact[1]) && rowLayout.fact[0].y === rowLayout.fact[1].y,
        rowLayout.fact.map((k) => `x${k.x} y${k.y}`).join(' · '),
      )
      check(
        'settings: the help strip is one line, action on the right',
        beside(rowLayout.help[0], rowLayout.help[1]) && beside(rowLayout.help[1], rowLayout.help[2]) && rowLayout.stripH < 120,
        `strip ${rowLayout.stripH}px · ${rowLayout.help.map((k) => `x${k.x}`).join(' → ')}`,
      )
    }
    await page.close()
  }

  /* An old competitions link opens the leaderboard instead of dead-ending. */
  const retiredComp = await open('#community/competitions')
  const onBoard = await retiredComp.evaluate(() => Boolean(document.querySelector('[data-od-id="leaderboard-page"]')))
  check('leaderboard: an old competitions link opens the leaderboard', onBoard === true)
  await retiredComp.close()

  /* --- payout methods: two rails, one row each --------------------------- */
  const methods = await open('#manage/methods')
  const mth = await methods.evaluate(() => {
    /* `method-list` is the panel itself, so the rows are their own class */
    const rows = [...document.querySelectorAll('.mth-row')]
    return {
      title: document.querySelector('[data-od-id="page-head-manage"] h1').textContent.trim(),
      rows: rows.length,
      names: rows.map((r) => r.querySelector('.mth-row__id b').textContent.trim()),
      facts: rows.map((r) => [...r.querySelectorAll('.mth-row__fact')].map((f) => `${f.querySelector('em').textContent.trim()} ${f.querySelector('b').textContent.trim()}`).join(' · ')),
      defaults: rows.filter((r) => r.classList.contains('is-default')).length,
      actions: rows.map((r) => [...r.querySelectorAll('.mth-row__actions button, .mth-row__actions .badge')].map((b) => b.textContent.trim()).join(' / ')),
      panels: document.querySelectorAll('[data-od-id="payouts-page"] .panel').length,
      onePanel: document.querySelector('[data-od-id="method-list"]').classList.contains('panel'),
      text: document.querySelector('[data-od-id="manage-tab-methods"]') ? document.querySelector('[data-od-id="payouts-page"]').innerText.replace(/\s+/g, ' ') : '',
    }
  })
  check('methods: two rails, presented as rows not cards', mth.rows === 2 && mth.panels === 1 && mth.onePanel && mth.names.join() === 'RisePay,Crypto', `${mth.rows} rows across ${mth.panels} panel — ${mth.names.join(' · ')}`)
  check('methods: the rails that were dropped are gone', !/paypal|bank transfer/i.test(mth.text), /paypal|bank transfer/i.test(mth.text) ? 'still mentioned' : 'no PayPal, no bank transfer')
  check('methods: each row states its fee and settlement', mth.facts.every((f) => /Fee /.test(f) && /Settlement /.test(f)), mth.facts.join(' | '))
  check('methods: exactly one rail is the default', mth.defaults === 1 && mth.actions[0].includes('default') && mth.actions[1].includes('Set as default'), mth.actions.join(' | '))
  await methods.close()

  /* --- the footer is a link row ----------------------------------------- */
  const foot = await open('#overview')
  const footInfo = await foot.evaluate(() => {
    const links = [...document.querySelectorAll('.foot-note__links a')].map((a) => ({ label: a.textContent.trim(), href: a.getAttribute('href') }))
    const fine = document.querySelector('.foot-note__fine')
    const row = document.querySelector('.foot-note__links').getBoundingClientRect()
    return {
      links,
      fine: fine.textContent.replace(/\s+/g, ' ').trim(),
      fineTop: Math.round(fine.getBoundingClientRect().top),
      rowBottom: Math.round(row.bottom),
      rowH: Math.round(row.height),
      targets: links.every((l) => ['#manage/agreements', '#help/support', '#help/faq'].includes(l.href)),
    }
  })
  check('footer: the four links from the reference, in order', footInfo.links.map((l) => l.label).join(' · ') === 'Terms & conditions · Privacy policy · Contact us · Help centre', footInfo.links.map((l) => l.label).join(' · '))
  check('footer: every link goes somewhere that exists', footInfo.targets, footInfo.links.map((l) => `${l.label}→${l.href}`).join(' '))
  check('footer: the disclosure sits under the links, not beside them', footInfo.fineTop > footInfo.rowBottom && footInfo.rowH < 40, `row ${footInfo.rowH}px, disclosure starts ${footInfo.fineTop - footInfo.rowBottom}px below`)
  check('footer: the simulated-environment note is intact', /Simulated environment/.test(footInfo.fine) && /not a broker/.test(footInfo.fine), footInfo.fine.slice(0, 70))
  await foot.close()

  /* --- support and FAQ are redirect cards, and the user menu works -------- */
  for (const [shot, title, where, cta] of [['support', 'Support', 'support', 'Open support'], ['faq', 'FAQ', 'faq', 'Open FAQ']]) {
    const page = await open(`#help/${where}`)
    const seen = await page.evaluate(() => {
      const card = document.querySelector('.hls-card')
      const panel = card.getBoundingClientRect()
      return {
        h1: document.querySelector('[data-od-id="page-head-help"] h1').textContent.trim(),
        sub: document.querySelector('[data-od-id="page-head-help"] .dim').textContent.trim(),
        cardTitle: card.querySelector('.hls-card__title').textContent.trim(),
        cardBody: card.querySelector('.hls-card__body').textContent.trim(),
        cta: card.querySelector('.btn').textContent.trim(),
        cards: document.querySelectorAll('.hls-card').length,
        panels: document.querySelectorAll('[data-od-id="help-page"] .panel').length,
        height: Math.round(panel.height),
        forms: document.querySelectorAll('[data-od-id="help-page"] input, [data-od-id="help-page"] textarea, [data-od-id="help-page"] table').length,
        text: document.querySelector('[data-od-id="help-page"]').innerText.replace(/\s+/g, ' '),
      }
    })
    check(`help: ${title} is one redirect card`, seen.h1 === title && seen.cards === 1 && seen.panels === 1 && seen.height > 150, `${seen.h1} — ${seen.panels} panel, ${seen.height}px`)
    check(`help: ${title} reads as the reference does`, seen.cardTitle === title && seen.cta === cta && seen.cardBody.length > 30, `${seen.cardTitle} · "${seen.cardBody}" · ${seen.cta}`)
    check(`help: ${title} carries no form, list or desk panel`, seen.forms === 0 && !/ticket|discord|platform|median reply/i.test(seen.text), seen.forms === 0 ? 'no form, list or table' : `${seen.forms} form elements`)
    await page.close()
  }

  /* The user menu: every row has to lead somewhere that exists, and the panel
     has to close behind it. */
  const top = await open('#overview')
  const menu = await top.evaluate(async () => {
    const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    document.querySelector('[data-od-id="topbar-avatar"]').click()
    await wait()
    const rows = [...document.querySelectorAll('.menu__item')].map((b) => ({ label: b.textContent.trim(), click: true }))
    const before = document.querySelectorAll('.menu').length
    return { rows, before }
  })
  const items = ['Settings', 'Billing', 'FPT Learn', 'Support', 'Your accounts']
  check('user menu: the rows match the portal as it is now', items.every((i) => menu.rows.some((r) => r.label === i)), menu.rows.map((r) => r.label).join(' · '))
  const afterClick = await top.evaluate(async () => {
    const wait = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    const row = [...document.querySelectorAll('.menu__item')].find((b) => b.textContent.trim() === 'Support')
    row.click()
    await wait()
    return { menus: document.querySelectorAll('.menu').length, hash: location.hash }
  })
  check('user menu: picking a row closes the panel and moves the hash', afterClick.menus === 0 && afterClick.hash === '#help/support', `${afterClick.menus} menus open · hash ${afterClick.hash}`)
  await top.close()

  /* --- the same invariant on the pages this turn did not touch ----------- */
  for (const hash of ['#overview', '#accounts', '#market/news', '#tools/sizer', '#tools/platforms', '#learn', '#community/leaderboard', '#manage/withdrawals', '#manage/methods', '#manage/billing', '#manage/agreements', '#settings', '#help/faq', '#community/affiliates']) {
    const page = await open(hash)
    const fit = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, view: window.innerWidth }))
    check(`no sideways page on ${hash}`, fit.page <= fit.view, `${fit.page}px in a ${fit.view}px viewport`)
    await page.close()
  }

  /* --- objectives, renamed but reachable on the old hash ---------------- */
  const objectives = await open('#account/412907/rules')
  const heading = await objectives.evaluate(() => ((document.querySelector('#acc-rules .acc-section__title') || {}).textContent || '').trim())
  check('the old /rules hash still lands on the Objectives section', heading === 'Objectives', heading)
  await objectives.close()

  /* A retired deep link must not leave the reader nowhere. */
  const retired = await open('#account/412907/score')
  const fallback = await retired.evaluate(() => ({
    active: ((document.querySelector('.acc-tabs .is-current') || {}).textContent || '').trim(),
    scrolled: Math.round(window.scrollY),
  }))
  check('a retired /score link falls back to Overview', fallback.active === 'Overview' && fallback.scrolled < 40, JSON.stringify(fallback))
  await retired.close()

  if (!checkOnly) shots.push(...(await shootHarness()))
} finally {
  await browser.close()
  server.close()
}

const failed = checks.filter((c) => !c.pass)
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `\n        ${c.detail}` : ''}`)
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`)
if (shots.length) console.log(`screenshots in RECON/screenshots/: ${shots.join(', ')}`)
process.exit(failed.length ? 1 : 0)
