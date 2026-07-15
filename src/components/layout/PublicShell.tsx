'use client'
import { ReactNode, useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export const LoginModalContext = createContext<() => void>(() => {})

export function useLoginModal() { return useContext(LoginModalContext) }

const NAV = [
  { href: '/produkter', label: 'Produkter' },
  { href: '/#varfoross', label: 'Varför oss' },
  { href: '/#kontakt', label: 'Kontakt' },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 8, color: 'var(--text)',
  fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
}

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function openLogin() { setLoginOpen(true); setMenuOpen(false); setError('') }
  function closeLogin() { setLoginOpen(false); setEmail(''); setPassword(''); setError('') }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Fel lösenord eller e-post. Försök igen.'); setLoading(false); return }
    const role = data.user?.user_metadata?.role
    if (role === 'admin') window.location.href = '/admin/dashboard'
    else if (role === 'crm') window.location.href = '/crm/dashboard'
    else window.location.href = '/portal/dashboard'
  }

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
          <button onClick={openLogin} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 22px', borderRadius: 8,
            background: 'var(--gold)',
            color: '#111',
            fontSize: 13, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            letterSpacing: '.02em',
          }}>
            Logga in
          </button>
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
          <button onClick={openLogin} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px 20px', borderRadius: 10,
            background: 'var(--gold)', border: 'none',
            color: '#111', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', width: '100%',
          }}>
            Logga in på kundportalen
          </button>
        </div>
      )}

      <LoginModalContext.Provider value={openLogin}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </LoginModalContext.Provider>

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

      {/* ── LOGIN MODAL ──────────────────────────────────────── */}
      {loginOpen && (
        <div
          onClick={closeLogin}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn .15s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 400,
              background: 'rgba(13,16,23,.95)',
              backdropFilter: 'saturate(180%) blur(24px)',
              WebkitBackdropFilter: 'saturate(180%) blur(24px)',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 20,
              boxShadow: '0 1px 0 rgba(255,255,255,.05) inset, 0 24px 80px rgba(0,0,0,.7)',
              padding: '36px 32px',
              position: 'relative',
            }}
          >
            {/* Close */}
            <button onClick={closeLogin} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 6 }}>
              <X size={18} />
            </button>

            {/* Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <Image src="/logo-mark.svg" alt="Prolux Shine" width={44} height={61} style={{ display: 'block' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 400, letterSpacing: '.18em', color: 'var(--text)', textTransform: 'uppercase' }}>Prolux</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700, letterSpacing: '.45em', color: 'var(--gold)', textTransform: 'uppercase' }}>Shine</span>
              </div>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--text)', margin: '0 0 4px', textAlign: 'center' }}>Logga in</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', margin: '0 0 24px', textAlign: 'center' }}>B2B-portal för återförsäljare</p>

            {/* Demo accounts */}
            <div style={{ marginBottom: 20, padding: '12px 14px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, fontSize: 12, color: 'var(--text3)', lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Demo-konton · lösenord: <span style={{ color: 'var(--gold)' }}>prolux2024</span></div>
              {[
                { label: 'bashar@proluxshine.se', role: 'Admin', color: '#E8B84B', em: 'bashar@proluxshine.se' },
                { label: 'stefan@detailingproffs.se', role: 'Säljare', color: '#4A8FD4', em: 'stefan@detailingproffs.se' },
                { label: 'demo@proluxshine.se', role: 'Kund', color: '#4CAF7D', em: 'demo@proluxshine.se' },
              ].map(({ label, role, color, em }) => (
                <div key={em} onClick={() => { setEmail(em); setPassword('prolux2024') }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 6, padding: '2px 4px', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,.04)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                  <span style={{ color: 'var(--text2)' }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${color}18`, color, flexShrink: 0 }}>{role}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>E-post</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="namn@foretag.se" autoFocus
                  style={inp}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(232,184,75,.35)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,184,75,.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>Lösenord</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={inp}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(232,184,75,.35)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,184,75,.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
              {error && (
                <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(224,82,82,.08)', border: '1px solid rgba(224,82,82,.2)', borderRadius: 6, padding: '8px 12px' }}>
                  {error}
                </div>
              )}
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  background: loading ? 'rgba(232,184,75,.5)' : 'linear-gradient(135deg, #E8B84B 0%, #F5CC6A 50%, #D4A33C 100%)',
                  color: '#0D0A00', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
                  letterSpacing: '.03em', border: 'none', borderRadius: 8,
                  cursor: loading ? 'default' : 'pointer',
                  boxShadow: loading ? 'none' : '0 2px 16px rgba(232,184,75,.3)',
                  marginTop: 4,
                }}
              >
                {loading ? 'Loggar in…' : 'Logga in'}
              </button>
            </form>
          </div>
        </div>
      )}

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
