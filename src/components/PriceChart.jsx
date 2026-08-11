import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { fmtUsd, fmtCountdown } from '../utils/format'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--glass-strong)', backdropFilter: 'blur(12px)',
      border: '1px solid var(--glass-border)', borderRadius: 10,
      padding: '7px 11px', fontSize: 12, fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: 'var(--ink-2)' }}>{new Date(label).toLocaleTimeString('ru-RU')}</div>
      <div>${fmtUsd(payload[0].value)}</div>
    </div>
  )
}

export default function PriceChart({ interval, points, price, openValue, strikePrice, msLeft, error, loading }) {
  const up = price != null && openValue != null ? price >= openValue : true
  const change = price != null && openValue ? ((price - openValue) / openValue) * 100 : 0
  const data = points.map((p) => ({ time: p.timestamp, value: p.value }))

  return (
    <div className="panel chart-panel glass">
      <div className="price-row">
        <div className={`price-big ${up ? 'up' : 'down'}`}>${fmtUsd(price)}</div>
        <div className={`price-change ${up ? 'up' : 'down'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(3)}%
        </div>
        <div className="price-meta">
          <span>СТРАЙК <b>${fmtUsd(strikePrice ?? openValue, 0)}</b></span>
          <span>ДО ИСТЕЧЕНИЯ <b>{fmtCountdown(msLeft)}</b></span>
          <span>ИСТОЧНИК <b>Chainlink TWAP · {interval}</b></span>
        </div>
      </div>

      {error && <div className="data-error mono">{error}</div>}

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--up)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--up)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--down)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--down)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(43,38,32,0.08)" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={(t) => new Date(t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              stroke="var(--ink-2)"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(43,38,32,0.15)' }}
              minTickGap={40}
            />
            <YAxis
              domain={['dataMin - 15', 'dataMax + 15']}
              stroke="var(--ink-2)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v) => `$${Math.round(v).toLocaleString('en-US')}`}
            />
            {(strikePrice ?? openValue) && (
              <ReferenceLine y={strikePrice ?? openValue} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.8} />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={up ? 'var(--up)' : 'var(--down)'}
              strokeWidth={2}
              fill={up ? 'url(#fillUp)' : 'url(#fillDown)'}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        {loading && data.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--ink-2)', fontSize: 12, paddingTop: 40 }}>
            загрузка TWAP price-history…
          </div>
        )}
      </div>
    </div>
  )
}
