// This file is unused — homepage is at app/page.tsx, products at app/produkter/page.tsx.
// It must exist due to Next.js file conventions but redirects away to avoid conflict.
import { redirect } from 'next/navigation'
export default function UnusedPublicPage() {
  redirect('/produkter')
}
