import { useEffect, useRef } from 'react'
import { fmtTime, fmtCents } from '../utils/format'

export default function TransactionLog({ trades, connected }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [trades.length])

  return (
    <div className="panel console-panel glass">
      <div className="panel-head">
        <span className="panel-title">Лог транзакций</span>
        <span className="panel-title mono" style={{ color: 'var(--text-2)' }}>{trades.length} events</span>
      </div>
      <div className="console" ref={scrollRef}>
        <div className="console-line">
          <span className="ts">{fmtTime(new Date())}</span>
          <span className="tag sys">SYS</span>
          <span className="msg">
            канал {connected ? <b>подключён</b> : 'переподключение…'} — Binance WS
          </span>
        </div>
        {trades.map((t) => (
          <div className="console-line" key={t.id}>
            <span className="ts">{fmtTime(t.ts)}</span>
            <span className={`tag ${t.side === 'BUY' ? 'buy' : 'sell'}`}>{t.side}</span>
            <span className="msg">
              <b>{t.outcome}</b> × {t.qty} @ {fmtCents(t.price)} · tx {(1000000 + t.id).toString(16)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
