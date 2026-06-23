'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/utils'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast', pending: 'Väntande', confirmed: 'Bekräftad',
  packed: 'Packad', shipped: 'Skickad', delivered: 'Levererad', cancelled: 'Avbruten',
}
const STATUS_CSS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(212,138,58,.12)',  color: '#D48A3A' },
  confirmed: { bg: 'rgba(232,184,75,.12)',  color: '#E8B84B' },
  packed:    { bg: 'rgba(232,184,75,.12)',  color: '#E8B84B' },
  shipped:   { bg: 'rgba(66,153,225,.12)',  color: '#4299E1' },
  delivered: { bg: 'rgba(76,175,125,.12)',  color: '#4CAF7D' },
  cancelled: { bg: 'rgba(224,82,82,.12)',   color: '#E05252' },
  draft:     { bg: 'rgba(155,163,176,.08)', color: '#9BA0AB' },
}

export default function AdminDashboard() {
  const [orders, setOrders]     = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
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
    canvas.height = 160

    const days = chartPeriod === 'week' ? 7 : 30
    const buckets: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      buckets[d.toISOString().slice(0, 10)] = 0
    }
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      const d = o.created_at?.slice(0, 10)
      if (d && d in buckets) buckets[d] += o.subtotal || 0
    })

    const vals = Object.values(buckets)
    const max  = Math.max(...vals, 1)
    const keys = Object.keys(buckets)
    const barW = Math.floor((W - 80) / days) - 4
    const padL = 60, padB = 30, padT = 20
    const chartH = canvas.height - padB - padT

    ctx.clearRect(0, 0, W, canvas.height)

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,.04)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - 10, y); ctx.stroke()
      ctx.fillStyle = 'rgba(155,160,171,.5)'
      ctx.font = '10px Inter'
      ctx.textAlign = 'right'
      ctx.fillText(fmt(max - (max / 4) * i), padL - 6, y + 4)
    }

    // Bars
    vals.forEach((v, i) => {
      const x  = padL + i * ((W - padL - 10) / days)
      const bh = (v / max) * chartH
      const y  = padT + chartH - bh

      const grad = ctx.createLinearGradient(0, y, 0, y + bh)
      grad.addColorStop(0, 'rgba(232,184,75,.8)')
      grad.addColorStop(1, 'rgba(232,184,75,.2)')
      ctx.fillStyle = grad
      ctx.fillRect(x, y, barW, bh)

      if (days === 7 || i % 5 === 0) {
        const d = new Date(keys[i])
        ctx.fillStyle = 'rgba(92,98,112,.8)'
        ctx.font = '9px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(`${d.getDate()}/${d.getMonth() + 1}`, x + barW / 2, canvas.height - 8)
      }
    })
  }

  const revenue       = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.subtotal || 0), 0)
  const pendingCount  = orders.filter(o => o.status === 'pending').length
  const todayOrders   = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const lowStock      = products.filter(p => p.stock_qty < 20).sort((a, b) => a.stock_qty - b.stock_qty)

  const kpis = [
    { label: 'Total omsättning', value: `${fmt(revenue)} kr`, sub: 'exkl. moms' },
    { label: 'Aktiva ordrar',    value: pendingCount.toString(), sub: 'väntande behandling', highlight: pendingCount > 0 },
    { label: 'Ordrar idag',      value: todayOrders.toString(), sub: 'nya ordrar' },
    { label: 'Kunder',           value: customers.length.toString(), sub: `${activeCustomers} aktiva` },
  ]

  return (
    <div>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)' }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ padding: '28px 36px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, display: 'block' }}>{k.label}</span>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '44px', fontWeight: 500, color: k.highlight ? '#E8B84B' : 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ padding: '28px 40px 32px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Omsättning</div>
          <div style={{ display: 'flex', gap: 0 }}>
            {(['week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)} style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 600, color: chartPeriod === p ? 'var(--gold)' : 'var(--text3)', cursor: 'pointer', background: chartPeriod === p ? 'rgba(232,184,75,.08)' : 'transparent', border: '1px solid var(--border)', borderRight: p === 'week' ? 'none' : '1px solid var(--border)', transition: 'all .15s', fontFamily: 'var(--font-sans)' }}>
                {p === 'week' ? '7 dagar' : '30 dagar'}
              </button>
            ))}
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
      </div>

      {/* Bottom tables */}
      <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* Recent orders */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>Senaste ordrar</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Kund', 'Belopp', 'Status'].map(h => (
                  <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '14px 0', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map(o => (
                <tr key={o.id}>
                  <td style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <Link href="/admin/orders" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)', fontWeight: 500, textDecoration: 'none' }}>#{o.order_nr}</Link>
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '13px', color: 'var(--text)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>{(o.customers?.company || o.delivery_name || '—').slice(0, 20)}</td>
                  <td style={{ padding: '16px 0', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gold)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>{fmt(o.subtotal)} kr</td>
                  <td style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 4, background: (STATUS_CSS[o.status] || STATUS_CSS.draft).bg, color: (STATUS_CSS[o.status] || STATUS_CSS.draft).color }}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low stock */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>Lågt lager</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Produkt', 'SKU', 'Lager'].map(h => (
                  <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '14px 0', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '32px 0', fontSize: '12px', color: 'var(--text3)' }}>Allt lager OK ✓</td></tr>
              ) : lowStock.slice(0, 6).map(p => (
                <tr key={p.id}>
                  <td style={{ padding: '16px 0', fontSize: '11px', color: 'var(--text)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>{p.name.slice(0, 28)}</td>
                  <td style={{ padding: '16px 0', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>{p.sku}</td>
                  <td style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: p.stock_qty === 0 ? 'var(--red)' : p.stock_qty < 10 ? '#E8B84B' : 'var(--green)' }}>{p.stock_qty} st</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
