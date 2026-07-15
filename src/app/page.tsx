'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { PublicShell } from '@/components/layout/PublicShell'
import { fmt } from '@/lib/utils'
import { ChevronRight, Star, Shield, Truck, Phone, Package } from 'lucide-react'

const supabase = createClient()

const CATEGORIES = [
  { name: 'Tvätt & Rengöring', emoji: '🫧', desc: 'Skonsamma och kraftfulla tvättmedel' },
  { name: 'Vax & Polish', emoji: '✨', desc: 'Lyster och skydd i ett' },
  { name: 'Fälgvård', emoji: '🔩', desc: 'Specialformulerat för fälgar' },
  { name: 'Exteriör', emoji: '🚗', desc: 'Helhetsskydd för lackyta' },
  { name: 'Interiör', emoji: '🪑', desc: 'Rengöring och impregnering' },
  { name: 'Avfettning', emoji: '⚗️', desc: 'Professionell förbehandling' },
]

const USP = [
  { icon: Shield, title: 'Professionell kvalitet', desc: 'Samma produkter som proffs inom bilvård använder dagligen. Formulerade för riktiga resultat.' },
  { icon: Star, title: 'Exklusiv distributör', desc: 'Vi är officiell distributör av Virtus och Frescura i Sverige — garanterad äkthet.' },
  { icon: Truck, title: 'Snabb leverans', desc: 'Beställ före 14:00 — leverans nästa vardag. Fri frakt över 2 000 kr.' },
  { icon: Phone, title: 'Dedikerad support', desc: 'Personlig säljare som känner ditt företag och hjälper dig hitta rätt produkter.' },
]

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([])

  useEffect(() => {
    supabase.from('products').select('id,name,brand,list_price,image_url,unit').eq('active', true).order('sort_order').limit(6).then(({ data }) => {
      if (data) setFeatured(data)
    })
  }, [])

  return (
    <PublicShell>
      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,184,75,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(74,143,212,.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', right: '8%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(232,184,75,.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Brand pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(232,184,75,.08)', border: '1px solid rgba(232,184,75,.2)', borderRadius: 20, marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Virtus & Frescura Sverige</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(38px, 7vw, 80px)',
          fontWeight: 400,
          color: 'var(--text)',
          lineHeight: 1.1,
          letterSpacing: '-.01em',
          marginBottom: 24,
          maxWidth: 800,
        }}>
          Premium bilvård<br />
          <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>för proffs</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'var(--text2)', maxWidth: 520, lineHeight: 1.7, marginBottom: 44 }}>
          Professionella bilvårdsprodukter till detailingföretag, biltvättar och bilverkstäder i hela Sverige. B2B-priser, snabb leverans, personlig service.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/produkter" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 10,
            background: 'var(--gold)',
            color: '#111', fontSize: 15, fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 0 32px rgba(232,184,75,.25)',
          }}>
            Utforska produkter <ChevronRight size={16} />
          </Link>
          <Link href="/login" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 10,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,.14)',
            color: 'var(--text)', fontSize: 15, fontWeight: 500,
            textDecoration: 'none',
          }}>
            Logga in som kund
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 48, marginTop: 72, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { value: '500+', label: 'B2B-kunder' },
            { value: '12', label: 'Produktlinjer' },
            { value: '48h', label: 'Leveranstid' },
            { value: '15 år', label: 'I branschen' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: 'var(--gold)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg2)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Sortiment</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: 'var(--text)', margin: 0 }}>
              Allt du behöver, på ett ställe
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {CATEGORIES.map(cat => (
              <Link key={cat.name} href="/produkter" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                padding: '28px 16px',
                background: 'var(--bg3)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                textDecoration: 'none',
                textAlign: 'center',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'var(--line-gold)'; el.style.background = 'rgba(232,184,75,.04)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'var(--line)'; el.style.background = 'var(--bg3)' }}
              >
                <div style={{ fontSize: 36, lineHeight: 1 }}>{cat.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cat.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{cat.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ───────────────────────────────── */}
      {featured.length > 0 && (
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>Utvalda produkter</p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, color: 'var(--text)', margin: 0 }}>
                  Professionella favoriter
                </h2>
              </div>
              <Link href="/produkter" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                Se alla produkter <ChevronRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {featured.map(p => (
                <div key={p.id} style={{ background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', transition: 'all .2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--line-gold)'; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--line)'; el.style.transform = 'none' }}
                >
                  <div style={{ height: 180, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={48} color="var(--text3)" strokeWidth={1} />}
                  </div>
                  <div style={{ padding: '18px 20px 20px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{p.brand}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>B2B-pris från</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{fmt(Math.round(p.list_price * 0.6))} kr</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>exkl. moms · {p.unit}</div>
                      </div>
                      <Link href="/login" style={{ padding: '10px 18px', borderRadius: 8, background: 'var(--gold)', color: '#111', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                        Beställ
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── VARFÖR OSS ──────────────────────────────────────── */}
      <section id="varfoross" style={{ padding: '80px 24px', background: 'var(--bg2)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Varför ProLuxShine</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: 'var(--text)', margin: 0 }}>
              Valt av proffs, <span style={{ fontStyle: 'italic' }}>varje dag</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {USP.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ padding: '32px 28px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(232,184,75,.08)', border: '1px solid rgba(232,184,75,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={22} color="var(--gold)" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--text)', margin: '0 0 12px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VARUMÄRKEN ──────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, var(--bg3) 0%, rgba(232,184,75,.04) 100%)', border: '1px solid var(--line)', borderRadius: 20, padding: '40px 36px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,184,75,.08) 0%, transparent 70%)' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 16 }}>Varumärke</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: 'var(--text)', margin: '0 0 16px', fontStyle: 'italic' }}>Virtus</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 24px' }}>
              Italiensk precision möter svensk noggrannhet. Virtus professionella serie är framtagen för de som kräver perfektion — från keramiska beläggningar till enzymrengöring.
            </p>
            <Link href="/produkter" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Utforska Virtus <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ background: 'linear-gradient(135deg, var(--bg3) 0%, rgba(74,143,212,.04) 100%)', border: '1px solid var(--line)', borderRadius: 20, padding: '40px 36px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,143,212,.08) 0%, transparent 70%)' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6AAFF0', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 16 }}>Varumärke</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: 'var(--text)', margin: '0 0 16px', fontStyle: 'italic' }}>Frescura</h3>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: '0 0 24px' }}>
              Fräschör och effektivitet i varje droppe. Frescura-serien erbjuder kostnadseffektiva professionella lösningar utan att kompromissa på resultat.
            </p>
            <Link href="/produkter" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6AAFF0', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Utforska Frescura <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, rgba(232,184,75,.06) 0%, rgba(74,143,212,.04) 100%)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <Image src="/logo-mark.svg" alt="" width={40} height={55} style={{ display: 'block', margin: '0 auto 24px' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 16px', lineHeight: 1.15 }}>
            Redo att beställa?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text2)', margin: '0 0 36px', lineHeight: 1.7 }}>
            Logga in på din kundportal och beställ med dina B2B-priser. Inte kund ännu? Kontakta oss så hjälper vi dig.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '15px 36px', borderRadius: 10,
              background: 'var(--gold)', color: '#111', fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 40px rgba(232,184,75,.2)',
            }}>
              Logga in på kundportalen
            </Link>
            <a href="mailto:info@proluxshine.com" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '15px 36px', borderRadius: 10,
              background: 'transparent', border: '1px solid rgba(255,255,255,.14)',
              color: 'var(--text)', fontSize: 15, fontWeight: 500, textDecoration: 'none',
            }}>
              Kontakta oss
            </a>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
