import { createClient } from '@/lib/supabase/server'
import { fmt, formatDate } from '@/lib/utils'
import { TrendingUp, Users, ShoppingBag, Target } from 'lucide-react'
import Link from 'next/link'

export default async function CrmDashboardPage() {
  const supabase = await createClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: customers }, { data: deals }, { data: recentOrders }, { data: activities }] = await Promise.all([
    supabase.from('customers').select('id,company,status,last_order_at').eq('status', 'active'),
    supabase.from('deals').select('*,customers(company)').not('stage', 'in', '("Vunnen","Förlorad")').order('created_at', { ascending: false }),
    supabase.from('orders').select('*,customers(company)').gte('created_at', startOfMonth).order('created_at', { ascending: false }).limit(8),
    supabase.from('activities').select('*,customers(company)').order('created_at', { ascending: false }).limit(5),
  ])

  const pipelineValue = (deals || []).reduce((s, d) => s + (d.value || 0), 0)
  const monthRevenue = (recentOrders || []).reduce((s, o) => s + (o.total || 0), 0)

  const kpis = [
    { label: 'Aktiva kunder', value: (customers || []).length, icon: Users, color: 'var(--blue)' },
    { label: 'Deals i pipeline', value: (deals || []).length, icon: Target, color: 'var(--gold)' },
    { label: 'Pipeline-värde', value: `${fmt(pipelineValue)} kr`, icon: TrendingUp, color: 'var(--green)' },
    { label: 'Intäkt denna månad', value: `${fmt(monthRevenue)} kr`, icon: ShoppingBag, color: 'var(--gold)' },
  ]

  const stageColors: Record<string, string> = {
    Prospekt: 'var(--text3)', Kontaktad: 'var(--blue)', Offert: 'var(--gold)',
    Förhandling: '#9B6EE8', Vunnen: 'var(--green)', Förlorad: 'var(--red)'
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Välkommen, Bashar 👋</h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, margin: '6px 0 0' }}>{now.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Active deals */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Aktiva deals</h2>
            <Link href="/crm/pipeline" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}>Se pipeline →</Link>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(deals || []).slice(0, 6).map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg4)', borderRadius: 8 }}>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: `${stageColors[d.stage]}18`, color: stageColors[d.stage], fontWeight: 700, whiteSpace: 'nowrap' }}>{d.stage}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{fmt(d.value)} kr</span>
              </div>
            ))}
            {(!deals || deals.length === 0) && <p style={{ textAlign: 'center', color: 'var(--text3)', padding: '20px 0', margin: 0 }}>Inga aktiva deals</p>}
          </div>
        </div>

        {/* Recent orders this month */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Ordrar denna månad</h2>
            <Link href="/crm/orders" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}>Se alla →</Link>
          </div>
          <div style={{ padding: '0 16px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', 'Kund', 'Total', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentOrders || []).map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                    <td style={{ padding: '10px 8px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>#{o.order_nr}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--text)', fontWeight: 500 }}>{o.customers?.company || '—'}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--gold)', fontWeight: 600 }}>{fmt(o.total)} kr</td>
                    <td style={{ padding: '10px 8px' }}><span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(76,175,125,.12)', color: 'var(--green)', fontWeight: 700 }}>{o.status}</span></td>
                  </tr>
                ))}
                {(!recentOrders || recentOrders.length === 0) && (
                  <tr><td colSpan={4} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text3)' }}>Inga ordrar denna månad</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 24, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Snabbåtgärder</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: '+ Ny deal', href: '/crm/pipeline', color: 'var(--gold)' },
            { label: '+ Ny kund', href: '/crm/customers', color: 'var(--blue)' },
            { label: '+ Ny order', href: '/crm/orders', color: 'var(--green)' },
            { label: 'Se alla kunder', href: '/crm/customers', color: 'var(--text2)' },
          ].map(({ label, href, color }) => (
            <Link key={label} href={href} style={{ padding: '10px 20px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all .15s' }}>{label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
