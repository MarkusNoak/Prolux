'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { PublicShell, useLoginModal } from '@/components/layout/PublicShell'
import { fmt } from '@/lib/utils'
import { ArrowRight, ChevronRight, Package, Star, Shield, Truck, Phone, CheckCircle } from 'lucide-react'

const supabase = createClient()

/* ── Scroll-reveal hook ────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)', transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms` }}>
      {children}
    </div>
  )
}

const CATEGORIES = [
  { name: 'Tvätt & Rengöring', emoji: '🫧' },
  { name: 'Vax & Polish', emoji: '✨' },
  { name: 'Fälgvård', emoji: '🔩' },
  { name: 'Exteriör', emoji: '🚗' },
  { name: 'Interiör', emoji: '🪑' },
  { name: 'Avfettning', emoji: '⚗️' },
]

function HomeContent() {
  const openLogin = useLoginModal()
  const [featured, setFeatured] = useState<any[]>([])
  const [heroImg, setHeroImg] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('products').select('id,name,brand,list_price,image_url,unit').eq('active', true).order('sort_order').limit(8).then(({ data }) => {
      if (data) {
        setFeatured(data)
        const first = data.find(p => p.image_url)
        if (first) setHeroImg(first.image_url)
      }
    })
  }, [])

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          HERO — full viewport, dark, cinematic
      ════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#080A0D', overflow: 'hidden' }}>
        {/* Background glow orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '60%', height: '80%', background: 'radial-gradient(circle, rgba(232,184,75,.07) 0%, transparent 65%)', animation: 'slowDrift 12s ease-in-out infinite alternate' }} />
          <div style={{ position: 'absolute', bottom: '-5%', right: '5%', width: '45%', height: '60%', background: 'radial-gradient(circle, rgba(74,143,212,.05) 0%, transparent 65%)', animation: 'slowDrift 15s ease-in-out infinite alternate-reverse' }} />
        </div>

        {/* Hero product image — right side */}
        {heroImg && (
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '48%', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #080A0D 0%, rgba(8,10,13,.4) 40%, transparent 100%)', zIndex: 1 }} />
            <img src={heroImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.55, filter: 'contrast(1.1) saturate(1.2)' }} />
          </div>
        )}
        {!heroImg && (
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '48%', background: 'linear-gradient(135deg, rgba(232,184,75,.04) 0%, rgba(8,10,13,0) 100%)' }} />
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '120px 24px 80px', width: '100%' }}>
          <div style={{ maxWidth: 580 }}>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', border: '1px solid rgba(232,184,75,.3)', borderRadius: 20, marginBottom: 32, animation: 'fadeUp .6s ease both' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8B84B', display: 'block', animation: 'pulse 2s ease infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#E8B84B', textTransform: 'uppercase', letterSpacing: '.12em' }}>Officiell distributör — Virtus & Frescura</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(44px, 6vw, 84px)', fontWeight: 400, color: '#F0EDE8', lineHeight: 1.05, letterSpacing: '-.02em', margin: '0 0 24px', animation: 'fadeUp .7s .1s ease both' }}>
              Professionell<br />
              bilvård som<br />
              <em style={{ color: '#E8B84B' }}>faktiskt fungerar</em>
            </h1>

            <p style={{ fontSize: 18, color: 'rgba(240,237,232,.6)', lineHeight: 1.75, margin: '0 0 44px', maxWidth: 460, animation: 'fadeUp .7s .2s ease both' }}>
              B2B-produkter för detailingföretag, biltvättar och bilverkstäder. Snabb leverans, personlig säljare, garanterade resultat.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'fadeUp .7s .3s ease both' }}>
              <Link href="/produkter" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 32px', borderRadius: 10, background: '#E8B84B', color: '#0D0900', fontSize: 15, fontWeight: 800, textDecoration: 'none', letterSpacing: '.01em', boxShadow: '0 0 40px rgba(232,184,75,.3)' }}>
                Se produkter <ArrowRight size={17} />
              </Link>
              <button onClick={openLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 32px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#F0EDE8', fontSize: 15, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                Logga in
              </button>
            </div>

            {/* Trust strip */}
            <div style={{ display: 'flex', gap: 24, marginTop: 56, flexWrap: 'wrap', animation: 'fadeUp .7s .4s ease both' }}>
              {[
                { icon: CheckCircle, text: 'Fri frakt över 2 000 kr' },
                { icon: CheckCircle, text: 'Leverans nästa vardag' },
                { icon: CheckCircle, text: 'Personlig säljare' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'rgba(240,237,232,.5)', fontWeight: 500 }}>
                  <Icon size={14} color="rgba(232,184,75,.6)" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'bounce 2s ease infinite' }}>
          <div style={{ width: 1, height: 48, background: 'linear-gradient(180deg, transparent, rgba(232,184,75,.4))' }} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS STRIP
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: '#E8B84B', padding: '0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderLeft: '1px solid rgba(0,0,0,.1)' }}>
            {[
              { value: '500+', label: 'Nöjda B2B-kunder' },
              { value: '12',   label: 'Produktlinjer' },
              { value: '48h',  label: 'Leveranstid' },
              { value: '15 år', label: 'I branschen' },
            ].map(({ value, label }) => (
              <div key={label} style={{ padding: '28px 24px', borderRight: '1px solid rgba(0,0,0,.1)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: '#0D0900', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,.5)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURED PRODUCTS — editorial grid
      ════════════════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section style={{ padding: '100px 24px', background: '#F8F5F0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 56, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Sortiment</p>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: '#111', margin: 0, lineHeight: 1.1 }}>
                    Produkter som<br /><em>gör skillnad</em>
                  </h2>
                </div>
                <Link href="/produkter" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, border: '1.5px solid rgba(0,0,0,.15)', color: '#111', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Se alla produkter <ArrowRight size={15} />
                </Link>
              </div>
            </Reveal>

            {/* Big editorial grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 18 }}>
              {/* Large card — first product */}
              {featured[0] && (
                <Reveal delay={0}>
                  <div style={{ gridColumn: 'span 12' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 20, overflow: 'hidden', background: '#111', minHeight: 440 }}>
                      <div style={{ background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: 440 }}>
                        {featured[0].image_url
                          ? <img src={featured[0].image_url} alt={featured[0].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Package size={80} color="#333" strokeWidth={1} />}
                      </div>
                      <div style={{ padding: '52px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#E8B84B', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 16 }}>{featured[0].brand}</div>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 400, color: '#F0EDE8', margin: '0 0 16px', lineHeight: 1.2 }}>{featured[0].name}</h3>
                        <p style={{ fontSize: 14, color: 'rgba(240,237,232,.5)', margin: '0 0 32px', lineHeight: 1.7 }}>
                          Professionell kvalitet för detailing-proffs. Formulerad för riktiga resultat varje gång.
                        </p>
                        <div style={{ marginBottom: 28 }}>
                          <div style={{ fontSize: 11, color: 'rgba(240,237,232,.4)', marginBottom: 4 }}>B2B-pris från</div>
                          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 400, color: '#E8B84B' }}>{fmt(Math.round(featured[0].list_price * 0.6))} <span style={{ fontSize: 20 }}>kr</span></div>
                          <div style={{ fontSize: 12, color: 'rgba(240,237,232,.3)', marginTop: 2 }}>exkl. moms · {featured[0].unit}</div>
                        </div>
                        <button onClick={openLogin} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 9, background: '#E8B84B', color: '#0D0900', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                          Beställ nu <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Smaller cards */}
              <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18, marginTop: 4 }}>
                {featured.slice(1).map((p, i) => (
                  <Reveal key={p.id} delay={i * 60}>
                    <div style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', transition: 'all .25s', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,.1)'; el.style.borderColor = '#C9971A' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'none'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,.04)'; el.style.borderColor = 'rgba(0,0,0,.06)' }}
                    >
                      <div style={{ height: 220, background: '#F5F2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s ease' }} /> : <Package size={52} color="#ccc" strokeWidth={1} />}
                      </div>
                      <div style={{ padding: '18px 20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{p.brand}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#111', flex: 1, lineHeight: 1.35, marginBottom: 16 }}>{p.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#C9971A' }}>{fmt(Math.round(p.list_price * 0.6))} kr</div>
                            <div style={{ fontSize: 10, color: '#ccc' }}>exkl. moms</div>
                          </div>
                          <button onClick={openLogin} style={{ padding: '9px 18px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Beställ
                          </button>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          BRANDS — dark cinematic
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: '#080A0D', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '80%', height: '80%', background: 'radial-gradient(ellipse, rgba(232,184,75,.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#E8B84B', textTransform: 'uppercase', letterSpacing: '.2em', marginBottom: 16 }}>Våra varumärken</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 400, color: '#F0EDE8', margin: 0, lineHeight: 1.1 }}>
                Italiensk precision,<br /><em style={{ color: '#E8B84B' }}>svenska proffs</em>
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              {
                name: 'Virtus',
                tagline: 'Precision utan kompromiss',
                desc: 'Keramiska beläggningar, enzymrengöring och professionella detailingprodukter framtagna för de som kräver perfektion. Från Ferrari-verkstäder till topptävlingar.',
                accent: '#E8B84B',
              },
              {
                name: 'Frescura',
                tagline: 'Effektivitet i varje droppe',
                desc: 'Kostnadseffektiva professionella lösningar för höga volymer. Frescura levererar konsekvent kvalitet för biltvättar, verkstäder och detailare som jobbar hårt varje dag.',
                accent: '#6AAFF0',
              },
            ].map((b, i) => (
              <Reveal key={b.name} delay={i * 150}>
                <div style={{ padding: '48px 44px', border: `1px solid ${b.accent}1A`, borderRadius: 20, background: `linear-gradient(135deg, #0F1115 0%, ${b.accent}08 100%)`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${b.accent}0C 0%, transparent 70%)` }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: b.accent, textTransform: 'uppercase', letterSpacing: '.18em', marginBottom: 10 }}>Varumärke</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 52, fontWeight: 400, color: '#F0EDE8', lineHeight: 1, marginBottom: 8, fontStyle: 'italic' }}>{b.name}</div>
                  <div style={{ fontSize: 13, color: b.accent, fontWeight: 600, marginBottom: 20 }}>{b.tagline}</div>
                  <p style={{ fontSize: 14, color: 'rgba(240,237,232,.5)', lineHeight: 1.8, margin: '0 0 32px' }}>{b.desc}</p>
                  <Link href="/produkter" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: b.accent, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                    Utforska {b.name} <ChevronRight size={16} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CATEGORIES
      ════════════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Kategorierna</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, color: '#111', margin: 0 }}>
                Allt du behöver
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.name} delay={i * 50}>
                <Link href="/produkter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 16px', background: '#F8F5F0', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 16, textDecoration: 'none', textAlign: 'center', transition: 'all .2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#FEF8E8'; el.style.borderColor = '#C9971A'; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#F8F5F0'; el.style.borderColor = 'rgba(0,0,0,.06)'; el.style.transform = 'none' }}
                >
                  <div style={{ fontSize: 40, lineHeight: 1 }}>{cat.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{cat.name}</div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHY US — dark band with large type
      ════════════════════════════════════════════════════════ */}
      <section id="varfoross" style={{ padding: '100px 24px', background: '#111' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 64 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#E8B84B', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 14 }}>Varför välja oss</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 400, color: '#F0EDE8', margin: 0, lineHeight: 1.1 }}>
                Valt av proffs,<br /><em style={{ color: '#E8B84B' }}>varje dag</em>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
            {[
              { icon: Shield, n: '01', title: 'Professionell kvalitet', desc: 'Samma produkter som proffs inom bilvård använder dagligen. Formulerade för riktiga resultat, inte för hyllan.' },
              { icon: Star,   n: '02', title: 'Exklusiv distributör', desc: 'Officiell distributör av Virtus och Frescura i Sverige. Garanterad äkthet, rätt pris, alltid i lager.' },
              { icon: Truck,  n: '03', title: 'Snabb leverans', desc: 'Beställ före 14:00 — leverans nästa vardag. Fri frakt över 2 000 kr. Din verksamhet stannar inte upp.' },
              { icon: Phone,  n: '04', title: 'Din personliga säljare', desc: 'Inte en robot, inte ett callcenter. En säljare som känner ditt företag och vet exakt vad du behöver.' },
            ].map(({ icon: Icon, n, title, desc }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div style={{ padding: '40px 32px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 48, fontWeight: 400, color: 'rgba(232,184,75,.15)', lineHeight: 1 }}>{n}</span>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(232,184,75,.08)', border: '1px solid rgba(232,184,75,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                      <Icon size={20} color="#E8B84B" />
                    </div>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: '#F0EDE8', margin: '0 0 12px' }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(240,237,232,.45)', lineHeight: 1.8, margin: 0 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA — full-bleed gold
      ════════════════════════════════════════════════════════ */}
      <section style={{ background: '#E8B84B', padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <>
              <Image src="/logo-mark.svg" alt="" width={36} height={50} style={{ display: 'block', margin: '0 auto 20px', filter: 'brightness(0)' }} />
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 400, color: '#0D0900', margin: '0 0 16px', lineHeight: 1.1 }}>
                Redo att beställa?
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(0,0,0,.5)', margin: '0 0 40px', lineHeight: 1.7 }}>
                Logga in på din kundportal och beställ med dina B2B-priser. Inte kund? Kontakta oss.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={openLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px', borderRadius: 10, background: '#0D0900', color: '#E8B84B', fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer', letterSpacing: '.01em' }}>
                  Logga in på kundportalen <ArrowRight size={18} />
                </button>
                <a href="mailto:info@proluxshine.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 10, background: 'rgba(0,0,0,.08)', border: '1px solid rgba(0,0,0,.15)', color: '#0D0900', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
                  Kontakta oss
                </a>
              </div>
            </>
          </Reveal>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slowDrift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(3%,5%) scale(1.05); }
        }
        @keyframes bounce {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: .4; }
        }
      `}</style>
    </>
  )
}

export default function HomePage() {
  return <PublicShell><HomeContent /></PublicShell>
}
