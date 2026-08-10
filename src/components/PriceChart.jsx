import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { fmtUsd, fmtCountdown } from '../utils/format'

const RANGES = [
  { id: '30', label: '30M', points: 30 },
  { id: '60', label: '1H', points: 60 },
  { id: '120', label: '2H', points: 120 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6,
      padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: 'var(--text-2)' }}>{new Date(label).toLocaleTimeString('ru-RU')}</div>
      <div>${fmtUsd(payload[0].value)}</div>
    </div>
  )
}

export default function PriceChart({ symbol, price, prevClose, candles, range, setRange, strikePrice, msLeft }) {
  const up = price != null && prevClose != null ? price >= prevClose : true
  const change = price != null && candles[0] ? ((price - candles[0].open) / candles[0].open) * 100 : 0
  const data = candles.map((c) => ({ time: c.time, close: c.close }))
  const activeRange = RANGES.find((r) => r.id === range) ?? RANGES[0]
  const windowed = data.slice(-activeRange.points)

  return (
    <div className="panel chart-panel">
      <div className="price-row">
        <div className={`price-big ${up ? 'up' : 'down'}`}>${fmtUsd(price)}</div>
        <div className={`price-change ${up ? 'up' : 'down'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
        <div className="price-meta">
          <span>СТРАЙК <b>${fmtUsd(strikePrice, 0)}</b></span>
          <span>ДО ИСТЕЧЕНИЯ <b>{fmtCountdown(msLeft)}</b></span>
          <span>ИСТОЧНИК <b>{symbol}@binance</b></span>
        </div>
      </div>

      <div className="interval-row">
        {RANGES.map((r) => (
          <button
            key={r.id}
            className={`interval-btn ${range === r.id ? 'active' : ''}`}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={windowed} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--up)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--up)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--down)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--down)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-soft)" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={(t) => new Date(t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              stroke="var(--text-2)"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              minTickGap={40}
            />
            <YAxis
              domain={['dataMin - 20', 'dataMax + 20']}
              stroke="var(--text-2)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v) => `$${Math.round(v).toLocaleString('en-US')}`}
            />
            {strikePrice && (
              <ReferenceLine y={strikePrice} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.7} />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke={up ? 'var(--up)' : 'var(--down)'}
              strokeWidth={1.75}
              fill={up ? 'url(#fillUp)' : 'url(#fillDown)'}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
