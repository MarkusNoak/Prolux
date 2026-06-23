import { cn } from '@/lib/utils'

export function Card({ className, children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn('rounded-lg border', className)}
      style={{background:'var(--bg2)',borderColor:'var(--border)',...style}}
      {...props}
    >
      {children}
    </div>
  )
}
