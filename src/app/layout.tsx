import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProLuxShine — Premium Bilvård för Proffs',
  description: 'Professionella bilvårdsprodukter för detailingföretag, biltvättar och bilverkstäder. Distributör av Virtus & Frescura i Sverige.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}
