'use client'
import { ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { usePathname } from 'next/navigation'

const PATH_LABELS: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/orders': 'Ordrar',
  '/admin/customers': 'Kunder',
  '/admin/products': 'Produkter',
  '/admin/campaigns': 'Kampanjer',
  '/admin/automations': 'Automationer',
}

export function AdminShell({ children, email }: { children: ReactNode; email: string }) {
  const pathname = usePathname()
  const label = PATH_LABELS[pathname] || 'Admin'

  return (
    <>
      <div style={{position:'fixed',top:0,left:0,right:0,height:'58px',background:'var(--bg2)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 28px 0 calc(248px + 28px)',zIndex:100,gap:16}}>
        <div style={{fontFamily:'var(--font-serif)',fontSize:'15px',fontWeight:500,color:'var(--text)',letterSpacing:'.04em'}}>
          Prolux <span style={{color:'var(--gold)',fontStyle:'italic'}}>Shine</span>
        </div>
        <div style={{width:1,height:12,background:'var(--border)'}}/>
        <div style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text3)',letterSpacing:'.12em'}}>/ {label.toLowerCase()}</div>
        <div style={{marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--text3)',letterSpacing:'.06em'}}>{email}</div>
      </div>
      <AdminSidebar email={email} />
      <main style={{position:'fixed',top:'58px',left:'248px',right:0,bottom:0,overflowY:'auto',background:'var(--bg)'}}>
        {children}
      </main>
    </>
  )
}
