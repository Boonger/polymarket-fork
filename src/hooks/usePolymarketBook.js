import { useEffect, useRef, useState } from 'react'

const WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market'
const SILENCE_TIMEOUT_MS = 20000 // если поток "тихо" завис — реконнект
const FLUSH_MS = 200 // максимум ~5 ре-рендеров/сек, независимо от частоты сообщений WS

function levelsFromMap(map, side, depth = 10) {
  const arr = Array.from(map.entries())
    .filter(([, size]) => size > 0)
    .map(([price, size]) => ({ price: parseFloat(price), size }))
  arr.sort((a, b) => (side === 'bid' ? b.price - a.price : a.price - b.price))
  let cum = 0
  return arr.slice(0, depth).map((l) => {
    cum += l.size
    return { price: l.price, qty: Math.round(l.size), total: Math.round(cum) }
  })
}

/**
 * Реальный ордербук + лента сделок из публичного market-канала CLOB
 * Polymarket. Подписка по assets_ids (token id обоих исходов — Up/Down),
 * без авторизации, чисто чтение.
 *
 * ВАЖНО про память: раньше каждое сообщение WS сразу вызывало ре-рендер
 * (forceTick на каждый price_change). В волатильные моменты таких
 * сообщений может быть много в секунду — за 15 минут это тысячи полных
 * ре-рендеров стакана и ленты. Теперь сообщения только копятся в
 * буфер/Map, а единый setInterval раз в 200мс решает, применять ли их
 * к состоянию — рендер ограничен ~5 раз/сек вне зависимости от частоты
 * входящих данных.
 */
export function usePolymarketBook(upTokenId, downTokenId) {
  const [connected, setConnected] = useState(false)
  const [trades, setTrades] = useState([])
  const [, forceTick] = useState(0)

  const wsRef = useRef(null)
  const pingRef = useRef(null)
  const watchdogRef = useRef(null)
  const flushRef = useRef(null)
  const booksRef = useRef({})
  const dirtyRef = useRef(false)
  const pendingTradesRef = useRef([])
  const tradeSeq = useRef(0)

  useEffect(() => {
    if (!upTokenId || !downTokenId) {
      setConnected(false)
      return
    }

    let cancelled = false
    booksRef.current = {
      [upTokenId]: { bids: new Map(), asks: new Map() },
      [downTokenId]: { bids: new Map(), asks: new Map() },
    }
    dirtyRef.current = false
    pendingTradesRef.current = []

    function armWatchdog() {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = setTimeout(() => {
        wsRef.current?.close() // молчание дольше таймаута — принудительный реконнект
      }, SILENCE_TIMEOUT_MS)
    }

    function handleEvent(msg) {
      const assetId = msg.asset_id
      const book = booksRef.current[assetId]
      if (!book) return

      if (msg.event_type === 'book') {
        book.bids = new Map((msg.bids || []).map((l) => [l.price, parseFloat(l.size)]))
        book.asks = new Map((msg.asks || []).map((l) => [l.price, parseFloat(l.size)]))
        dirtyRef.current = true
      } else if (msg.event_type === 'price_change') {
        const changes = msg.price_changes || msg.changes || []
        for (const pc of changes) {
          const side = pc.side === 'BUY' ? 'bids' : 'asks'
          const size = parseFloat(pc.size)
          if (!size) book[side].delete(pc.price)
          else book[side].set(pc.price, size)
        }
        dirtyRef.current = true
      } else if (msg.event_type === 'last_trade_price') {
        tradeSeq.current += 1
        pendingTradesRef.current.push({
          id: tradeSeq.current,
          ts: new Date(),
          side: msg.side === 'BUY' ? 'BUY' : 'SELL',
          outcome: assetId === upTokenId ? 'UP' : 'DOWN',
          price: parseFloat(msg.price),
          qty: Math.round(parseFloat(msg.size)),
        })
        dirtyRef.current = true
      }
    }

    // единая точка ре-рендера — вместо форс-тика на каждое сообщение
    flushRef.current = setInterval(() => {
      if (!dirtyRef.current) return
      dirtyRef.current = false
      if (pendingTradesRef.current.length) {
        setTrades((prev) => [...pendingTradesRef.current.reverse(), ...prev].slice(0, 200))
        pendingTradesRef.current = []
      }
      forceTick((t) => t + 1)
    }, FLUSH_MS)

    function connect() {
      if (cancelled) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        armWatchdog()
        ws.send(JSON.stringify({
          assets_ids: [upTokenId, downTokenId],
          type: 'market',
          custom_feature_enabled: true,
        }))
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('PING')
        }, 10000)
      }

      ws.onmessage = (evt) => {
        armWatchdog()
        if (evt.data === 'PONG') return
        let payload
        try { payload = JSON.parse(evt.data) } catch { return }
        const messages = Array.isArray(payload) ? payload : [payload]
        messages.forEach(handleEvent)
      }

      ws.onclose = () => {
        setConnected(false)
        clearInterval(pingRef.current)
        clearTimeout(watchdogRef.current)
        if (!cancelled) setTimeout(connect, 2000)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      cancelled = true
      clearInterval(pingRef.current)
      clearInterval(flushRef.current)
      clearTimeout(watchdogRef.current)
      wsRef.current?.close()
    }
  }, [upTokenId, downTokenId])

  const upBook = booksRef.current[upTokenId] || { bids: new Map(), asks: new Map() }
  const downBook = booksRef.current[downTokenId] || { bids: new Map(), asks: new Map() }

  return {
    connected,
    trades,
    up: { bids: levelsFromMap(upBook.bids, 'bid'), asks: levelsFromMap(upBook.asks, 'ask') },
    down: { bids: levelsFromMap(downBook.bids, 'bid'), asks: levelsFromMap(downBook.asks, 'ask') },
  }
}
