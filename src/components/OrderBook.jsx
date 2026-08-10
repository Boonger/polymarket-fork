import { fmtCents } from '../utils/format'

function Row({ level, side, maxTotal }) {
  const pct = Math.min(100, (level.total / maxTotal) * 100)
  return (
    <div className={`book-row ${side}`}>
      <div className="depth-bar" style={{ width: `${pct}%` }} />
      <span className="px">{fmtCents(level.price)}</span>
      <span className="qty">{level.qty}</span>
      <span className="total">{level.total}</span>
    </div>
  )
}

function EmptyHint({ text }) {
  return <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-2)' }}>{text}</div>
}

export default function OrderBook({ up, down, marketTitle, connected }) {
  const bids = up.bids
  const asks = up.asks
  const maxTotal = Math.max(1, asks[asks.length - 1]?.total ?? 0, bids[bids.length - 1]?.total ?? 0)
  const asksDesc = [...asks].reverse()

  const upAsk = asks[0]?.price
  const downAsk = down.asks[0]?.price

  return (
    <div className="panel book-panel">
      <div className="panel-head">
        <span className="panel-title">Стакан · {marketTitle || 'Up/Down'}</span>
        <span className="panel-title mono" style={{ color: 'var(--text-2)' }}>{asks.length + bids.length} lvl</span>
      </div>

      <div className="book-side-label">
        <span>Цена UP</span>
        <span style={{ textAlign: 'right' }}>Объём</span>
        <span style={{ textAlign: 'right' }}>Всего</span>
      </div>

      <div className="book-rows">
        {asksDesc.length
          ? asksDesc.map((l, i) => <Row key={`ask-${i}`} level={l} side="ask" maxTotal={maxTotal} />)
          : <EmptyHint text={connected ? 'книга пуста…' : 'подключение к CLOB…'} />}
      </div>

      <div className="book-mid">
        <span className="up">UP {upAsk != null ? fmtCents(upAsk) : '—'}</span>
        <span style={{ color: 'var(--text-2)' }}>/</span>
        <span className="down">DOWN {downAsk != null ? fmtCents(downAsk) : '—'}</span>
      </div>

      <div className="book-rows">
        {bids.length
          ? bids.map((l, i) => <Row key={`bid-${i}`} level={l} side="bid" maxTotal={maxTotal} />)
          : <EmptyHint text={connected ? 'книга пуста…' : 'подключение к CLOB…'} />}
      </div>

      <div className="outcome-strip">
        <button className="outcome-btn yes">
          <span className="lbl">Купить Up</span>
          <span className="px">{upAsk != null ? fmtCents(upAsk) : '—'}</span>
        </button>
        <button className="outcome-btn no">
          <span className="lbl">Купить Down</span>
          <span className="px">{downAsk != null ? fmtCents(downAsk) : '—'}</span>
        </button>
      </div>
    </div>
  )
}
