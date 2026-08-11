import { INTERVALS } from '../utils/polymarketSlug'

export default function Header({ interval, setInterval, connected }) {
  const intervals = Object.keys(INTERVALS).map((id) => ({ id, label: INTERVALS[id].label }))

  return (
    <header className="header glass">
      <div className="brand">
        <span className="mark">◆</span>
        cryptomarket<span style={{ color: 'var(--ink-2)' }}>.terminal</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-1)' }}>
        BTC
      </div>

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-1)' }} className="mono">
        <span className={`status-dot ${connected ? '' : 'off'}`} />
        {connected ? 'LIVE · POLYMARKET' : 'CONNECTING…'}
      </div>
    </header>
  )
}
