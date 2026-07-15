'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/utils'
import { Search, Package, ShoppingCart } from 'lucide-react'

const supabase = createClient()

const CATEGORIES = ['Alla', 'Tvätt', 'Fälg', 'Vax & Polish', 'Exteriör', 'Interiör', 'Avfettning', 'Tillbehör']

export default function PublicProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id,name,brand,list_price,image_url,unit,category_id,active').eq('active', true).order('sort_order'),
      supabase.from('categories').select('id,name,sort_order').order('sort_order'),
    ]).then(([{ data: p }, { data: c }]) => {
      if (p) setProducts(p)
      if (c) setCategories(c)
      setLoading(false)
    })
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat
    return matchSearch && matchCat
  })

  return (
    <div style={{ paddingTop: 68 }}>
      {/* Page header */}
      <div style={{ background: 'linear-gradient(180deg, rgba(232,184,75,.05) 0%, transparent 100%)', borderBottom: '1px solid var(--line)', padding: '52px 24px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 12 }}>Sortiment</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 16px', lineHeight: 1.1 }}>
          Våra produkter
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text2)', margin: '0 0 32px', maxWidth: 480, marginInline: 'auto' }}>
          Premium bilvårdsprodukter för professionella. Logga in för B2B-priser och beställning.
        </p>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', borderRadius: 9,
          background: 'var(--gold)', color: '#111',
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>
          <ShoppingCart size={15} /> Logga in för att beställa
        </Link>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              placeholder="Sök produkt eller varumärke..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 36px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 9, color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          <button onClick={() => setSelectedCat('all')} style={{ padding: '8px 18px', borderRadius: 20, border: '1px solid', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', background: selectedCat === 'all' ? 'var(--gold)' : 'var(--bg3)', borderColor: selectedCat === 'all' ? 'var(--gold)' : 'var(--line)', color: selectedCat === 'all' ? '#111' : 'var(--text3)', fontWeight: selectedCat === 'all' ? 700 : 400 }}>
            Alla
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.id)} style={{ padding: '8px 18px', borderRadius: 20, border: '1px solid', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', background: selectedCat === cat.id ? 'rgba(232,184,75,.12)' : 'var(--bg3)', borderColor: selectedCat === cat.id ? 'rgba(232,184,75,.4)' : 'var(--line)', color: selectedCat === cat.id ? 'var(--gold)' : 'var(--text3)', fontWeight: selectedCat === cat.id ? 600 : 400 }}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ height: 200, background: 'var(--bg4)', animation: 'pulse 1.5s ease infinite' }} />
                <div style={{ padding: 20 }}>
                  <div style={{ height: 12, width: '40%', background: 'var(--bg4)', borderRadius: 4, marginBottom: 10, animation: 'pulse 1.5s ease infinite' }} />
                  <div style={{ height: 16, width: '80%', background: 'var(--bg4)', borderRadius: 4, animation: 'pulse 1.5s ease infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text3)' }}>
            <Package size={48} strokeWidth={1} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: 16, margin: 0 }}>Inga produkter matchar sökningen</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filtered.map(p => (
              <div key={p.id} style={{
                background: 'var(--bg3)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                transition: 'all .2s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--line-gold)'; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--line)'; el.style.transform = 'none' }}
              >
                {/* Image */}
                <div style={{ height: 200, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={52} color="var(--text3)" strokeWidth={1} />
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{p.brand}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', flex: 1, lineHeight: 1.3, marginBottom: 16 }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>B2B-pris från</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>{fmt(Math.round(p.list_price * 0.6))} kr</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>exkl. moms · {p.unit}</div>
                    </div>
                    <Link href="/login" style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 18px', borderRadius: 8,
                      background: 'var(--gold)', color: '#111',
                      fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      flexShrink: 0,
                    }}>
                      <ShoppingCart size={13} /> Beställ
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Login CTA at bottom */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: 56, padding: '32px 40px', background: 'rgba(232,184,75,.05)', border: '1px solid rgba(232,184,75,.15)', borderRadius: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: 'var(--text)', fontWeight: 500, margin: '0 0 8px' }}>Är du B2B-kund?</p>
            <p style={{ fontSize: 14, color: 'var(--text3)', margin: '0 0 20px' }}>Logga in på din kundportal för att se dina avtalspriser och lägga beställningar.</p>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 9,
              background: 'var(--gold)', color: '#111',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>
              Logga in på kundportalen
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .4 } }
      `}</style>
    </div>
  )
}
