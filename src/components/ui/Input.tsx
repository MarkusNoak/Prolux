import { cn } from '@/lib/utils'
import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <div>
      {label && <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'6px'}}>{label}</label>}
      <input
        className={cn(className)}
        style={{width:'100%',padding:'10px 14px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--text)',fontFamily:'var(--font-sans)',fontSize:'14px',outline:'none'}}
        {...props}
      />
    </div>
  )
}
