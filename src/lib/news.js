/*
 * Newsroom source.
 *
 * `src/data/newsroom.json` is a dated snapshot written by `npm run news`
 * (scripts/fetch-news.mjs) from the Google News Business topic. The thumbnails
 * it references live in `assets/news/` and are resolved through the glob below
 * so Vite emits each one for the production build.
 *
 * The snapshot is deliberately not fetched in the browser: the feed has no CORS
 * headers, and a snapshot keeps the page fast and offline-safe. A card always
 * opens the publisher's own article in a new tab.
 */
import snapshot from '../data/newsroom.json'

const thumbs = import.meta.glob('../../assets/news/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const articles = snapshot.articles.map((a) => ({
  ...a,
  image: thumbs[`../../assets/news/${a.image}`] || '',
}))

const sources = [...new Set(articles.map((a) => a.source).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b))

export const newsroom = {
  feed: snapshot.feed,
  topic: snapshot.topic,
  fetchedAt: snapshot.fetchedAt,
  articles,
  sources,
}

/* Relative label from an absolute instant, so a stale snapshot keeps telling
   the truth instead of repeating the feed's wording from capture time. */
export function timeAgo(iso) {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} d ago`
}
