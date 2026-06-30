'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/utils'
import Link from 'next/link'
import { TrendingUp, ShoppingBag, Clock, Users, AlertTriangle } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast', pending: 'Väntande', confirmed: 'Bekräftad',
  packed: 'Packad', shipped: 'Skickad', delivered: 'Levererad', cancelled: 'Avbruten',
}
const STATUS_CSS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(212,138,58,.14)',  color: '#D48A3A' },
  confirmed: { bg: 'rgba(232,184,75,.12)',  color: '#E8B84B' },
  packed:    { bg: 'rgba(232,184,75,.12)',  color: '#E8B84B' },
  shipped:   { bg: 'rgba(66,153,225,.12)',  color: '#4299E1' },
  delivered: { bg: 'rgba(76,175,125,.12)',  color: '#4CAF7D' },
  cancelled: { bg: 'rgba(224,82,82,.12)',   color: '#E05252' },
  draft:     { bg: 'rgba(78,85,102,.12)',   color: '#4E5566' },
}

export default function AdminDashboard() {
  const [orders, setOrders]       = useState<any[]>([])
  const [products, setProducts]   = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('orders').select('*,customers(company,contact_name)').order('created_at', { ascending: false }),
      sb.from('products').select('*').order('sort_order'),
      sb.from('customers').select('*').order('company'),
    ]).then(([{ data: o }, { data: p }, { data: c }]) => {
      setOrders(o || [])
      setProducts(p || [])
      setCustomers(c || [])
    })
  }, [])

  useEffect(() => {
    drawChart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, chartPeriod])

  function drawChart() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.parentElement?.clientWidth || 800
    canvas.width = W
    canvas.height = 180

    const days = chartPeriod === 'week' ? 7 : 30
    const buckets: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      buckets[d.toISOString().slice(0, 10)] = 0
    }
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const d = o.created_at?.slice(0, 10)
      if (d && d in buckets) buckets[d] += o.subtotal || 0
    })

    const vals = Object.values(buckets)
    const max  = Math.max(...vals, 1)
    const keys = Object.keys(buckets)
    const barW = Math.max(4, Math.floor((W - 72) / days) - 5)
    const padL = 56, padB = 30, padT = 16, chartH = canvas.height - padB - padT

    ctx.clearRect(0, 0, W, canvas.height)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,.035)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - 10, y); ctx.stroke()
      ctx.fillStyle = 'rgba(78,85,102,.8)'
      ctx.font = '10px Inter'
      ctx.textAlign = 'right'
      ctx.fillText(fmt(max - (max / 4) * i), padL - 6, y + 4)
    }

    // Bars with liquid gradient
    vals.forEach((v, i) => {
      const x  = padL + i * ((W - padL - 10) / days)
      const bh = Math.max(2, (v / max) * chartH)
      const y  = padT + chartH - bh

      const grad = ctx.createLinearGradient(0, y, 0, y + bh)
      grad.addColorStop(0, 'rgba(245,204,106,.85)')
      grad.addColorStop(0.4, 'rgba(232,184,75,.7)')
      grad.addColorStop(1, 'rgba(180,130,40,.15)')
      ctx.fillStyle = grad

      // Rounded top
      const r = Math.min(3, bh / 2)
      ctx.beginPath()
      ctx.moveTo(x, y + r)
      ctx.arcTo(x, y, x + r, y, r)
      ctx.arcTo(x + barW, y, x + barW, y + r, r)
      ctx.lineTo(x + barW, y + bh)
      ctx.lineTo(x, y + bh)
      ctx.closePath()
      ctx.fill()

      if (days === 7 || i % 5 === 0) {
        const d = new Date(keys[i])
        ctx.fillStyle = 'rgba(78,85,102,.8)'
        ctx.font = '9px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(`${d.getDate()}/${d.getMonth() + 1}`, x + barW / 2, canvas.height - 8)
      }
    })
  }

  const revenue        = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.subtotal || 0), 0)
  const pendingCount   = orders.filter(o => o.status === 'pending').length
  const todayOrders    = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const lowStock       = products.filter(p => p.stock_qty < 20).sort((a, b) => a.stock_qty - b.stock_qty)

  const kpis = [
    { label: 'Total omsättning', value: `${fmt(revenue)} kr`, sub: 'exkl. moms', icon: TrendingUp, gold: true },
    { label: 'Aktiva ordrar',    value: pendingCount.toString(), sub: 'väntande behandling', icon: Clock, alert: pendingCount > 0 },
    { label: 'Ordrar idag',      value: todayOrders.toString(), sub: 'nya ordrar', icon: ShoppingBag },
    { label: 'Kunder',           value: customers.length.toString(), sub: `${activeCustomers} aktiva`, icon: Users },
  ]

  const card: React.CSSProperties = {
    background: 'rgba(13,16,23,.7)',
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
    border: '1px solid var(--line)',
    borderRadius: 14,
    boxShadow: '0 1px 0 rgba(255,255,255,.04) inset, 0 6px 28px rgba(0,0,0,.35)',
  }

  return (
    <div style={{ padding: '28px 28px 48px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 500, color: 'var(--text)', letterSpacing: '-.01em' }}>
          Admin<span style={{ color: 'var(--gold)', fontStyle: 'italic' }}> översikt</span>
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Live-vy · uppdateras automatiskt</p>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} style={{
              ...card,
              padding: '22px 24px',
              borderColor: k.gold ? 'var(--line-gold)' : k.alert ? 'rgba(212,138,58,.2)' : 'var(--line)',
              boxShadow: k.gold ? `${card.boxShadow}, var(--gold-glow)` : card.boxShadow as string,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.09em' }}>{k.label}</span>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: k.gold ? 'rgba(232,184,75,.1)' : k.alert ? 'rgba(212,138,58,.1)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${k.gold ? 'var(--line-gold)' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} color={k.gold ? 'var(--gold)' : k.alert ? '#D48A3A' : 'var(--text3)'} />
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 500, lineHeight: 1, marginBottom: 6,
                background: k.gold ? 'linear-gradient(135deg,#F5CC6A,#E8B84B)' : 'none',
                WebkitBackgroundClip: k.gold ? 'text' : 'unset',
                WebkitTextFillColor: k.gold ? 'transparent' : 'unset',
                color: k.alert ? '#D48A3A' : 'var(--text)',
              }}>{k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{k.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Chart card */}
      <div style={{ ...card, padding: '22px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.09em' }}>Omsättning</div>
          </div>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
            {(['week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)} style={{
                padding: '5px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: chartPeriod === p ? 'rgba(232,184,75,.1)' : 'transparent',
                color: chartPeriod === p ? 'var(--gold)' : 'var(--text3)',
                border: 'none', borderRight: p === 'week' ? '1px solid var(--line)' : 'none',
                transition: 'all .15s', fontFamily: 'var(--font-sans)',
              }}>
                {p === 'week' ? '7 dagar' : '30 dagar'}
              </button>
            ))}
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>

        {/* Recent orders */}
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.09em' }}>Senaste ordrar</span>
            <Link href="/admin/orders" style={{ fontSize: 11, color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>Visa alla →</Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Kund', 'Belopp', 'Status'].map(h => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '0 0 10px', textAlign: 'left', borderBottom: '1px solid var(--line2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 7).map(o => (
                <tr key={o.id}>
                  <td style={{ padding: '11px 0', borderBottom: '1px solid var(--line2)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)', fontWeight: 500 }}>#{o.order_nr}</span>
                  </td>
                  <td style={{ padding: '11px 0', fontSize: 12, color: 'var(--text)', borderBottom: '1px solid var(--line2)' }}>{(o.customers?.company || o.delivery_name || '—').slice(0, 18)}</td>
                  <td style={{ padding: '11px 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text2)', borderBottom: '1px solid var(--line2)' }}>{fmt(o.subtotal)}</td>
                  <td style={{ padding: '11px 0', borderBottom: '1px solid var(--line2)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: (STATUS_CSS[o.status] || STATUS_CSS.draft).bg, color: (STATUS_CSS[o.status] || STATUS_CSS.draft).color }}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={4} style={{ padding: '24px 0', fontSize: 12, color: 'var(--text3)' }}>Inga ordrar ännu</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Low stock */}
        <div style={{ ...card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.09em' }}>Lågt lager</span>
            {lowStock.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#D48A3A', fontWeight: 600 }}>
                <AlertTriangle size={12} /> {lowStock.length} produkter
              </span>
            )}
          </div>
          {lowStock.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Allt lager OK</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Inga produkter under gränsvärde</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Produkt', 'SKU', 'Lager'].map(h => (
                    <th key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '0 0 10px', textAlign: 'left', borderBottom: '1px solid var(--line2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 7).map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: '11px 0', fontSize: 12, color: 'var(--text)', borderBottom: '1px solid var(--line2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '11px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', borderBottom: '1px solid var(--line2)' }}>{p.sku}</td>
                    <td style={{ padding: '11px 0', borderBottom: '1px solid var(--line2)' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: p.stock_qty === 0 ? 'var(--red)' : p.stock_qty < 10 ? '#D48A3A' : 'var(--gold)' }}>{p.stock_qty} st</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
