'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { PublicShell, useLoginModal } from '@/components/layout/PublicShell'
import { fmt, formatDate } from '@/lib/utils'
import {
  ArrowRight, ChevronRight, Package, Truck, Shield, Phone,
  ShoppingBag, ExternalLink, Star, User, Lock, Save, Check
} from 'lucide-react'
import type { User as SupaUser } from '@supabase/supabase-js'

const supabase = createClient()
const DISCOUNT: Record<string, number> = { A: 0.40, B: 0.30, C: 0.20, Standard: 0 }

const CATEGORIES = [
  { name: 'Exteriör', emoji: '🚗' },
  { name: 'Interiör', emoji: '🪑' },
  { name: 'Tvätt & Rengöring', emoji: '🫧' },
  { name: 'Vax & Polish', emoji: '✨' },
  { name: 'Fälgvård', emoji: '🔩' },
  { name: 'Avfettning', emoji: '⚗️' },
]

const TRUST = [
  { icon: Truck,  title: '1–2 dagars leverans', sub: 'Snabb och säker frakt' },
  { icon: Shield, title: 'Fri frakt över 2 000 kr', sub: 'Till valfritt ombud' },
  { icon: Star,   title: 'Professionell kvalitet', sub: 'Virtus & Frescura' },
  { icon: Phone,  title: 'Personlig säljare', sub: 'Telefon & mail mån–fre' },
]

