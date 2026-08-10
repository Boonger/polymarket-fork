export function fmtUsd(v, digits = 2) {
  if (v == null) return '—'
  return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function fmtCents(p) {
  if (p == null) return '—'
  return `${Math.round(p * 100)}¢`
}

export function fmtTime(d) {
  return d.toLocaleTimeString('ru-RU', { hour12: false })
}

export function fmtCountdown(msLeft) {
  if (msLeft <= 0) return '00:00'
  const totalSec = Math.floor(msLeft / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
