'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}

export function Modal({ open, onClose, title, children, footer, wide }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div 
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',padding:'20px'}}
    >
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'14px',width:'100%',maxWidth:wide?640:480,maxHeight:'90vh',display:'flex',flexDirection:'column',animation:'mup .22s cubic-bezier(.22,.68,0,1.1)'}}>
        <style>{`@keyframes mup{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{padding:'20px 24px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{fontFamily:'var(--font-serif)',fontSize:'22px',fontWeight:500,color:'var(--text)'}}>{title}</div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,background:'var(--bg3)',border:'none',color:'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X size={14} />
          </button>
        </div>
        <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>{children}</div>
        {footer && <div style={{padding:'14px 24px',borderTop:'1px solid var(--border)',display:'flex',gap:10,justifyContent:'flex-end',flexShrink:0}}>{footer}</div>}
      </div>
    </div>
  )
}
