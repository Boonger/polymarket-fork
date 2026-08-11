import { useEffect, useState } from 'react'
import Header from './components/Header'
import Tape from './components/Tape'
import PriceChart from './components/PriceChart'
import OrderBook from './components/OrderBook'
import TransactionLog from './components/TransactionLog'
import { usePolymarketMarket } from './hooks/usePolymarketMarket'
import { usePolymarketBook } from './hooks/usePolymarketBook'
import { usePriceHistory } from './hooks/usePriceHistory'

const ASSET = 'btc'

export default function App() {
  const [interval, setInterval_] = useState('5m')
  const [msLeft, setMsLeft] = useState(0)

  const { market, error: marketError } = usePolymarketMarket(ASSET, interval)
  const { up, down, trades, connected: bookConnected } = usePolymarketBook(
    market?.upTokenId,
    market?.downTokenId
  )
  const { points, price, openValue, loading: priceLoading, error: priceError } = usePriceHistory(market, interval)

  useEffect(() => {
    const id = setInterval(() => {
      if (market) setMsLeft(Math.max(0, market.windowEnd - Date.now()))
    }, 500)
    return () => clearInterval(id)
  }, [market])

  return (
    <div className="app">
      <Tape trades={trades} />
      <Header interval={interval} setInterval={setInterval_} connected={bookConnected} />
      <div className="layout">
        <PriceChart
          interval={interval}
          points={points}
          price={price}
          openValue={openValue}
          strikePrice={openValue}
          msLeft={msLeft}
          loading={priceLoading}
          error={priceError}
        />
        <OrderBook up={up} down={down} marketTitle={market?.title} connected={bookConnected} />
        <TransactionLog trades={trades} connected={bookConnected} />
      </div>
      {marketError && <div className="market-error-banner glass mono">{marketError}</div>}
    </div>
  )
}