/* ─── Scroll-reveal ───────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.08 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(22px)', transition: `opacity .55s ease ${delay}ms, transform .55s ease ${delay}ms` }}>
      {children}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   LOGGED-IN PORTAL — tabs: Översikt | Ordrar | Mitt konto
════════════════════════════════════════════════════════ */
function PortalHome({ user, products }: { user: SupaUser; products: any[] }) {
  const [customer, setCustomer]   = useState<any>(null)
  const [orders, setOrders]       = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'overview'|'orders'|'account'>('overview')
  // Account form state
  const [acctName, setAcctName]   = useState('')
  const [acctPhone, setAcctPhone] = useState('')
  const [acctAddr, setAcctAddr]   = useState('')
  const [acctSaving, setAcctSaving] = useState(false)
  const [acctSaved, setAcctSaved]   = useState(false)
  const [pwCurrent, setPwCurrent]   = useState('')
  const [pwNew, setPwNew]           = useState('')
  const [pwMsg, setPwMsg]           = useState('')
  const [pwSaving, setPwSaving]     = useState(false)

  const role      = user.user_metadata?.role
  const name      = user.user_metadata?.full_name || user.email?.split('@')[0] || 'kund'
  const priceList = user.user_metadata?.price_list_id || 'Standard'
  const disc      = DISCOUNT[priceList] ?? 0

  useEffect(() => {
    Promise.all([
      supabase.from('customers').select('*').eq('email', user.email!).maybeSingle(),
      supabase.from('orders')
        .select('id,order_nr,status,total,created_at,order_items(product_name,qty,unit_price)')
        .eq('customer_id', user.user_metadata?.customer_id ?? '')
        .order('created_at', { ascending: false }),
    ]).then(([{ data: c }, { data: o }]) => {
      if (c) {
        setCustomer(c)
        setAcctName(c.contact_name || '')
        setAcctPhone(c.phone || '')
        setAcctAddr(c.address || '')
      }
      if (o) setOrders(o)
      setLoading(false)
    })
  }, [user])

  const totalSpent     = orders.reduce((s, o) => s + (o.total || 0), 0)
  const ordersThisYear = orders.filter(o => new Date(o.created_at).getFullYear() === new Date().getFullYear()).length
  const savings        = totalSpent && disc ? Math.round(totalSpent * disc / (1 - disc)) : 0

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault()
    setAcctSaving(true)
    if (customer?.id) {
      await supabase.from('customers').update({ contact_name: acctName, phone: acctPhone, address: acctAddr }).eq('id', customer.id)
    }
    setAcctSaving(false); setAcctSaved(true)
    setTimeout(() => setAcctSaved(false), 3000)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwSaving(true); setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: pwNew })
    setPwSaving(false)
    if (error) setPwMsg('Kunde inte byta lösenord: ' + error.message)
    else { setPwMsg('Lösenordet har bytts!'); setPwCurrent(''); setPwNew('') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#fff', border: '1.5px solid rgba(0,0,0,.12)', borderRadius: 8, color: '#111', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
  const TABS = [
    { id: 'overview', label: 'Översikt' },
    { id: 'orders',   label: 'Mina ordrar' },
    { id: 'account',  label: 'Mitt konto' },
  ] as const

  /* Admin/CRM */
  if (role === 'admin' || role === 'crm') {
    const href = role === 'admin' ? '/admin/dashboard' : '/crm/dashboard'
    return (
      <div style={{ paddingTop: 64, minHeight: '100vh', background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#E8B84B', margin: '0 auto 20px' }}>
            {name[0]?.toUpperCase()}
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: '#111', margin: '0 0 8px' }}>Välkommen, {name}</h1>
          <p style={{ fontSize: 15, color: '#888', margin: '0 0 32px' }}>Du är inloggad som {role === 'admin' ? 'administratör' : 'säljare'}.</p>
          <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 32px', borderRadius: 10, background: '#111', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Öppna {role === 'admin' ? 'Admin' : 'CRM'} <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 64, background: '#F8F5F0', minHeight: '100vh' }}>

      {/* Welcome bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)', padding: '24px 24px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#999' }}>Välkommen tillbaka</p>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400, color: '#111' }}>
                {customer?.company || name}
              </h1>
              {priceList !== 'Standard' && (
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#888' }}>
                  Prislista <strong style={{ color: '#C9971A' }}>{priceList}</strong> · {Math.round(disc * 100)}% B2B-rabatt
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 1, background: 'rgba(0,0,0,.06)', borderRadius: 10, overflow: 'hidden' }}>
              {[
                { label: 'Total inköpt', value: totalSpent ? `${fmt(totalSpent)} kr` : '—' },
                { label: 'Ordrar i år',  value: `${ordersThisYear}` },
                { label: 'Besparingar',  value: savings ? `${fmt(savings)} kr` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '12px 20px', background: '#fff', textAlign: 'center', minWidth: 110 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(0,0,0,.06)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '14px 22px', background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#111' : '#888',
                borderBottom: tab === t.id ? '2px solid #111' : '2px solid transparent',
                marginBottom: -1, fontFamily: 'inherit', transition: 'all .15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* ── ÖVERSIKT ── */}
        {tab === 'overview' && (
          <div>
            <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700, color: '#111' }}>Senaste ordrar</h2>
            {loading ? (
              <div style={{ height: 80, background: '#eee', borderRadius: 12, animation: 'pulse 1.5s ease infinite', marginBottom: 40 }} />
            ) : orders.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 40 }}>
                {orders.slice(0, 4).map(o => {
                  const sc = o.status === 'Levererad' ? '#16A34A' : o.status === 'Bekräftad' ? '#2563EB' : '#888'
                  return (
                    <div key={o.id} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.08)', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>#{o.order_nr}</div>
                        <div style={{ fontSize: 12, color: '#bbb', marginTop: 3 }}>{formatDate(o.created_at)}</div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{o.order_items?.length || 0} produkter</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{fmt(o.total)} kr</div>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${sc}15`, color: sc, fontWeight: 700 }}>{o.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 12, padding: '36px', textAlign: 'center', marginBottom: 40 }}>
                <ShoppingBag size={32} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', color: '#ccc' }} />
                <p style={{ margin: 0, fontSize: 14, color: '#999' }}>Inga ordrar ännu</p>
              </div>
            )}

            <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700, color: '#111' }}>Dina produkter</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
              {products.map(p => {
                const price = Math.round(p.list_price * (1 - disc))
                return (
                  <div key={p.id} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.08)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all .2s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#C9971A'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 20px rgba(0,0,0,.08)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(0,0,0,.08)'; el.style.transform = 'none'; el.style.boxShadow = 'none' }}
                  >
                    <div style={{ height: 160, background: '#F5F2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={40} color="#ccc" strokeWidth={1} />}
                    </div>
                    <div style={{ padding: '12px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{p.brand}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', flex: 1, lineHeight: 1.3, marginBottom: 10 }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{fmt(price)} kr</div>
                          {disc > 0 && <div style={{ fontSize: 10, color: '#bbb' }}><s>{fmt(p.list_price)}</s> listpris</div>}
                        </div>
                        <Link href="/produkter" style={{ padding: '7px 14px', borderRadius: 7, background: '#111', color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Beställ</Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── ORDRAR ── */}
        {tab === 'orders' && (
          <div>
            <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700, color: '#111' }}>Alla ordrar</h2>
            {loading ? (
              <div style={{ height: 80, background: '#eee', borderRadius: 12, animation: 'pulse 1.5s ease infinite' }} />
            ) : orders.length === 0 ? (
              <div style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 12, padding: '48px', textAlign: 'center' }}>
                <ShoppingBag size={40} strokeWidth={1} style={{ margin: '0 auto 14px', display: 'block', color: '#ccc' }} />
                <p style={{ margin: 0, fontSize: 15, color: '#999' }}>Inga ordrar ännu</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map(o => {
                  const sc = o.status === 'Levererad' ? '#16A34A' : o.status === 'Bekräftad' ? '#2563EB' : '#888'
                  return (
                    <div key={o.id} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.08)', borderRadius: 12, padding: '18px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>#{o.order_nr}</div>
                            <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>{formatDate(o.created_at)}</div>
                          </div>
                          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, background: `${sc}15`, color: sc, fontWeight: 700 }}>{o.status}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{fmt(o.total)} kr</div>
                          <div style={{ fontSize: 11, color: '#bbb' }}>inkl. moms</div>
                        </div>
                      </div>
                      {o.order_items?.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,.06)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {o.order_items.map((item: any, i: number) => (
                            <span key={i} style={{ fontSize: 12, color: '#666', background: '#F5F2ED', padding: '3px 10px', borderRadius: 5 }}>
                              {item.qty}× {item.product_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MITT KONTO ── */}
        {tab === 'account' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

            {/* Profile */}
            <div style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.08)', borderRadius: 16, padding: '28px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8B84B', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                  {name[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{customer?.company || name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{user.email}</div>
                </div>
              </div>

              <form onSubmit={saveAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>Kontaktperson</label>
                  <input value={acctName} onChange={e => setAcctName(e.target.value)} placeholder="Ditt namn" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>Telefon</label>
                  <input value={acctPhone} onChange={e => setAcctPhone(e.target.value)} placeholder="070-000 00 00" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>Leveransadress</label>
                  <input value={acctAddr} onChange={e => setAcctAddr(e.target.value)} placeholder="Gatuadress, postort" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>E-post</label>
                  <input value={user.email || ''} disabled style={{ ...inp, background: '#F5F2ED', color: '#999', cursor: 'not-allowed' }} />
                </div>
                <button type="submit" disabled={acctSaving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 8, background: acctSaved ? '#16A34A' : '#111', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background .2s' }}>
                  {acctSaved ? <><Check size={15} /> Sparat!</> : acctSaving ? 'Sparar…' : <><Save size={15} /> Spara uppgifter</>}
                </button>
              </form>
            </div>

            {/* Password */}
            <div style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.08)', borderRadius: 16, padding: '28px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <Lock size={18} color="#C9971A" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111' }}>Byt lösenord</h3>
              </div>
              <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>Nytt lösenord</label>
                  <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} required minLength={6} placeholder="Minst 6 tecken" style={inp} />
                </div>
                {pwMsg && (
                  <div style={{ fontSize: 13, padding: '10px 14px', borderRadius: 8, background: pwMsg.includes('bytts') ? '#F0FFF4' : '#FFF5F5', color: pwMsg.includes('bytts') ? '#16A34A' : '#DC2626', border: `1px solid ${pwMsg.includes('bytts') ? '#BBF7D0' : '#FECACA'}` }}>
                    {pwMsg}
                  </div>
                )}
                <button type="submit" disabled={pwSaving} style={{ padding: '12px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  {pwSaving ? 'Sparar…' : 'Byt lösenord'}
                </button>
              </form>

              {/* Price list info */}
              <div style={{ marginTop: 28, padding: '16px 18px', background: '#F8F5F0', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>Din prislista</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{priceList}</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                  {disc > 0 ? `${Math.round(disc * 100)}% rabatt på listpris` : 'Standardpris'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}

/* ─── Hero Slider ─────────────────────────────────────── */
const SLIDES = [
  { bg: '#1A1200', label: 'Tvätt & Rengöring',   heading: 'Professionell\nbilvård för proffs',   sub: 'Premium B2B-produkter för detailingföretag, biltvättar och verkstäder.' },
  { bg: '#0D1A10', label: 'Vax & Ytskydd',        heading: 'Glans som\nhåller längre',             sub: 'Keramiska beläggningar och vaxprodukter med professionell finish.' },
  { bg: '#0A0D1A', label: 'Fälg & Exteriör',      heading: 'Rena fälgar.\nKlara resultat.',        sub: 'Starka rengöringsmedel formulerade för tunga jobb.' },
]

function HeroSlider({ images, openLogin }: { images: string[]; openLogin: () => void }) {
  const [current, setCurrent] = useState(0)
  const slides = images.length > 0 ? images : []
  const total  = Math.max(slides.length, SLIDES.length)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % total), 5000)
    return () => clearInterval(t)
  }, [total])

  const slide = SLIDES[current % SLIDES.length]
  const img   = slides[current % slides.length]

  return (
    <section style={{ position: 'relative', height: 'clamp(480px, 70vh, 760px)', overflow: 'hidden', marginTop: 64 }}>
      {/* Background slides */}
      {img ? (
        <img key={current} src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'slideIn .8s ease' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: slide.bg, transition: 'background .6s ease' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.58) 0%, rgba(0,0,0,.28) 55%, rgba(0,0,0,.08) 100%)' }} />

      {/* Content */}
      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px', width: '100%' }}>
          <div key={current} style={{ maxWidth: 540, animation: 'fadeUp .55s ease' }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.2em' }}>
              {slide.label}
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(38px, 5.5vw, 72px)', fontWeight: 400, color: '#fff', margin: '0 0 18px', lineHeight: 1.08, letterSpacing: '-.01em', whiteSpace: 'pre-line' }}>
              {slide.heading}
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.75)', lineHeight: 1.7, margin: '0 0 34px', maxWidth: 400 }}>
              {slide.sub}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/produkter" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 30px', borderRadius: 8, background: '#fff', color: '#111', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                Se produkter <ArrowRight size={16} />
              </Link>
              <button onClick={openLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 8, background: 'transparent', border: '2px solid rgba(255,255,255,.55)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Logga in
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, background: i === current ? '#fff' : 'rgba(255,255,255,.4)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all .3s ease' }} />
        ))}
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════
   MARKETING HOME — light, no dark sections
════════════════════════════════════════════════════════ */
function MarketingHome({ products, allImages, openLogin }: { products: any[]; allImages: string[]; openLogin: () => void }) {
  return (
    <>
      {/* ── HERO SLIDER ── */}
      <HeroSlider images={allImages} openLogin={openLogin} />

      {/* ── TRUST STRIP ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {TRUST.map(({ icon: Icon, title, sub }, i) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '22px 16px', borderRight: i < 3 ? '1px solid rgba(0,0,0,.07)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F5F2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="#C9971A" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      {products.length > 0 && (
        <section id="virtus-pro-center" style={{ background: '#fff', padding: '80px 24px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em' }}>Storsäljare just nu</p>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: '#111', lineHeight: 1.1 }}>
                    Populära produkter
                  </h2>
                </div>
                <Link href="/produkter" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 8, border: '1.5px solid rgba(0,0,0,.15)', color: '#111', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Se alla <ArrowRight size={15} />
                </Link>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {products.map((p, i) => (
                <Reveal key={p.id} delay={i * 50}>
                  <div style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.08)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 12px 32px rgba(0,0,0,.1)'; el.style.borderColor = '#C9971A' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'none'; el.style.boxShadow = 'none'; el.style.borderColor = 'rgba(0,0,0,.08)' }}
                  >
                    <div style={{ height: 220, background: '#F5F2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={56} color="#ccc" strokeWidth={1} />}
                    </div>
                    <div style={{ padding: '16px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>{p.brand}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111', flex: 1, lineHeight: 1.35, marginBottom: 14 }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#bbb', marginBottom: 2 }}>B2B-pris från</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#C9971A' }}>{fmt(Math.round(p.list_price * 0.6))} kr</div>
                          <div style={{ fontSize: 10, color: '#ccc' }}>exkl. moms</div>
                        </div>
                        <button onClick={openLogin} style={{ padding: '9px 18px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                          Beställ
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORIES ── */}
      <section id="aterforsaljare" style={{ background: '#F8F5F0', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em' }}>Kategorierna</p>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 400, color: '#111' }}>Utvalda kategorier</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.name} delay={i * 40}>
                <Link href="/produkter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 16px', background: '#fff', border: '1.5px solid rgba(0,0,0,.07)', borderRadius: 14, textDecoration: 'none', transition: 'all .2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = '#C9971A'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 24px rgba(0,0,0,.07)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(0,0,0,.07)'; el.style.transform = 'none'; el.style.boxShadow = 'none' }}
                >
                  <span style={{ fontSize: 36, lineHeight: 1 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111', textAlign: 'center' }}>{cat.name}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section id="utbildning" style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em' }}>Våra varumärken</p>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 400, color: '#111' }}>Italiensk precision</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { name: 'Virtus', tagline: 'Precision utan kompromiss', desc: 'Keramiska beläggningar, enzymrengöring och professionella detailingprodukter för de som kräver perfektion.' },
              { name: 'Frescura', tagline: 'Effektivitet i varje droppe', desc: 'Kostnadseffektiva professionella lösningar för höga volymer — konsekvent kvalitet varje dag.' },
            ].map((b, i) => (
              <Reveal key={b.name} delay={i * 100}>
                <div style={{ padding: '40px 36px', border: '1.5px solid rgba(0,0,0,.08)', borderRadius: 16, background: '#F8F5F0' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em' }}>Varumärke</p>
                  <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif)', fontSize: 44, fontWeight: 400, color: '#111', lineHeight: 1, fontStyle: 'italic' }}>{b.name}</h3>
                  <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#555' }}>{b.tagline}</p>
                  <p style={{ margin: '0 0 24px', fontSize: 14, color: '#777', lineHeight: 1.7 }}>{b.desc}</p>
                  <Link href="/produkter" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#C9971A', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                    Utforska {b.name} <ChevronRight size={15} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="om-oss" style={{ background: '#F8F5F0', padding: '72px 24px', borderTop: '1px solid rgba(0,0,0,.07)' }}>
        <Reveal>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
            <Image src="/logo-mark.svg" alt="" width={32} height={44} style={{ display: 'block', margin: '0 auto 18px', opacity: .4 }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 400, color: '#111', margin: '0 0 12px', lineHeight: 1.15 }}>
              Redo att beställa?
            </h2>
            <p style={{ fontSize: 16, color: '#888', margin: '0 0 32px', lineHeight: 1.7 }}>
              Logga in på din kundportal och beställ med dina avtalspriser.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={openLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', borderRadius: 9, background: '#111', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Logga in <ArrowRight size={16} />
              </button>
              <a href="mailto:info@proluxshine.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 9, background: 'transparent', border: '1.5px solid rgba(0,0,0,.15)', color: '#111', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                Kontakta oss
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </>
  )
}

/* ════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════ */
function HomeContent() {
  const openLogin = useLoginModal()
  const [authUser, setAuthUser]       = useState<SupaUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [products, setProducts]       = useState<any[]>([])
  const [allImages, setAllImages]     = useState<string[]>([])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      setAuthChecked(true)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null)
    })
    supabase.from('products').select('id,name,brand,list_price,image_url,unit').eq('active', true).order('sort_order').limit(8)
      .then(({ data }) => {
        if (data) {
          setProducts(data)
          setAllImages(data.filter(p => p.image_url).map((p: any) => p.image_url))
        }
      })
    return () => subscription.unsubscribe()
  }, [])

  if (!authChecked) return <div style={{ minHeight: '100vh', background: '#fff' }} />
  if (authUser) return <PortalHome user={authUser} products={products} />
  return <MarketingHome products={products} allImages={allImages} openLogin={openLogin} />
}

export default function HomePage() {
  return <PublicShell><HomeContent /></PublicShell>
}
