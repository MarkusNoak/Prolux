'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, GitBranch, Users, ShoppingCart, LogOut, Menu, X, Diamond } from 'lucide-react'

const supabase = createClient()

const NAV = [
  { href: '/crm/dashboard', label: 'Översikt', icon: LayoutDashboard },
  { href: '/crm/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/crm/customers', label: 'Kunder', icon: Users },
  { href: '/crm/orders', label: 'Ordrar', icon: ShoppingCart },
]

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top navbar */}
      <header style={{
        height: 58,
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        paddingInline: 20,
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Logo */}
        <Link href="/crm/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 30,
            height: 30,
            background: 'var(--gold)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Diamond size={16} color="#111" fill="#111" />
          </div>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>ProLux Shine</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }} className="desktop-nav">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 14px',
                borderRadius: 8,
                background: active ? 'rgba(232,184,75,.1)' : 'transparent',
                color: active ? 'var(--gold)' : 'var(--text2)',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                transition: 'all .15s'
              }}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop logout */}
        <button onClick={logout} className="desktop-logout" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text3)',
          fontSize: 12,
          cursor: 'pointer',
          flexShrink: 0,
        }}>
          <LogOut size={14} /> Logga ut
        </button>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="mobile-menu-btn"
          style={{
            marginLeft: 'auto',
            padding: 8,
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position: 'fixed',
          top: 58,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--bg2)',
          zIndex: 99,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                background: active ? 'rgba(232,184,75,.1)' : 'var(--bg3)',
                color: active ? 'var(--gold)' : 'var(--text)',
                fontSize: 15,
                fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                border: active ? '1px solid rgba(232,184,75,.2)' : '1px solid var(--border)',
              }}>
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
          <div style={{ flex: 1 }} />
          <button onClick={logout} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            color: 'var(--text2)',
            fontSize: 15,
            cursor: 'pointer',
          }}>
            <LogOut size={18} /> Logga ut
          </button>
        </div>
      )}

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <style>{`
        .desktop-nav { display: none !important; }
        .desktop-logout { display: none !important; }
        .mobile-menu-btn { display: flex !important; }
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-logout { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  )
}
