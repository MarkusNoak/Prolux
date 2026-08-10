'use client'
import { ReactNode, useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ChevronRight, ShoppingBag, User, LogOut, Package, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupaUser } from '@supabase/supabase-js'

export const LoginModalContext = createContext<() => void>(() => {})
export function useLoginModal() { return useContext(LoginModalContext) }

const NAV = [
  { href: '/produkter', label: 'Produkter' },
  { href: '/#varfoross', label: 'Varför oss' },
  { href: '/#kontakt', label: 'Kontakt' },
]

const S = {
  inp: {
    width: '100%', padding: '12px 14px',
    background: 'rgba(0,0,0,.04)',
    border: '1px solid rgba(0,0,0,.1)',
    borderRadius: 8, color: '#111',
    fontFamily: 'inherit', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
  } as React.CSSProperties,
}

export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [scrolled, setScrolled]   = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [userDropOpen, setUserDropOpen] = useState(false)
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [authUser, setAuthUser]   = useState<SupaUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function openLogin()  { setLoginOpen(true); setMenuOpen(false); setError('') }
  function closeLogin() { setLoginOpen(false); setEmail(''); setPassword(''); setError('') }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const sb = createClient()
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) { setError('Fel lösenord eller e-post. Försök igen.'); setLoading(false); return }
    setAuthUser(data.user)
    closeLogin()
    setLoading(false)
  }

  async function handleLogout() {
    const sb = createClient()
    await sb.auth.signOut()
    setAuthUser(null)
    setUserDropOpen(false)
  }

  function goToPortal() {
    const role = authUser?.user_metadata?.role
    if (role === 'admin') router.push('/admin/dashboard')
    else if (role === 'crm') router.push('/crm/dashboard')
    else router.push('/portal/dashboard')
    setUserDropOpen(false)
  }

  const role = authUser?.user_metadata?.role
  const displayName = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Kund'
  const priceList   = authUser?.user_metadata?.price_list_id

  const navBg = scrolled
    ? 'rgba(255,255,255,.96)'
    : 'rgba(255,255,255,.85)'

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', display: 'flex', flexDirection: 'column', color: '#111' }}>

      {/* ── Topbar ─────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 64,
        background: navBg,
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,.08)' : '1px solid rgba(0,0,0,.06)',
        transition: 'all .3s ease',
        display: 'flex', alignItems: 'center',
        paddingInline: 24, gap: 16,
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,.06)' : 'none',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <Image src="/logo-mark.svg" alt="Prolux Shine" width={24} height={33} priority style={{ display: 'block' }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 1 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 400, letterSpacing: '.14em', color: '#111', textTransform: 'uppercase' }}>Prolux</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 7, fontWeight: 700, letterSpacing: '.45em', color: '#C9971A', textTransform: 'uppercase' }}>Shine</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="pub-desktop-nav" style={{ display: 'none', gap: 2, flex: 1, alignItems: 'center', marginLeft: 20 }}>
          {NAV.map(({ href, label }) => {
            const active = href !== '/#varfoross' && href !== '/#kontakt' && pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                padding: '7px 14px', borderRadius: 7,
                color: active ? '#111' : '#555',
                fontSize: 14, fontWeight: active ? 600 : 400,
                textDecoration: 'none', transition: 'color .15s',
              }}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="pub-desktop-right" style={{ display: 'none', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {!authLoading && (
            authUser ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserDropOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 14px 7px 10px', borderRadius: 8,
                    background: '#111', color: '#fff',
                    fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer', gap: 8,
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E8B84B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#111', flexShrink: 0 }}>
                    {displayName[0]?.toUpperCase()}
                  </div>
                  {displayName}
                  {priceList && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#E8B84B22', color: '#C9971A', fontWeight: 700 }}>{priceList}</span>}
                  <ChevronDown size={13} />
                </button>
                {userDropOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 200, background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.12)', overflow: 'hidden', zIndex: 999 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,.06)', fontSize: 12, color: '#888' }}>
                      {authUser.email}
                    </div>
                    <button onClick={goToPortal} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', fontSize: 14, color: '#111', cursor: 'pointer', textAlign: 'left' }}>
                      <Package size={14} color="#C9971A" /> Min portal
                    </button>
                    <Link href="/portal/orders" onClick={() => setUserDropOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', fontSize: 14, color: '#111', textDecoration: 'none' }}>
                      <ShoppingBag size={14} color="#555" /> Mina ordrar
                    </Link>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', fontSize: 14, color: '#E05252', cursor: 'pointer', borderTop: '1px solid rgba(0,0,0,.06)', textAlign: 'left' }}>
                      <LogOut size={14} /> Logga ut
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={openLogin} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 22px', borderRadius: 8,
                background: '#111', color: '#fff',
                fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
              }}>
                Logga in
              </button>
            )
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="pub-mobile-btn"
          aria-label="Meny"
          style={{ marginLeft: 'auto', padding: 8, background: 'transparent', border: 'none', color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 199,
          padding: '24px 20px 40px',
          display: 'flex', flexDirection: 'column', gap: 8,
          animation: 'fadeIn .15s ease',
        }}>
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderRadius: 10,
              background: '#F5F3EE',
              border: '1px solid rgba(0,0,0,.06)',
              color: '#111', fontSize: 16, fontWeight: 500,
              textDecoration: 'none',
            }}>
              {label}
              <ChevronRight size={16} color="#999" />
            </Link>
          ))}
          <div style={{ flex: 1 }} />
          {authUser ? (
            <>
              <button onClick={goToPortal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 20px', borderRadius: 10, background: '#111', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                <Package size={17} /> Min portal
              </button>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(0,0,0,.1)', color: '#E05252', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 4 }}>
                <LogOut size={15} /> Logga ut
              </button>
            </>
          ) : (
            <button onClick={openLogin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px', borderRadius: 10, background: '#111', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              Logga in på kundportalen
            </button>
          )}
        </div>
      )}

      {userDropOpen && <div onClick={() => setUserDropOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 198 }} />}

      <LoginModalContext.Provider value={openLogin}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </LoginModalContext.Provider>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer id="kontakt" style={{ background: '#111', color: '#fff', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 56 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Image src="/logo-mark.svg" alt="Prolux Shine" width={22} height={30} style={{ display: 'block' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 1 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 400, letterSpacing: '.14em', color: '#fff', textTransform: 'uppercase' }}>Prolux</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 6.5, fontWeight: 700, letterSpacing: '.45em', color: '#E8B84B', textTransform: 'uppercase' }}>Shine</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, maxWidth: 220 }}>
                Premium bilvårdsprodukter för professionella — distributör av Virtus & Frescura i Sverige.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Produkter</div>
              {['Tvätt & Rengöring', 'Vax & Polish', 'Fälgvård', 'Exteriör', 'Interiör', 'Avfettning'].map(c => (
                <Link key={c} href="/produkter" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none', marginBottom: 10 }}>{c}</Link>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Kundportal</div>
              {authUser ? (
                <>
                  <button onClick={goToPortal} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10, fontFamily: 'inherit' }}>Min portal</button>
                  <Link href="/portal/orders" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none', marginBottom: 10 }}>Mina ordrar</Link>
                </>
              ) : (
                <>
                  <button onClick={openLogin} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10, fontFamily: 'inherit' }}>Logga in</button>
                  <button onClick={openLogin} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Bli B2B-kund</button>
                </>
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Kontakt</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 2 }}>
                <div>info@proluxshine.com</div>
                <div>08-123 456 78</div>
                <div style={{ marginTop: 12, color: 'rgba(255,255,255,.3)' }}>Mån–Fre 08–17</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.3)' }}>© {new Date().getFullYear()} ProLuxShine. Alla rättigheter förbehållna.</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.3)' }}>Distributör av Virtus & Frescura Sverige</p>
          </div>
        </div>
      </footer>

      {/* ── LOGIN MODAL ──────────────────────────────────────── */}
      {loginOpen && (
        <div onClick={closeLogin} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .15s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,.2)', padding: '36px 32px', position: 'relative' }}>
            <button onClick={closeLogin} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 6 }}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <Image src="/logo-mark.svg" alt="Prolux Shine" width={40} height={55} style={{ display: 'block' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 400, letterSpacing: '.18em', color: '#111', textTransform: 'uppercase' }}>Prolux</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700, letterSpacing: '.45em', color: '#C9971A', textTransform: 'uppercase' }}>Shine</span>
              </div>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: '#111', margin: '0 0 4px', textAlign: 'center' }}>Logga in</h2>
            <p style={{ fontSize: 13, color: '#999', margin: '0 0 20px', textAlign: 'center' }}>B2B-portal för återförsäljare</p>

            {/* Demo accounts */}
            <div style={{ marginBottom: 20, padding: '12px 14px', background: '#F5F3EE', border: '1px solid rgba(0,0,0,.06)', borderRadius: 10, fontSize: 12, color: '#888', lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, color: '#555', marginBottom: 6 }}>Demo-konton · lösenord: <span style={{ color: '#C9971A' }}>prolux2024</span></div>
              {[
                { label: 'bashar@proluxshine.se',     role: 'Admin',   color: '#B8860B', em: 'bashar@proluxshine.se' },
                { label: 'stefan@detailingproffs.se', role: 'Säljare', color: '#2563EB', em: 'stefan@detailingproffs.se' },
                { label: 'demo@proluxshine.se',       role: 'Kund',    color: '#16A34A', em: 'demo@proluxshine.se' },
              ].map(({ label, role, color, em }) => (
                <div key={em} onClick={() => { setEmail(em); setPassword('prolux2024') }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 6, padding: '2px 4px' }}>
                  <span style={{ color: '#333' }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${color}18`, color }}>{role}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>E-post</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="namn@foretag.se" autoFocus style={S.inp}
                  onFocus={e => { e.currentTarget.style.borderColor = '#C9971A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,151,26,.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,.1)'; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.08em' }}>Lösenord</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={S.inp}
                  onFocus={e => { e.currentTarget.style.borderColor = '#C9971A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,151,26,.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,.1)'; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              {error && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px' }}>{error}</div>}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#ddd' : '#111', color: loading ? '#999' : '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, letterSpacing: '.03em', border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer', marginTop: 4 }}>
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
