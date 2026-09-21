#!/usr/bin/env node
/*
 * Snapshot the Google News "Business" topic into `src/data/newsroom.json`,
 * pulling each article's own thumbnail into `assets/news/` on the way.
 *
 *   node scripts/fetch-news.mjs                      # fetch the topic live
 *   node scripts/fetch-news.mjs --html saved.html    # parse a saved copy
 *   node scripts/fetch-news.mjs --limit 90
 *
 * The RSS feed for the same topic is text-only — no images at all — so the
 * thumbnails come from the topic's server-rendered HTML, where every article
 * card carries its own `/api/attachments/...` image next to a `./read/<id>`
 * link. Titles, publishers and images are joined on that article id.
 *
 * Images belong to the publishers. They are pulled in for this local prototype
 * with the source named on every card and a link back to the article; they are
 * not for republication. See NOTES.md.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const TOPIC =
  'https://news.google.com/topics/CAAqKggKIiRDQkFTRlFvSUwyMHZNRGx6TVdZU0JXVnVMVlZUR2dKVlV5Z0FQAQ?hl=en-US&gl=US&ceid=US:en'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i > -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback
}

const LIMIT = Number(flag('limit', 60))
const SAVED = flag('html', null)
const IMG_DIR = 'assets/news'
const OUT = 'src/data/newsroom.json'

/* Google's article ids run past 200 characters, which overflows a filename once
   Vite appends its own hash — a short digest of the id keeps names stable and
   from one run to the next. */
const fileFor = (id) => `${createHash('sha1').update(id).digest('hex').slice(0, 12)}.jpg`

const decode = (s = '') =>
  s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&rsquo;/g, '\u2019')

const text = (s = '') => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

async function loadHtml() {
  if (SAVED) return readFile(SAVED, 'utf8')
  const res = await fetch(TOPIC, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
  })
  if (!res.ok) throw new Error(`topic fetch failed: ${res.status} ${res.statusText}`)
  return res.text()
}

/* Each article is an image anchor followed by a text anchor carrying the same
   `./read/<id>`; splitting on the anchor keeps the document order intact. */
function parse(html) {
  const segments = html.split(/(?=<a[^>]+href="\.\/read\/)/)
  const images = new Map()
  const meta = new Map()
  const titles = new Map()

  /* Every article has two anchors sharing one id: the first carries the figure,
     the publisher and the timestamp, the second carries the headline. */
  for (const seg of segments) {
    const id = (seg.match(/^<a[^>]+href="\.\/read\/([^"?]+)/) || [])[1]
    if (!id) continue

    const img = seg.match(/\/api\/attachments\/[A-Za-z0-9_=-]+-w280-h168-p-df-rw/)
    if (img) {
      const source = (seg.match(/class="vr1PYe"[^>]*>([^<]+)</) || [])[1]
      const when = seg.match(/<time[^>]*datetime="([^"]+)"[^>]*>([^<]*)</)
      images.set(id, img[0])
      meta.set(id, {
        source: source ? text(source) : '',
        publishedAt: when ? when[1] : '',
        ago: when ? text(when[2]) : '',
      })
    }

    const title = text((seg.match(/^<a[^>]*>([\s\S]*?)<\/a>/) || [])[1] || '')
    if (title.length > 24) {
      titles.set(id, title)
      /* The timestamp trails the headline anchor rather than the figure. */
      const when = seg.match(/<time[^>]*datetime="([^"]+)"[^>]*>([^<]*)</)
      if (when) {
        meta.set(id, { ...(meta.get(id) || {}), publishedAt: when[1], ago: text(when[2]) })
      }
    }
  }

  const articles = [...titles].map(([id, title]) => ({
    id,
    title,
    source: meta.get(id)?.source || '',
    publishedAt: meta.get(id)?.publishedAt || '',
    ago: meta.get(id)?.ago || '',
  }))

  return { images, meta, articles }
}

const html = await loadHtml()
const { images, meta, articles } = parse(html)

const seen = new Set()
const picked = articles
  .filter((a) => images.has(a.id) && !seen.has(a.id) && seen.add(a.id))
  .slice(0, LIMIT)

if (!picked.length) {
  console.error('No articles with images found — the page markup may have changed.')
  process.exit(1)
}

await mkdir(IMG_DIR, { recursive: true })

const out = []
let saved = 0
for (const a of picked) {
  const oneX = images.get(a.id)
  const twoX = oneX.replace('-w280-h168-p-df-rw', '-w560-h336-p-df-rw')
  const file = fileFor(a.id)
  try {
    const res = await fetch(`https://news.google.com${twoX}`, {
      headers: { 'user-agent': UA, referer: TOPIC },
    })
    if (!res.ok) continue
    await writeFile(path.join(IMG_DIR, file), Buffer.from(await res.arrayBuffer()))
    saved += 1
    out.push({
      id: a.id,
      title: a.title,
      source: a.source || 'Google News',
      publishedAt: a.publishedAt,
      ago: a.ago,
      url: `https://news.google.com/read/${a.id}`,
      image: file,
      width: 560,
      height: 336,
    })
  } catch {
    /* one missing thumbnail should not lose the snapshot */
  }
}

/* Drop thumbnails no longer referenced so the folder does not grow forever. */
const keep = new Set(out.map((a) => a.image))
for (const name of await readdir(IMG_DIR)) {
  if (name.endsWith('.jpg') && !keep.has(name)) await rm(path.join(IMG_DIR, name))
}

await writeFile(OUT, `${JSON.stringify({
  fetchedAt: new Date().toISOString(),
  feed: 'Google News · Business',
  topic: TOPIC,
  articles: out,
}, null, 2)}\n`)

console.log(`${out.length} articles snapshotted (${saved} thumbnails) -> ${OUT}`)
console.log(`images -> ${IMG_DIR}/`)
