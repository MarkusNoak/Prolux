'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, GitBranch, Users, ShoppingCart, LogOut } from 'lucide-react'

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

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top navbar */}
      <header style={{ height: 58, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', paddingInline: 24, gap: 32, position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>ProLux CRM</span>
        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, background: active ? 'rgba(232,184,75,.1)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text2)', fontSize: 13, fontWeight: active ? 600 : 400, textDecoration: 'none', transition: 'all .15s' }}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}>
          <LogOut size={14} /> Logga ut
        </button>
      </header>
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}
