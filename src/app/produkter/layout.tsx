import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alla Produkter',
  description: 'Handla professionella bilvårdsprodukter från Virtus & Frescura. Bilpolish, keramisk coating, fälgrengöring, bilschampo och mycket mer. B2B-priser för proffs.',
  keywords: ['bilvårdsprodukter', 'bilpolish', 'keramisk coating', 'fälgrengöring', 'bilschampo', 'detailing produkter', 'Virtus', 'Frescura'],
  openGraph: {
    title: 'Alla Produkter | ProLuxShine',
    description: 'Professionella bilvårdsprodukter från Virtus & Frescura. B2B-priser för detailingföretag och biltvättar.',
    url: 'https://proluxshine.com/produkter',
  },
  alternates: { canonical: 'https://proluxshine.com/produkter' },
}

export default function ProdukterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
