import { fmtCents } from '../utils/format'

export default function Tape({ trades }) {
  const items = trades.slice(0, 16)
  if (items.length === 0) return <div className="tape" />

  const renderItems = (keyPrefix) =>
    items.map((t) => (
      <span className="tape-item mono" key={`${keyPrefix}-${t.id}`}>
        <span className={`side ${t.outcome === 'UP' ? 'up' : 'down'}`}>
          {t.side} {t.outcome}
        </span>
        <span>{t.qty}@{fmtCents(t.price)}</span>
      </span>
    ))

  return (
    <div className="tape">
      <div className="tape-track">
        {renderItems('a')}
        {renderItems('b')}
      </div>
    </div>
  )
}
