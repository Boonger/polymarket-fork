import { useEffect, useState } from 'react'
import Header from './components/Header'
import Tape from './components/Tape'
import PriceChart from './components/PriceChart'
import OrderBook from './components/OrderBook'
import TransactionLog from './components/TransactionLog'
import { useBinancePrice } from './hooks/useBinancePrice'
import { usePolymarketMarket } from './hooks/usePolymarketMarket'
import { usePolymarketBook } from './hooks/usePolymarketBook'

const ASSETS = {
  BTCUSDT: { asset: 'btc', symbol: 'btcusdt' },
  ETHUSDT: { asset: 'eth', symbol: 'ethusdt' },
}

export default function App() {
  const [marketKey, setMarketKey] = useState('BTCUSDT')
  const [interval, setInterval_] = useState('5m')
  const [range, setRange] = useState('30')
  const [strikePrice, setStrikePrice] = useState(null)
  const [msLeft, setMsLeft] = useState(0)

  const { asset, symbol } = ASSETS[marketKey]
  const { price, prevClose, candles, connected: priceConnected } = useBinancePrice(symbol)
  const { market, error: marketError } = usePolymarketMarket(asset, interval)
  const { up, down, trades, connected: bookConnected } = usePolymarketBook(
    market?.upTokenId,
    market?.downTokenId
  )

  // страйк — сбрасываем на каждую смену рынка (новое окно/актив/интервал),
  // затем фиксируем первой доступной ценой Binance для этого окна
  useEffect(() => {
    setStrikePrice(null)
  }, [market?.slug])

  useEffect(() => {
    if (market && price != null) {
      setStrikePrice((prev) => (prev == null ? price : prev))
    }
  }, [market?.slug, price])

  useEffect(() => {
    const id = setInterval(() => {
      if (market) setMsLeft(Math.max(0, market.windowEnd - Date.now()))
    }, 500)
    return () => clearInterval(id)
  }, [market])

  return (
    <div className="app">
      <Tape trades={trades} />
      <Header
        marketKey={marketKey}
        setMarketKey={setMarketKey}
        interval={interval}
        setInterval={setInterval_}
        connected={priceConnected && bookConnected}
      />
      <div className="layout">
        <PriceChart
          symbol={marketKey}
          price={price}
          prevClose={prevClose}
          candles={candles}
          range={range}
          setRange={setRange}
          strikePrice={strikePrice}
          msLeft={msLeft}
        />
        <OrderBook up={up} down={down} marketTitle={market?.title} connected={bookConnected} />
        <TransactionLog trades={trades} connected={bookConnected} />
      </div>
      {marketError && <div className="market-error-banner mono">{marketError}</div>}
    </div>
  )
}
