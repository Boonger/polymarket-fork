const GAMMA = 'https://gamma-api.polymarket.com'

export const INTERVALS = {
  '5m': { seconds: 300, label: '5M', variant: 'fiveminute', twapLookback: 30, pollMs: 30000 },
  '15m': { seconds: 900, label: '15M', variant: 'fifteenminute', twapLookback: 30, pollMs: 30000 },
  '4h': { seconds: 14400, label: '4H', variant: 'fourhour', twapLookback: 60, pollMs: 60000 },
}

/**
 * 5m / 15m — формат slug подтверждён и стабилен: btc-updown-5m-{unix_ts},
 * где ts кратен длине окна и берётся во floor от UTC-времени. Никакого
 * обращения к часовым поясам не требуется.
 */
function fastSlug(asset, interval) {
  const seconds = INTERVALS[interval].seconds
  const windowStart = Math.floor(Date.now() / 1000 / seconds) * seconds
  return {
    slug: `${asset}-updown-${interval}-${windowStart}`,
    windowStart: windowStart * 1000,
    windowEnd: (windowStart + seconds) * 1000,
  }
}

async function fetchBySlug(slug) {
  const res = await fetch(`${GAMMA}/events?slug=${slug}`)
  if (!res.ok) return null
  const data = await res.json()
  return Array.isArray(data) && data.length ? data[0] : null
}

/**
 * 4h — как и 1h/1d, слаг завязан на Eastern Time (плавающий сдвиг из-за
 * DST), и формат по наблюдениям сообщества менялся. Строить его вручную
 * ненадёжно, поэтому ищем среди активных ивентов Gamma по названию и
 * окну [startDate, endDate], содержащему текущий момент.
 */
async function searchActiveMarket(asset, interval) {
  const assetName = asset === 'btc' ? 'bitcoin' : 'ethereum'
  const res = await fetch(
    `${GAMMA}/events?active=true&closed=false&order=startDate&ascending=false&limit=100`
  )
  if (!res.ok) return null
  const events = await res.json()
  const now = Date.now()

  const candidates = events.filter((e) => {
    const title = (e.title || '').toLowerCase()
    const slug = (e.slug || '').toLowerCase()
    if (!title.includes(assetName) || !title.includes('up or down')) return false
    if (interval === '4h') {
      return slug.includes('-4h-') || title.includes('4 hour') || title.includes('4-hour')
    }
    return true
  })

  const withinWindow = candidates.find((e) => {
    const start = new Date(e.startDate).getTime()
    const end = new Date(e.endDate).getTime()
    return now >= start && now <= end
  })
  return withinWindow ?? candidates[0] ?? null
}

function normalizeEvent(event, windowStart, windowEnd) {
  const market = event.markets?.[0] ?? event
  let tokenIds = []
  let outcomes = ['Up', 'Down']
  try { tokenIds = JSON.parse(market.clobTokenIds || '[]') } catch { /* noop */ }
  try { outcomes = JSON.parse(market.outcomes || '["Up","Down"]') } catch { /* noop */ }

  const upIdx = outcomes.findIndex((o) => /up/i.test(o))
  const downIdx = outcomes.findIndex((o) => /down/i.test(o))

  return {
    slug: event.slug,
    title: event.title || event.slug,
    windowStart,
    windowEnd,
    upTokenId: tokenIds[upIdx >= 0 ? upIdx : 0],
    downTokenId: tokenIds[downIdx >= 0 ? downIdx : 1],
  }
}

export async function resolveMarket(asset, interval) {
  if (interval === '5m' || interval === '15m') {
    const { slug, windowStart, windowEnd } = fastSlug(asset, interval)
    const event = await fetchBySlug(slug)
    if (!event) return null
    return normalizeEvent(event, windowStart, windowEnd)
  }

  const event = await searchActiveMarket(asset, interval)
  if (!event) return null
  const windowStart = new Date(event.startDate).getTime()
  const windowEnd = new Date(event.endDate).getTime()
  return normalizeEvent(event, windowStart, windowEnd)
}
