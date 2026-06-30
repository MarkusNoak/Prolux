import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CrmShell from '@/components/layout/CrmShell'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = user.user_metadata?.role
  if (role !== 'crm' && role !== 'admin') redirect('/login')
  return <CrmShell>{children}</CrmShell>
}
