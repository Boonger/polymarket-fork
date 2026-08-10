export default function Header({ marketKey, setMarketKey, interval, setInterval, connected }) {
  const markets = [
    { id: 'BTCUSDT', label: 'BTC' },
    { id: 'ETHUSDT', label: 'ETH' },
  ]
  const intervals = [
    { id: '5m', label: '5M' },
    { id: '15m', label: '15M' },
    { id: '1h', label: '1H' },
    { id: '1d', label: '1D' },
  ]

  return (
    <header className="header">
      <div className="brand">
        <span className="mark">◆</span>
        cryptomarket<span style={{ color: 'var(--text-2)' }}>.terminal</span>
      </div>

      <nav className="market-tabs" aria-label="Актив">
        {markets.map((m) => (
          <button
            key={m.id}
            className={`market-tab ${marketKey === m.id ? 'active' : ''}`}
            onClick={() => setMarketKey(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <nav className="market-tabs" aria-label="Интервал">
        {intervals.map((iv) => (
          <button
            key={iv.id}
            className={`market-tab ${interval === iv.id ? 'active' : ''}`}
            onClick={() => setInterval(iv.id)}
          >
            {iv.label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-1)' }} className="mono">
        <span className={`status-dot ${connected ? '' : 'off'}`} />
        {connected ? 'LIVE · POLYMARKET CLOB' : 'CONNECTING…'}
      </div>
    </header>
  )
}
