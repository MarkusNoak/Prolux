'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { PublicShell, useLoginModal } from '@/components/layout/PublicShell'
import { fmt, formatDate } from '@/lib/utils'
import {
  ArrowRight, ChevronRight, Package, Truck, Shield, Phone,
  ShoppingBag, FileText, TrendingUp, ExternalLink, Star
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
   LOGGED-IN PORTAL — light, inline on homepage
════════════════════════════════════════════════════════ */
function PortalHome({ user, products }: { user: SupaUser; products: any[] }) {
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  const role      = user.user_metadata?.role
  const name      = user.user_metadata?.full_name || user.email?.split('@')[0] || 'kund'
  const priceList = user.user_metadata?.price_list_id || 'Standard'
  const disc      = DISCOUNT[priceList] ?? 0

  useEffect(() => {
    Promise.all([
      supabase.from('customers').select('*').eq('email', user.email!).maybeSingle(),
      supabase.from('orders')
        .select('id,order_nr,status,total,created_at,order_items(product_name,qty)')
        .eq('customer_id', user.user_metadata?.customer_id ?? '')
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([{ data: c }, { data: o }]) => {
      if (c) setCustomer(c)
      if (o) setOrders(o)
      setLoading(false)
    })
  }, [user])

  const totalSpent     = orders.reduce((s, o) => s + (o.total || 0), 0)
  const ordersThisYear = orders.filter(o => new Date(o.created_at).getFullYear() === new Date().getFullYear()).length
  const savings        = totalSpent && disc ? Math.round(totalSpent * disc / (1 - disc)) : 0

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

  /* Customer portal */
  return (
    <div style={{ paddingTop: 64, background: '#fff', minHeight: '100vh' }}>

      {/* Welcome bar */}
      <div style={{ background: '#F8F5F0', borderBottom: '1px solid rgba(0,0,0,.07)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 13, color: '#999' }}>Välkommen tillbaka</p>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: '#111' }}>
              {customer?.company || name}
            </h1>
            {priceList !== 'Standard' && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
                Prislista <strong style={{ color: '#C9971A' }}>{priceList}</strong> · {Math.round(disc * 100)}% B2B-rabatt
              </p>
            )}
          </div>
          {/* KPIs */}
          <div style={{ display: 'flex', gap: 1, background: 'rgba(0,0,0,.06)', borderRadius: 12, overflow: 'hidden' }}>
            {[
              { label: 'Total inköpt',  value: totalSpent ? `${fmt(totalSpent)} kr` : '—' },
              { label: 'Ordrar i år',   value: `${ordersThisYear}` },
              { label: 'Besparingar',   value: savings ? `${fmt(savings)} kr` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '16px 24px', background: '#fff', textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Recent orders */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>Senaste ordrar</h2>
            <Link href="/portal/orders" style={{ fontSize: 13, color: '#C9971A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Visa alla <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div style={{ height: 80, background: '#F5F3EE', borderRadius: 12, animation: 'pulse 1.5s ease infinite' }} />
          ) : orders.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {orders.map(o => {
                const statusColor = o.status === 'Levererad' ? '#16A34A' : o.status === 'Bekräftad' ? '#2563EB' : '#888'
                return (
                  <div key={o.id} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.08)', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>#{o.order_nr}</div>
                      <div style={{ fontSize: 12, color: '#bbb', marginTop: 3 }}>{formatDate(o.created_at)}</div>
                      {o.order_items?.length > 0 && (
                        <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{o.order_items.length} produkter</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>{fmt(o.total)} kr</div>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${statusColor}15`, color: statusColor, fontWeight: 700 }}>{o.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ background: '#F8F5F0', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 12, padding: '36px', textAlign: 'center', color: '#bbb' }}>
              <ShoppingBag size={32} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#999' }}>Inga ordrar ännu</p>
              <button
                onClick={() => document.getElementById('portal-shop')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ padding: '9px 22px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Bläddra produkter
              </button>
            </div>
          )}
        </div>

        {/* Products with B2B prices */}
        <div id="portal-shop">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111' }}>Dina produkter</h2>
            <Link href="/portal/catalog" style={{ fontSize: 13, color: '#C9971A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Hela sortimentet <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {products.map(p => {
              const price = Math.round(p.list_price * (1 - disc))
              return (
                <div key={p.id} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.08)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all .2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#C9971A'; el.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(0,0,0,.08)'; el.style.boxShadow = 'none'; el.style.transform = 'none' }}
                >
                  <div style={{ height: 180, background: '#F5F2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={44} color="#ccc" strokeWidth={1} />}
                  </div>
                  <div style={{ padding: '14px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{p.brand}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', flex: 1, lineHeight: 1.3, marginBottom: 12 }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{fmt(price)} <span style={{ fontSize: 11, fontWeight: 400, color: '#bbb' }}>kr</span></div>
                        {disc > 0 && <div style={{ fontSize: 10, color: '#bbb' }}><s>{fmt(p.list_price)}</s> listpris</div>}
                      </div>
                      <Link href="/portal/catalog" style={{ padding: '8px 16px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Beställ
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
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
        <section style={{ background: '#fff', padding: '80px 24px' }}>
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
      <section style={{ background: '#F8F5F0', padding: '72px 24px' }}>
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
      <section style={{ background: '#fff', padding: '72px 24px' }}>
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
      <section style={{ background: '#F8F5F0', padding: '72px 24px', borderTop: '1px solid rgba(0,0,0,.07)' }}>
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
