import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortalShell } from '@/components/layout/PortalShell'

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = user.email || ''
  const priceList = (user.user_metadata?.price_list as string) || 'B'

  return (
    <PortalShell email={email} priceList={priceList}>
      {children}
    </PortalShell>
  )
}
