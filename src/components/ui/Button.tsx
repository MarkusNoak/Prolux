import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'ghost' | 'danger' | 'primary'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'gold', size = 'md', className, children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold cursor-pointer border-none rounded-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    gold: 'bg-gold text-[#111] hover:opacity-90',
    primary: 'bg-gold text-[#111] hover:opacity-90',
    ghost: 'bg-transparent border border-border text-text2 hover:border-gold hover:text-gold',
    danger: 'bg-transparent border border-red/30 text-red hover:bg-red/10',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-sm' }
  return (
    <button 
      className={cn(base, variants[variant], sizes[size], className)} 
      style={{fontFamily:'var(--font-sans)'}}
      {...props}
    >
      {children}
    </button>
  )
}
