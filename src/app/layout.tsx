import type { Metadata } from 'next'
import './globals.css'

const BASE_URL = 'https://proluxshine.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ProLuxShine — Premium Bilvård för Proffs',
    template: '%s | ProLuxShine',
  },
  description: 'Professionella bilvårdsprodukter för detailingföretag, biltvättar och bilverkstäder. Distributör av Virtus & Frescura i Sverige. B2B-priser, snabb leverans.',
  keywords: ['bilvård', 'detailing', 'bilpolish', 'keramisk coating', 'bilvårdsprodukter', 'Virtus', 'Frescura', 'B2B', 'bilschampo', 'fälgrengöring'],
  authors: [{ name: 'ProLuxShine' }],
  creator: 'ProLuxShine',
  publisher: 'ProLuxShine AB',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    url: BASE_URL,
    siteName: 'ProLuxShine',
    title: 'ProLuxShine — Premium Bilvård för Proffs',
    description: 'Professionella bilvårdsprodukter för detailingföretag, biltvättar och bilverkstäder. Distributör av Virtus & Frescura i Sverige.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'ProLuxShine' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProLuxShine — Premium Bilvård för Proffs',
    description: 'Professionella bilvårdsprodukter för detailingföretag och biltvättar.',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: BASE_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}
