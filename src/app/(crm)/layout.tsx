import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CrmShell from '@/components/layout/CrmShell'
import { AdminShell } from '@/components/layout/AdminShell'

export const metadata = {
  title: 'Prolux CRM',
  description: 'Säljverktyg för Prolux Shine-teamet',
  manifest: '/crm-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Prolux CRM',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const role = user.user_metadata?.role
  if (role !== 'crm' && role !== 'admin') redirect('/login')
  if (role === 'admin') return (
    <>
      <head>
        <link rel="manifest" href="/crm-manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Prolux CRM" />
        <meta name="theme-color" content="#0F1115" />
      </head>
      <AdminShell email={user.email || ''}>{children}</AdminShell>
    </>
  )
  return (
    <>
      <head>
        <link rel="manifest" href="/crm-manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Prolux CRM" />
        <meta name="theme-color" content="#0F1115" />
      </head>
      <CrmShell>{children}</CrmShell>
    </>
  )
}
