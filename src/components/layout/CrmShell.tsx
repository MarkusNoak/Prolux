'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { LayoutDashboard, GitBranch, Users, ShoppingCart, LogOut, Menu, X } from 'lucide-react'
import Image from 'next/image'

const NAV = [
  { href: '/crm/dashboard', label: 'Översikt',  icon: LayoutDashboard },
  { href: '/crm/pipeline',  label: 'Pipeline',  icon: GitBranch },
  { href: '/crm/customers', label: 'Kunder',    icon: Users },
  { href: '/crm/orders',    label: 'Ordrar',    icon: ShoppingCart },
]

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top navbar ────────────────────────────────────── */}
      <header style={{
        height: 'var(--nav-h)',
        background: 'rgba(8,10,14,.88)',
        borderBottom: '1px solid var(--line)',
        backdropFilter: 'saturate(180%) blur(24px)',
        WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        boxShadow: '0 1px 0 rgba(255,255,255,.03) inset',
        display: 'flex',
        alignItems: 'center',
        paddingInline: 24,
        gap: 8,
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>

        {/* Logo */}
        <Link href="/crm/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, marginRight: 8 }}>
          <Image src="/logo.svg" alt="Prolux Shine" width={130} height={38} priority style={{ display: 'block' }} />
        </Link>

        {/* Desktop nav */}
        <nav className="desktop-nav" style={{ display: 'none', gap: 2, flex: 1, justifyContent: 'center' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 14px',
                borderRadius: 8,
                background: active ? 'rgba(232,184,75,.09)' : 'transparent',
                color: active ? 'var(--gold)' : 'var(--text3)',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                transition: 'all .15s',
                border: `1px solid ${active ? 'var(--line-gold)' : 'transparent'}`,
              }}>
                <Icon size={14} style={{ opacity: active ? 1 : 0.6 }} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="desktop-right" style={{ display: 'none', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: '50%',
            background: 'var(--bg4)',
            border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text2)',
          }} title="Bashar">B</div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid var(--line)',
            borderRadius: 8,
            color: 'var(--text3)',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all .15s',
          }}>
            <LogOut size={13} /> Logga ut
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="mobile-menu-btn"
          aria-label="Menu"
          style={{
            marginLeft: 'auto',
            padding: 8,
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {/* ── Mobile dropdown ───────────────────────────────── */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 'var(--nav-h)',
          left: 0, right: 0, bottom: 0,
          background: 'rgba(8,10,14,.97)',
          backdropFilter: 'blur(24px)',
          zIndex: 199,
          padding: '16px 16px 32px',
          display: 'flex', flexDirection: 'column', gap: 6,
          animation: 'fadeIn .15s ease',
        }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '15px 18px',
                borderRadius: 10,
                background: active ? 'rgba(232,184,75,.08)' : 'var(--bg2)',
                color: active ? 'var(--gold)' : 'var(--text)',
                fontSize: 15, fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                border: `1px solid ${active ? 'var(--gold-b)' : 'var(--line)'}`,
              }}>
                <Icon size={18} style={{ color: active ? 'var(--gold)' : 'var(--text3)' }} />
                {label}
              </Link>
            )
          })}
          <div style={{ flex: 1 }} />
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '15px 18px',
            background: 'var(--bg2)',
            border: '1px solid var(--line)',
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
        .desktop-nav   { display: none !important; }
        .desktop-right { display: none !important; }
        .mobile-menu-btn { display: flex !important; }
        @media (min-width: 768px) {
          .desktop-nav   { display: flex !important; }
          .desktop-right { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
