import { useEffect, useRef, useState } from 'react'
import { INTERVALS } from '../utils/polymarketSlug'

const BASE = 'https://polymarket.com/api/crypto/price-history'

/**
 * Источник данных для графика — НЕ Binance. Это тот же Chainlink TWAP,
 * на котором резолвится сам рынок Polymarket, через их внутренний
 * (недокументированный) роут polymarket.com/api/crypto/price-history.
 *
 * variant для 5m/15m ("fiveminute"/"fifteenminute") подтверждён примером
 * из задачи. variant для 4h ("fourhour") — экстраполяция по аналогии,
 * т.к. публичной документации на этот роут нет. Если Polymarket
 * использует другое имя, здесь будет пусто/ошибка — тогда стоит
 * посмотреть вкладку Network на polymarket.com при открытой 4H-карте
 * и поправить INTERVALS['4h'].variant в utils/polymarketSlug.js.
 *
 * Опрашивается раз в 30с (5m/15m) или 60с (4h) — это НАМЕРЕННО редко:
 * предыдущая версия дёргала re-render на каждый Binance-трейд (десятки
 * раз в секунду), что и раздувало память за счёт постоянной перерисовки
 * графика. Поллинг вместо стрима убирает эту нагрузку полностью.
 */
export function usePriceHistory(market, interval) {
  const [points, setPoints] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!market) return
    let cancelled = false
    let timer = null
    const cfg = INTERVALS[interval]

    async function poll() {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const startIso = new Date(market.windowStart).toISOString()
      const endIso = new Date(Math.min(Date.now(), market.windowEnd)).toISOString()
      const url = `${BASE}?symbol=BTC&eventStartTime=${encodeURIComponent(startIso)}` +
        `&variant=${cfg.variant}&endDate=${encodeURIComponent(endIso)}` +
        `&twapEnabled=true&twapLookbackSeconds=${cfg.twapLookback}`

      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        if (Array.isArray(data) && data.length) {
          setPoints(data)
          setError(null)
        } else {
          setError('Пустой ответ price-history (рынок только что открылся?)')
        }
      } catch (e) {
        if (!cancelled && e.name !== 'AbortError') {
          setError('Не удалось получить TWAP price-history (проверь variant/CORS)')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    setPoints([])
    poll()
    timer = setInterval(poll, cfg.pollMs)

    return () => {
      cancelled = true
      clearInterval(timer)
      abortRef.current?.abort()
    }
  }, [market?.slug, interval])

  const last = points[points.length - 1]
  const first = points[0]

  return {
    points,
    price: last?.value ?? null,
    openValue: first?.value ?? null,
    loading,
    error,
  }
}
