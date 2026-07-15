'use client'
import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronRight } from 'lucide-react'

const NAV = [
  { href: '/produkter', label: 'Produkter' },
  { href: '/#varfoross', label: 'Varför oss' },
  { href: '/#kontakt', label: 'Kontakt' },
]

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Topbar ─────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 68,
        background: scrolled ? 'rgba(8,10,14,.92)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(180%) blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        transition: 'all .3s ease',
        display: 'flex', alignItems: 'center',
        paddingInline: 24, gap: 16,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <Image src="/logo-mark.svg" alt="Prolux Shine" width={26} height={36} priority style={{ display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 1 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 400, letterSpacing: '.14em', color: 'var(--text)', textTransform: 'uppercase' }}>Prolux</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 7, fontWeight: 700, letterSpacing: '.45em', color: 'var(--gold)', textTransform: 'uppercase' }}>Shine</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="pub-desktop-nav" style={{ display: 'none', gap: 4, flex: 1, alignItems: 'center', marginLeft: 24 }}>
          {NAV.map(({ href, label }) => {
            const active = href !== '/#varfoross' && href !== '/#kontakt' && pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                padding: '7px 14px', borderRadius: 7,
                color: active ? 'var(--text)' : 'var(--text2)',
                fontSize: 14, fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                transition: 'color .15s',
              }}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="pub-desktop-right" style={{ display: 'none', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <Link href="/login" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 22px', borderRadius: 8,
            background: 'var(--gold)',
            color: '#111',
            fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '.02em',
          }}>
            Logga in
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="pub-mobile-btn"
          aria-label="Meny"
          style={{ marginLeft: 'auto', padding: 8, background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0, bottom: 0,
          background: 'rgba(8,10,14,.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 199,
          padding: '24px 20px 40px',
          display: 'flex', flexDirection: 'column', gap: 8,
          animation: 'fadeIn .15s ease',
        }}>
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderRadius: 10,
              background: 'rgba(255,255,255,.03)',
              border: '1px solid var(--line)',
              color: 'var(--text)', fontSize: 16, fontWeight: 500,
              textDecoration: 'none',
            }}>
              {label}
              <ChevronRight size={16} color="var(--text3)" />
            </Link>
          ))}
          <div style={{ flex: 1 }} />
          <Link href="/login" onClick={() => setMenuOpen(false)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px 20px', borderRadius: 10,
            background: 'var(--gold)', border: 'none',
            color: '#111', fontSize: 16, fontWeight: 700,
            textDecoration: 'none',
          }}>
            Logga in på kundportalen
          </Link>
        </div>
      )}

      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer id="kontakt" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--line)', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 56 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Image src="/logo-mark.svg" alt="Prolux Shine" width={22} height={30} style={{ display: 'block' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 1 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 400, letterSpacing: '.14em', color: 'var(--text)', textTransform: 'uppercase' }}>Prolux</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 6.5, fontWeight: 700, letterSpacing: '.45em', color: 'var(--gold)', textTransform: 'uppercase' }}>Shine</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 220 }}>
                Premium bilvårdsprodukter för professionella — distributör av Virtus & Frescura i Sverige.
              </p>
            </div>

            {/* Produkter */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Produkter</div>
              {['Tvätt & Rengöring', 'Vax & Polish', 'Fälgvård', 'Exteriör', 'Interiör', 'Avfettning'].map(c => (
                <Link key={c} href="/produkter" style={{ display: 'block', fontSize: 13, color: 'var(--text2)', textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text2)'}>
                  {c}
                </Link>
              ))}
            </div>

            {/* Kundportal */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Kundportal</div>
              {[
                { label: 'Logga in', href: '/login' },
                { label: 'Min profil', href: '/portal/dashboard' },
                { label: 'Mina ordrar', href: '/portal/orders' },
                { label: 'Bli B2B-kund', href: '/login' },
              ].map(({ label, href }) => (
                <Link key={label} href={href} style={{ display: 'block', fontSize: 13, color: 'var(--text2)', textDecoration: 'none', marginBottom: 10 }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text2)'}>
                  {label}
                </Link>
              ))}
            </div>

            {/* Kontakt */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Kontakt</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 2 }}>
                <div>info@proluxshine.com</div>
                <div>08-123 456 78</div>
                <div style={{ marginTop: 12, color: 'var(--text3)' }}>Mån–Fre 08–17</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)' }}>
              © {new Date().getFullYear()} ProLuxShine. Alla rättigheter förbehållna.
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text3)' }}>
              Distributör av Virtus & Frescura Sverige
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        .pub-desktop-nav   { display: none !important; }
        .pub-desktop-right { display: none !important; }
        .pub-mobile-btn    { display: flex !important; }
        @media (min-width: 860px) {
          .pub-desktop-nav   { display: flex !important; }
          .pub-desktop-right { display: flex !important; }
          .pub-mobile-btn    { display: none !important; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
