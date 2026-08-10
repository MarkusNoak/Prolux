'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { PublicShell, useLoginModal } from '@/components/layout/PublicShell'
import { fmt } from '@/lib/utils'
import { ChevronRight, Star, Shield, Truck, Phone, Package, ArrowRight } from 'lucide-react'

const supabase = createClient()

const CATEGORIES = [
  { name: 'Tvätt & Rengöring', emoji: '🫧', href: '/produkter' },
  { name: 'Vax & Polish', emoji: '✨', href: '/produkter' },
  { name: 'Fälgvård', emoji: '🔩', href: '/produkter' },
  { name: 'Exteriör', emoji: '🚗', href: '/produkter' },
  { name: 'Interiör', emoji: '🪑', href: '/produkter' },
  { name: 'Avfettning', emoji: '⚗️', href: '/produkter' },
]

const USP = [
  { icon: Shield, title: 'Professionell kvalitet', desc: 'Samma produkter som proffs inom bilvård använder dagligen.' },
  { icon: Star,   title: 'Exklusiv distributör',   desc: 'Officiell distributör av Virtus och Frescura i Sverige.' },
  { icon: Truck,  title: 'Snabb leverans',          desc: 'Beställ före 14:00 — leverans nästa vardag. Fri frakt över 2 000 kr.' },
  { icon: Phone,  title: 'Dedikerad support',       desc: 'Personlig säljare som hjälper dig hitta rätt produkter.' },
]

function HomeContent() {
  const openLogin = useLoginModal()
  const [featured, setFeatured] = useState<any[]>([])

  useEffect(() => {
    supabase.from('products').select('id,name,brand,list_price,image_url,unit').eq('active', true).order('sort_order').limit(6).then(({ data }) => {
      if (data) setFeatured(data)
    })
  }, [])

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '100px 24px 80px',
        background: 'linear-gradient(180deg, #FFFEF9 0%, #F5F0E4 60%, #FAFAF8 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '15%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,184,75,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,184,75,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Brand pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(201,151,26,.1)', border: '1px solid rgba(201,151,26,.25)', borderRadius: 20, marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9971A' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#C9971A', letterSpacing: '.08em', textTransform: 'uppercase' }}>Virtus & Frescura Sverige</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(38px, 7vw, 76px)',
          fontWeight: 400,
          color: '#111',
          lineHeight: 1.1,
          letterSpacing: '-.02em',
          marginBottom: 24,
          maxWidth: 800,
        }}>
          Premium bilvård<br />
          <em style={{ color: '#C9971A' }}>för proffs</em>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: '#666', maxWidth: 520, lineHeight: 1.7, marginBottom: 44 }}>
          Professionella bilvårdsprodukter till detailingföretag, biltvättar och bilverkstäder i hela Sverige. B2B-priser, snabb leverans, personlig service.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/produkter" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 10, background: '#111', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Utforska produkter <ArrowRight size={16} />
          </Link>
          <button onClick={openLogin} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 10, background: 'transparent', border: '1.5px solid rgba(0,0,0,.15)', color: '#333', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            Logga in som kund
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 56, marginTop: 72, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { value: '500+', label: 'B2B-kunder' },
            { value: '12', label: 'Produktlinjer' },
            { value: '48h', label: 'Leveranstid' },
            { value: '15 år', label: 'I branschen' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 400, color: '#C9971A', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 10 }}>Sortiment</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: '#111', margin: 0 }}>
              Allt du behöver, på ett ställe
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {CATEGORIES.map(cat => (
              <Link key={cat.name} href={cat.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                padding: '28px 16px',
                background: '#F9F7F3',
                border: '1.5px solid rgba(0,0,0,.06)',
                borderRadius: 14,
                textDecoration: 'none', textAlign: 'center',
                transition: 'all .2s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = '#C9971A'; el.style.background = '#FEF9EE' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(0,0,0,.06)'; el.style.background = '#F9F7F3' }}
              >
                <div style={{ fontSize: 36, lineHeight: 1 }}>{cat.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ───────────────────────────────── */}
      {featured.length > 0 && (
        <section style={{ padding: '80px 24px', background: '#F5F3EE' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>Utvalda produkter</p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, color: '#111', margin: 0 }}>
                  Professionella favoriter
                </h2>
              </div>
              <Link href="/produkter" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C9971A', fontSize: 14, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                Se alla produkter <ChevronRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
              {featured.map(p => (
                <div key={p.id} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 14, overflow: 'hidden', transition: 'all .2s', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#C9971A'; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 8px 24px rgba(201,151,26,.1)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(0,0,0,.06)'; el.style.transform = 'none'; el.style.boxShadow = '0 1px 4px rgba(0,0,0,.04)' }}
                >
                  <div style={{ height: 200, background: '#F9F7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={52} color="#ccc" strokeWidth={1} />}
                  </div>
                  <div style={{ padding: '18px 20px 20px' }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{p.brand}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>B2B-pris från</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#C9971A' }}>{fmt(Math.round(p.list_price * 0.6))} kr</div>
                        <div style={{ fontSize: 11, color: '#bbb' }}>exkl. moms · {p.unit}</div>
                      </div>
                      <button onClick={openLogin} style={{ padding: '10px 18px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                        Beställ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── VARFÖR OSS ──────────────────────────────────────── */}
      <section id="varfoross" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 10 }}>Varför ProLuxShine</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: '#111', margin: 0 }}>
              Valt av proffs, <em>varje dag</em>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {USP.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ padding: '32px 28px', background: '#F9F7F3', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(201,151,26,.1)', border: '1px solid rgba(201,151,26,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Icon size={22} color="#C9971A" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: '#111', margin: '0 0 10px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VARUMÄRKEN ──────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#F5F3EE' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {[
            { name: 'Virtus', desc: 'Italiensk precision möter svensk noggrannhet. Virtus professionella serie är framtagen för de som kräver perfektion — från keramiska beläggningar till enzymrengöring.', accent: '#C9971A' },
            { name: 'Frescura', desc: 'Fräschör och effektivitet i varje droppe. Frescura-serien erbjuder kostnadseffektiva professionella lösningar utan att kompromissa på resultat.', accent: '#2563EB' },
          ].map(b => (
            <div key={b.name} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 20, padding: '40px 36px', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: b.accent, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 14 }}>Varumärke</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: '#111', margin: '0 0 14px', fontStyle: 'italic' }}>{b.name}</h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: '0 0 24px' }}>{b.desc}</p>
              <Link href="/produkter" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: b.accent, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Utforska {b.name} <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#111' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <Image src="/logo-mark.svg" alt="" width={36} height={50} style={{ display: 'block', margin: '0 auto 20px', opacity: 0.9 }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, color: '#fff', margin: '0 0 16px', lineHeight: 1.15 }}>
            Redo att beställa?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', margin: '0 0 36px', lineHeight: 1.7 }}>
            Logga in på din kundportal och beställ med dina B2B-priser. Inte kund ännu? Kontakta oss.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={openLogin} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 36px', borderRadius: 10, background: '#E8B84B', color: '#111', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Logga in på kundportalen
            </button>
            <a href="mailto:info@proluxshine.com" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 36px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: '#fff', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
              Kontakta oss
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

export default function HomePage() {
  return <PublicShell><HomeContent /></PublicShell>
}
