import { cn } from '@/lib/utils'
import { OrderStatus, PriceList } from '@/types'

interface BadgeProps {
  status: OrderStatus | PriceList | string
  type?: 'order' | 'pricelist' | 'custom'
  className?: string
}

export function Badge({ status, type, className }: BadgeProps) {
  const orderColors: Record<string, string> = {
    pending: 'background:rgba(212,138,58,.12);color:var(--amber)',
    confirmed: 'background:rgba(232,184,75,.12);color:var(--gold)',
    packed: 'background:rgba(232,184,75,.12);color:var(--gold)',
    shipped: 'background:rgba(66,153,225,.12);color:#4299E1',
    delivered: 'background:rgba(76,175,125,.12);color:var(--green)',
    cancelled: 'background:rgba(224,82,82,.12);color:var(--red)',
    draft: 'background:rgba(155,163,176,.08);color:var(--text2)',
    active: 'background:rgba(76,175,125,.12);color:var(--green)',
    inactive: 'background:rgba(155,163,176,.08);color:var(--text2)',
    prospect: 'background:rgba(74,143,212,.12);color:var(--blue)',
  }
  const plColors: Record<string, string> = {
    A: 'background:rgba(232,184,75,.15);color:var(--gold)',
    B: 'background:rgba(232,236,240,.08);color:var(--text)',
    C: 'background:rgba(232,236,240,.06);color:var(--text2)',
    Standard: 'background:rgba(232,236,240,.04);color:var(--text3)',
  }
  const style = type === 'pricelist' ? plColors[status] : (orderColors[status] || 'background:rgba(155,163,176,.08);color:var(--text2)')
  return (
    <span 
      className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded', className)}
      style={{...Object.fromEntries(style.split(';').filter(Boolean).map(s=>s.split(':').map(x=>x.trim())).map(([k,v])=>[k.replace(/-([a-z])/g,(_,l)=>l.toUpperCase()),v]))}}
    >
      {status}
    </span>
  )
}
