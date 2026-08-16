'use client'

import { PublicShell } from '@/components/layout/PublicShell'
import Link from 'next/link'
import { useState } from 'react'

const CATEGORIES = ['Alla', 'Tvätt', 'Polering', 'Interiör', 'Lackskydd', 'Fälgar']

const GUIDES = [
  {
    id: 1,
    title: 'Så tvättar du bilen på rätt sätt',
    category: 'Tvätt',
    desc: 'Lär dig grunderna i biltvätt – rätt teknik, rätt produkter och i rätt ordning. Undvik swirl-märken och skydda lacken.',
    img: 'https://proluxshine.com/wp-content/uploads/2025/11/a7ffd562-5a98-4bc9-86a4-9af4db4d2282.webp',
    readTime: '5 min',
    tag: 'Nybörjare',
    tagColor: '#4CAF7D',
  },
  {
    id: 2,
    title: 'Polering – välj rätt pad och polermedel',
    category: 'Polering',
    desc: 'En komplett guide till maskinpolering. Vi går igenom skillnaderna mellan cutting, polishing och finishing pads.',
    img: 'https://proluxshine.com/wp-content/uploads/2025/11/IMG_3023.webp',
    readTime: '8 min',
    tag: 'Avancerad',
    tagColor: '#4A8FD4',
  },
  {
    id: 3,
    title: 'Interiörrengöring som gör skillnad',
    category: 'Interiör',
    desc: 'Steg för steg: hur du rengör instrumentbräda, knappar, säten och mattor till showroom-standard.',
    img: 'https://proluxshine.com/wp-content/uploads/2025/11/80690ec5-0bae-4ee3-803e-6d263b1ef2d5.webp',
    readTime: '6 min',
    tag: 'Nybörjare',
    tagColor: '#4CAF7D',
  },
  {
    id: 4,
    title: 'Lackskydd – så håller det längre',
    category: 'Lackskydd',
    desc: 'Vax, sealant eller keramiskt skydd? Vi förklarar skillnaderna och hjälper dig välja rätt för din situation.',
    img: 'https://proluxshine.com/wp-content/uploads/2025/11/df6ba40f-08c4-4e50-9b1e-a4cdedfb8ef9.webp',
    readTime: '7 min',
    tag: 'Mellansteg',
    tagColor: '#E8B84B',
  },
  {
    id: 5,
    title: 'Fälgrengöring utan att skada lacken',
    category: 'Fälgar',
    desc: 'Bromsdamm och smuts sätter sig hårt på fälgar. Lär dig rätt teknik och produkter för att tvätta säkert.',
    img: 'https://proluxshine.com/wp-content/uploads/2025/11/575e0484-9b37-4d05-8e8a-6803b7e1a38b.webp',
    readTime: '4 min',
    tag: 'Nybörjare',
    tagColor: '#4CAF7D',
  },
  {
    id: 6,
    title: 'Avfettning innan polering',
    category: 'Polering',
    desc: 'Varför du alltid måste avfetta lacken ordentligt innan du polerar – och vilka produkter vi rekommenderar.',
    img: 'https://proluxshine.com/wp-content/uploads/2025/11/IMG_8356.webp',
    readTime: '3 min',
    tag: 'Tips',
    tagColor: '#9BA0AB',
  },
  {
    id: 7,
    title: 'Tvåhinkmetoden – minska risken för repor',
    category: 'Tvätt',
    desc: 'Tvåhinkmetoden är standard hos proffs. Så här fungerar det och varför du bör börja använda den direkt.',
    img: 'https://proluxshine.com/wp-content/uploads/2025/11/IMG_7192.webp',
    readTime: '4 min',
    tag: 'Tips',
    tagColor: '#9BA0AB',
  },
  {
    id: 8,
    title: 'Keramiskt lackskydd – komplett guide',
    category: 'Lackskydd',
    desc: 'Allt du behöver veta om keramiska beläggningar: förberedelse, applicering, härdning och skötsel.',
    img: 'https://proluxshine.com/wp-content/uploads/2025/11/a7ffd562-5a98-4bc9-86a4-9af4db4d2282.webp',
    readTime: '12 min',
    tag: 'Avancerad',
    tagColor: '#4A8FD4',
  },
]

export default function GuiderPage() {
  const [activeCategory, setActiveCategory] = useState('Alla')
  const [search, setSearch] = useState('')

  const filtered = GUIDES.filter(g => {
    const matchCat = activeCategory === 'Alla' || g.category === activeCategory
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <PublicShell>
      <style>{`
        .guides-hero { background: #0D0F13; padding: 64px 0 48px; text-align: center; }
        .guides-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1100px) { .guides-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 760px) { .guides-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .guides-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Hero */}
      <div className="guides-hero">
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ color: '#E8B84B', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Kunskap & Inspiration
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: '#F0EDE8', marginBottom: 16, lineHeight: 1.15 }}>
            Guider & Tips
          </h1>
          <p style={{ color: '#9BA0AB', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
            Lär dig mer om bilvård med våra expertguider. Från nybörjare till avancerade tekniker.
          </p>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök guider..."
              style={{ width: '100%', background: '#1E2128', border: '1px solid #2A2F3A', borderRadius: 8, padding: '12px 48px 12px 16px', color: '#F0EDE8', fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9BA0AB', cursor: 'pointer', fontSize: 18 }}>×</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#0F1115', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>

          {/* Category filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 20,
                  border: activeCategory === cat ? '1px solid #E8B84B' : '1px solid #2A2F3A',
                  background: activeCategory === cat ? '#E8B84B' : 'transparent',
                  color: activeCategory === cat ? '#0F1115' : '#9BA0AB',
                  fontSize: 13,
                  fontWeight: activeCategory === cat ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', color: '#5C6270', fontSize: 13, alignSelf: 'center' }}>
              {filtered.length} guider
            </span>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#5C6270' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
              <p style={{ fontSize: 16 }}>Inga guider matchade sökningen.</p>
            </div>
          ) : (
            <div className="guides-grid">
              {filtered.map(guide => (
                <article key={guide.id} style={{ background: '#161920', borderRadius: 12, overflow: 'hidden', border: '1px solid #1E2128', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                >
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img
                      src={guide.img}
                      alt={guide.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                    <span style={{ position: 'absolute', top: 12, left: 12, background: guide.tagColor, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em' }}>
                      {guide.tag}
                    </span>
                    <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#9BA0AB', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>
                      {guide.readTime} läsning
                    </span>
                  </div>
                  <div style={{ padding: 20 }}>
                    <p style={{ color: '#E8B84B', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      {guide.category}
                    </p>
                    <h3 style={{ color: '#F0EDE8', fontSize: 16, fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>
                      {guide.title}
                    </h3>
                    <p style={{ color: '#9BA0AB', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                      {guide.desc}
                    </p>
                    <Link href={`/guider/${guide.id}`} style={{ color: '#E8B84B', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      Läs guide →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop: 80, background: '#161920', border: '1px solid #1E2128', borderRadius: 16, padding: '48px 40px', textAlign: 'center' }}>
            <p style={{ color: '#E8B84B', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>B2B-partner</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
              Köp professionella produkter till grossistpris
            </h2>
            <p style={{ color: '#9BA0AB', fontSize: 15, marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
              Registrera dig som B2B-kund och få tillgång till exklusiva priser.
            </p>
            <Link href="/produkter" style={{ display: 'inline-block', background: '#E8B84B', color: '#0F1115', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Se alla produkter
            </Link>
          </div>

        </div>
      </div>
    </PublicShell>
  )
}
