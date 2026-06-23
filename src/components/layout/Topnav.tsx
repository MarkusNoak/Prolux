'use client'
import { ShoppingBag } from 'lucide-react'

interface TopnavProps {
  title?: string
  email?: string
  priceList?: string
  cartCount?: number
  onCartClick?: () => void
  onMenuClick?: () => void
}

export function Topnav({ title, email, priceList, cartCount, onCartClick, onMenuClick }: TopnavProps) {
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,height:'58px',background:'var(--bg2)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 20px 0 calc(248px + 20px)',zIndex:100,gap:16}}>
      <div style={{fontFamily:'var(--font-serif)',fontSize:'15px',fontWeight:500,color:'var(--text)',letterSpacing:'.04em'}}>
        Prolux <span style={{color:'var(--gold)',fontStyle:'italic'}}>Shine</span>
      </div>
      {title && <>
        <div style={{width:1,height:16,background:'var(--border)'}}/>
        <div style={{fontSize:'13px',color:'var(--text3)'}}>{title}</div>
      </>}
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:12}}>
        {email && <div style={{fontSize:'12px',color:'var(--text3)'}}>Inloggad som <strong style={{color:'var(--text2)'}}>{email}</strong></div>}
        {priceList && <div style={{fontSize:'11px',fontWeight:600,padding:'3px 10px',borderRadius:4,background:'var(--gold-bg)',color:'var(--gold)',border:'1px solid var(--gold-b)'}}>{priceList}</div>}
        {onCartClick !== undefined && (
          <button onClick={onCartClick} style={{width:38,height:38,border:'1px solid var(--border)',borderRadius:8,background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative'}}>
            <ShoppingBag size={17} style={{color:'var(--text2)'}} />
            {(cartCount||0) > 0 && <div style={{position:'absolute',top:-6,right:-6,width:18,height:18,background:'var(--gold)',color:'#111',fontSize:9,fontWeight:700,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>{cartCount}</div>}
          </button>
        )}
      </div>
    </div>
  )
}
