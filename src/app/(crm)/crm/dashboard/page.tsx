import { createClient } from '@/lib/supabase/server'
import { fmt, formatDate } from '@/lib/utils'
import { Plus, Users, FileText, ShoppingBag, Eye, Package, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function CrmDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Säljare'
  const firstName = userName.split(' ')[0]

  const [{ data: deals }, { data: recentCustomers }, { data: activities }] = await Promise.all([
    supabase.from('deals').select('*,customers(company)').eq('stage', 'Offert').order('created_at', { ascending: false }).limit(5),
    supabase.from('customers').select('id,company').eq('status', 'active').order('created_at', { ascending: false }).limit(5),
    supabase.from('activities').select('*,customers(company)').eq('type', 'note').order('created_at', { ascending: false }).limit(4),
  ])

  const quickActions = [
    { label: 'Ny offert', href: '/crm/pipeline', icon: Plus },
    { label: 'Skapa ny kund', href: '/crm/customers', icon: Plus },
    { label: 'Kunder', href: '/crm/customers', icon: Users },
    { label: 'Alla ordrar', href: '/crm/orders', icon: FileText },
    { label: 'Visa produkter', href: '/crm/orders', icon: Package },
  ]

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
          Välkommen, {firstName}
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, margin: '6px 0 0' }}>
          Välkommen till säljportalen. Vad vill du göra?
        </p>
      </div>

      {/* Ny order – big CTA */}
      <Link href="/crm/orders" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '20px 24px',
        background: 'var(--gold)',
        borderRadius: 14,
        textDecoration: 'none',
        marginBottom: 16,
        transition: 'opacity .15s',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} color="#111" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: '0.01em' }}>Ny order</span>
      </Link>

      {/* Quick action grid 2 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
        {quickActions.map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 16px',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            textDecoration: 'none',
            transition: 'background .15s',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color="var(--gold)" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Frågor från kunder */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Clock size={16} color="var(--text3)" />
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Frågor från kunder</h2>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {(activities && activities.length > 0) ? activities.map((a, i) => (
            <div key={a.id} style={{
              padding: '14px 16px',
              borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 2 }}>{a.title}</div>
                {a.customers && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{(a.customers as any).company}</div>}
              </div>
              <ChevronRight size={14} color="var(--text3)" />
            </div>
          )) : (
            <>
              {[
                'Finns produkten Frescura 25 kg i lager?',
                'Kan jag få en offert på Coating-paketet?',
                'När levereras min senaste order?',
                'Vad är priset för Prislista A?',
              ].map((q, i, arr) => (
                <div key={q} style={{
                  padding: '14px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>{q}</span>
                  <ChevronRight size={14} color="var(--text3)" />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Skickade offerter */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Clock size={16} color="var(--text3)" />
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Skickade offerter</h2>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {(deals && deals.length > 0) ? deals.map((d, i) => (
            <div key={d.id} style={{
              padding: '14px 16px',
              borderBottom: i < deals.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{(d.customers as any)?.company || d.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(d.created_at)} · {fmt(d.value)} kr</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Link href={`/crm/pipeline`} style={{
                  padding: '6px 12px',
                  background: 'rgba(232,184,75,.1)',
                  border: '1px solid rgba(232,184,75,.2)',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--gold)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}>Följ upp</Link>
                <Link href={`/crm/pipeline`} style={{
                  padding: '6px 12px',
                  background: 'var(--bg4)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text2)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}>Visa offert</Link>
              </div>
            </div>
          )) : (
            <>
              {[
                { company: 'Bilservice AB', date: '2026-06-10', value: 12400 },
                { company: 'Detailing Stockholm', date: '2026-06-08', value: 8750 },
                { company: 'AutoGlans Nordic', date: '2026-06-05', value: 22000 },
              ].map((o, i, arr) => (
                <div key={o.company} style={{
                  padding: '14px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{o.company}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.date} · {fmt(o.value)} kr</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link href="/crm/pipeline" style={{ padding: '6px 12px', background: 'rgba(232,184,75,.1)', border: '1px solid rgba(232,184,75,.2)', borderRadius: 6, fontSize: 11, fontWeight: 600, color: 'var(--gold)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Följ upp</Link>
                    <Link href="/crm/pipeline" style={{ padding: '6px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontWeight: 600, color: 'var(--text2)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Visa offert</Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Senaste visade kunder */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Eye size={16} color="var(--text3)" />
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Senaste visade kunder</h2>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {(recentCustomers && recentCustomers.length > 0) ? recentCustomers.map((c, i) => (
            <Link key={c.id} href={`/crm/customers`} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: i < recentCustomers.length - 1 ? '1px solid var(--border)' : 'none',
              textDecoration: 'none',
            }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{c.company}</span>
              <ChevronRight size={14} color="var(--text3)" />
            </Link>
          )) : (
            <>
              {['Bilservice AB', 'Detailing Stockholm', 'AutoGlans Nordic', 'ProCar Wash'].map((name, i, arr) => (
                <Link key={name} href="/crm/customers" style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                }}>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{name}</span>
                  <ChevronRight size={14} color="var(--text3)" />
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
