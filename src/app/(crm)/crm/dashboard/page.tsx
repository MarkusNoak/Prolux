import { createClient } from '@/lib/supabase/server'
import { fmt, formatDate } from '@/lib/utils'
import { Plus, Users, ShoppingBag, Package, ChevronRight, Eye, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default async function CrmDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = (user?.user_metadata?.full_name || user?.user_metadata?.name || 'Säljare').split(' ')[0]

  const [{ data: deals }, { data: recentCustomers }, { data: activities }, { data: overdueCount }] = await Promise.all([
    supabase.from('deals').select('id,title,value,created_at,customers(company)').eq('stage', 'Offert').order('created_at', { ascending: false }).limit(4),
    supabase.from('customers').select('id,company,price_list_id').eq('status', 'active').order('created_at', { ascending: false }).limit(5),
    supabase.from('activities').select('id,title,created_at,customers(company)').order('created_at', { ascending: false }).limit(4),
    supabase.from('reminders').select('id', { count: 'exact' }).eq('status', 'upcoming').lt('due_date', new Date().toISOString().slice(0, 10)),
  ])

  const PL_COLOR: Record<string, string> = { A: 'var(--gold)', B: '#6AAFF0', C: '#5EC49A', Standard: 'var(--text3)' }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.15 }}>
          Välkommen, {firstName}
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 8 }}>
          {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          {(overdueCount?.length ?? 0) > 0 && (
            <span style={{ marginLeft: 12, color: 'var(--red)', fontWeight: 600 }}>
              · {overdueCount!.length} försenad{overdueCount!.length === 1 ? '' : 'e'} påminnelse{overdueCount!.length === 1 ? '' : 'r'}
            </span>
          )}
        </p>
      </div>

      {/* ── Primary CTA ───────────────────────────────────── */}
      <Link href="/crm/orders" style={{
        width: '100%',
        padding: '22px 26px',
        background: 'var(--gold)',
        borderRadius: 12,
        cursor: 'pointer',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        textDecoration: 'none',
        transition: 'background .2s',
      }}>
        <div style={{ width: 48, height: 48, background: 'rgba(0,0,0,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Plus size={24} color="#111" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 2 }}>Ny order</div>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,.5)' }}>Välj kund och produkter</div>
        </div>
        <ChevronRight size={20} color="rgba(0,0,0,.35)" style={{ marginLeft: 'auto' }} />
      </Link>

      {/* ── Quick action grid ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 36 }}>
        {[
          { label: 'Pipeline', sub: 'Deals & offerter',      href: '/crm/pipeline',  icon: Sparkles },
          { label: 'Kunder',   sub: 'Kundkort & historik',   href: '/crm/customers', icon: Users },
          { label: 'Ordrar',   sub: 'Orderhistorik',         href: '/crm/orders',    icon: ShoppingBag },
          { label: 'Produkter',sub: 'Katalog & priser',      href: '/crm/orders',    icon: Package },
        ].map(({ label, sub, href, icon: Icon }) => (
          <Link key={label} href={href} style={{
            background: 'var(--bg2)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '16px 18px',
            textDecoration: 'none',
            display: 'block',
            transition: 'all .18s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, background: 'var(--bg4)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color="var(--gold)" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', paddingLeft: 40 }}>{sub}</div>
          </Link>
        ))}
      </div>

      {/* ── Bottom two-col ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Skickade offerter */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <FileText size={13} /> Skickade offerter
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            {(deals && deals.length > 0 ? deals : [
              { id: '1', title: 'Bilservice AB', value: 12400, created_at: '2026-06-10', customers: { company: 'Bilservice AB' } },
              { id: '2', title: 'Detailing Sthlm', value: 8750, created_at: '2026-06-08', customers: { company: 'Detailing Sthlm' } },
              { id: '3', title: 'AutoGlans Nordic', value: 22000, created_at: '2026-06-05', customers: { company: 'AutoGlans Nordic' } },
            ] as any[]).map((d: any, i: number, arr: any[]) => (
              <Link key={d.id} href="/crm/pipeline" style={{
                display: 'flex', flexDirection: 'column',
                padding: '11px 14px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line2)' : 'none',
                textDecoration: 'none',
                transition: 'background .15s',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>
                  {(d.customers as any)?.company || d.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDate(d.created_at)}</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--gold)' }}>{fmt(d.value)} kr</span>
                </div>
              </Link>
            ))}
            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--line)' }}>
              <Link href="/crm/pipeline" style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: 11, fontWeight: 600, color: 'var(--gold)', textDecoration: 'none', background: 'var(--gold-bg)', borderRight: '1px solid var(--line)' }}>Följ upp</Link>
              <Link href="/crm/pipeline" style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: 11, color: 'var(--text3)', textDecoration: 'none' }}>Se alla</Link>
            </div>
          </div>
        </div>

        {/* Senaste kunder */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Eye size={13} /> Senaste kunder
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            {(recentCustomers && recentCustomers.length > 0 ? recentCustomers : [
              { id: '1', company: 'Bilservice AB',      price_list_id: 'A' },
              { id: '2', company: 'Clean Cars GBG',     price_list_id: 'B' },
              { id: '3', company: 'Pro Detailing Malmö',price_list_id: 'C' },
              { id: '4', company: 'Nordic Auto Care',   price_list_id: 'A' },
            ] as any[]).map((c: any, i: number, arr: any[]) => (
              <Link key={c.id} href="/crm/customers" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line2)' : 'none',
                textDecoration: 'none',
                transition: 'background .15s',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg4)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text2)', flexShrink: 0 }}>
                  {c.company[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)', color: PL_COLOR[c.price_list_id] || 'var(--text3)' }}>
                  {c.price_list_id}
                </span>
              </Link>
            ))}
            <div style={{ borderTop: '1px solid var(--line)' }}>
              <Link href="/crm/customers" style={{ display: 'block', textAlign: 'center', padding: '10px', fontSize: 11, color: 'var(--text3)', textDecoration: 'none' }}>Se alla kunder</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
