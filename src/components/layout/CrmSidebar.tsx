'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/crm/dashboard', label: 'Översikt' },
  { href: '/crm/pipeline', label: 'Pipeline' },
  { href: '/crm/customers', label: 'Kunder' },
  { href: '/crm/orders', label: 'Ordrar' },
  { href: '/crm/pricelists', label: 'Prislistor' },
]

export function CrmSidebar({ email }: { email?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav style={{position:'sticky',top:0,left:0,right:0,height:'58px',background:'var(--bg2)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 24px',zIndex:100,gap:0}}>
      <div style={{fontFamily:'var(--font-serif)',fontSize:'17px',fontWeight:500,color:'var(--text)',marginRight:'32px',whiteSpace:'nowrap'}}>
        Prolux <span style={{color:'var(--gold)',fontStyle:'italic'}}>Shine</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'4px',flex:1}}>
        {navItems.map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding:'6px 14px',
                fontSize:'13px',
                fontWeight:active?500:400,
                color:active?'var(--text)':'var(--text3)',
                textDecoration:'none',
                borderRadius:'6px',
                background:active?'var(--gold-bg)':'transparent',
                border:`1px solid ${active?'var(--gold-b)':'transparent'}`,
                transition:'all .15s',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginLeft:'auto'}}>
        {email && (
          <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'var(--text3)'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'var(--bg4)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <User size={13} style={{color:'var(--text2)'}} />
            </div>
            <span style={{color:'var(--text2)'}}>{email}</span>
          </div>
        )}
        <button
          onClick={logout}
          style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'var(--text3)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-sans)',padding:'6px 10px',borderRadius:'6px'}}
        >
          <LogOut size={13} /> Logga ut
        </button>
      </div>
    </nav>
  )
}
