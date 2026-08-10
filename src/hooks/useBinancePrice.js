import { useEffect, useRef, useState } from 'react'

/**
 * Подключается к публичному Binance WebSocket (без ключей, без бэкенда)
 * и отдаёт живую цену + скользящее окно свечей 1m для графика.
 * Реконнект с backoff, т.к. соединение периодически закрывается провайдером.
 */
export function useBinancePrice(symbol = 'btcusdt', maxCandles = 120) {
  const [price, setPrice] = useState(null)
  const [prevClose, setPrevClose] = useState(null)
  const [candles, setCandles] = useState([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)
  const attemptRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    function connect() {
      if (cancelled) return
      const streams = `${symbol}@trade/${symbol}@kline_1m`
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`)
      wsRef.current = ws

      ws.onopen = () => {
        attemptRef.current = 0
        setConnected(true)
      }

      ws.onmessage = (evt) => {
        try {
          const { stream, data } = JSON.parse(evt.data)
          if (stream.endsWith('@trade')) {
            const p = parseFloat(data.p)
            setPrice((prev) => {
              if (prev != null) setPrevClose(prev)
              return p
            })
          } else if (stream.endsWith('@kline_1m')) {
            const k = data.k
            setCandles((prev) => {
              const next = [...prev]
              const point = {
                time: k.t,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
              }
              const last = next[next.length - 1]
              if (last && last.time === point.time) {
                next[next.length - 1] = point
              } else {
                next.push(point)
                if (next.length > maxCandles) next.shift()
              }
              return next
            })
          }
        } catch (e) {
          // игнорируем некорректные фреймы
        }
      }

      ws.onclose = () => {
        if (cancelled) return
        setConnected(false)
        const delay = Math.min(1000 * 2 ** attemptRef.current, 15000)
        attemptRef.current += 1
        reconnectRef.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      cancelled = true
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [symbol, maxCandles])

  return { price, prevClose, candles, connected }
}
