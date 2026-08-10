import { useEffect, useState } from 'react'
import { resolveMarket } from '../utils/polymarketSlug'

/**
 * Держит "текущий активный рынок" для пары (asset, interval): резолвит
 * его через Gamma API и сам переключается на следующее окно, когда
 * текущее истекает — компонентам выше не нужно об этом думать.
 */
export function usePolymarketMarket(asset, interval) {
  const [market, setMarket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    let timer = null
    setLoading(true)
    setMarket(null)

    async function tick() {
      try {
        const m = await resolveMarket(asset, interval)
        if (cancelled) return
        if (m && m.upTokenId && m.downTokenId) {
          setMarket(m)
          setError(null)
          setLoading(false)
          const delay = Math.max(2000, m.windowEnd - Date.now() + 1500)
          timer = setTimeout(tick, delay)
        } else {
          setError('Рынок ещё не проиндексирован Gamma API, повтор через 3с…')
          timer = setTimeout(tick, 3000)
        }
      } catch (e) {
        if (!cancelled) {
          setError('Ошибка запроса к Gamma API, повтор через 5с…')
          timer = setTimeout(tick, 5000)
        }
      }
    }

    tick()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [asset, interval])

  return { market, loading, error }
}
