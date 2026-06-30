import { createClient } from '@/lib/supabase/server'
import { fmt, formatDate } from '@/lib/utils'
import { Plus, Users, ShoppingBag, Package, ChevronRight, Eye, FileText, Sparkles, GitBranch } from 'lucide-react'
import Link from 'next/link'

const glass: React.CSSProperties = {
  background: 'rgba(13,16,23,.72)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  border: '1px solid rgba(255,255,255,.06)',
  borderRadius: 12,
  boxShadow: '0 1px 0 rgba(255,255,255,.04) inset, 0 4px 24px rgba(0,0,0,.3)',
}

export default async function CrmDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = (user?.user_metadata?.full_name || user?.user_metadata?.name || 'Bashar').split(' ')[0]

  const [{ data: deals }, { data: recentCustomers }, { data: activities }] = await Promise.all([
    supabase.from('deals').select('id,title,value,created_at,customers(company)').eq('stage', 'Offert').order('created_at', { ascending: false }).limit(4),
    supabase.from('customers').select('id,company,price_list_id').eq('status', 'active').order('created_at', { ascending: false }).limit(5),
    supabase.from('activities').select('id,title,created_at,customers(company)').order('created_at', { ascending: false }).limit(4),
  ])

  const PL_COLOR: Record<string, string> = { A: 'var(--gold)', B: '#6AAFF0', C: '#5EC49A', Standard: 'var(--text3)' }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* ── Hero ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.15 }}>
          Välkommen,{' '}
          <span style={{ background: 'linear-gradient(135deg,#F5CC6A,#E8B84B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {firstName}
          </span>
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 8 }}>
          {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── Primary CTA ── */}
      <Link href="/crm/orders" style={{
        width: '100%', padding: '20px 24px',
        background: 'linear-gradient(135deg, #E8B84B 0%, #F5CC6A 50%, #D4A33C 100%)',
        borderRadius: 12, cursor: 'pointer', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 16,
        textDecoration: 'none',
        boxShadow: '0 2px 20px rgba(232,184,75,.28), 0 1px 0 rgba(255,255,255,.2) inset',
      }}>
        <div style={{ width: 44, height: 44, background: 'rgba(0,0,0,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Plus size={22} color="#111" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0D0A00', marginBottom: 2 }}>Ny order</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,.5)' }}>Välj kund → Lägg till produkter → skicka order</div>
        </div>
        <ChevronRight size={20} color="rgba(0,0,0,.35)" style={{ marginLeft: 'auto' }} />
      </Link>

      {/* ── Quick action grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
        {[
          { label: 'Pipeline',  sub: 'Deals & offerter',    href: '/crm/pipeline',  icon: GitBranch },
          { label: 'Kunder',    sub: 'Kundkort & historik', href: '/crm/customers', icon: Users },
          { label: 'Ordrar',    sub: 'Orderhistorik',       href: '/crm/orders',    icon: ShoppingBag },
          { label: 'Produkter', sub: 'Katalog & priser',    href: '/crm/orders',    icon: Package },
        ].map(({ label, sub, href, icon: Icon }) => (
          <Link key={label} href={href} style={{
            ...glass,
            padding: '16px 18px',
            textDecoration: 'none',
            display: 'block',
            transition: 'border-color .18s, box-shadow .18s, transform .18s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, background: 'rgba(232,184,75,.1)', border: '1px solid rgba(232,184,75,.18)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color="var(--gold)" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', paddingLeft: 40 }}>{sub}</div>
          </Link>
        ))}
      </div>

      {/* ── Bottom two-col ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Skickade offerter */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <FileText size={12} /> Skickade offerter
          </div>
          <div style={{ ...glass, overflow: 'hidden' }}>
            {(deals && deals.length > 0 ? deals : [
              { id: '1', title: 'Bilservice AB',    value: 12400, created_at: '2026-06-10', customers: { company: 'Bilservice AB' } },
              { id: '2', title: 'Detailing Sthlm',  value: 8750,  created_at: '2026-06-08', customers: { company: 'Detailing Sthlm' } },
              { id: '3', title: 'AutoGlans Nordic',  value: 22000, created_at: '2026-06-05', customers: { company: 'AutoGlans Nordic' } },
            ] as any[]).map((d: any, i: number, arr: any[]) => (
              <Link key={d.id} href="/crm/pipeline" style={{
                display: 'flex', flexDirection: 'column',
                padding: '11px 14px',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                textDecoration: 'none',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>
                  {(d.customers as any)?.company || d.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(d.created_at)}</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--gold)' }}>{fmt(d.value)} kr</span>
                </div>
              </Link>
            ))}
            <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,.04)' }}>
              <Link href="/crm/pipeline" style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: 11, fontWeight: 600, color: 'var(--gold)', textDecoration: 'none', background: 'rgba(232,184,75,.06)', borderRight: '1px solid rgba(255,255,255,.04)' }}>Följ upp</Link>
              <Link href="/crm/pipeline" style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: 11, color: 'var(--text3)', textDecoration: 'none' }}>Se alla</Link>
            </div>
          </div>
        </div>

        {/* Senaste kunder */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Eye size={12} /> Senaste kunder
          </div>
          <div style={{ ...glass, overflow: 'hidden' }}>
            {(recentCustomers && recentCustomers.length > 0 ? recentCustomers : [
              { id: '1', company: 'Bilservice AB',       price_list_id: 'A' },
              { id: '2', company: 'Clean Cars GBG',      price_list_id: 'B' },
              { id: '3', company: 'Pro Detailing Malmö', price_list_id: 'C' },
              { id: '4', company: 'Nordic Auto Care',    price_list_id: 'A' },
            ] as any[]).map((c: any, i: number, arr: any[]) => (
              <Link key={c.id} href="/crm/customers" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                textDecoration: 'none',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(232,184,75,.1)', border: '1px solid rgba(232,184,75,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                  {c.company[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.06)', color: PL_COLOR[c.price_list_id] || 'var(--text3)' }}>
                  {c.price_list_id}
                </span>
              </Link>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,.04)' }}>
              <Link href="/crm/customers" style={{ display: 'block', textAlign: 'center', padding: '10px', fontSize: 11, color: 'var(--text3)', textDecoration: 'none' }}>Se alla kunder</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
