'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PublicShell, useLoginModal, usePublicCart } from '@/components/layout/PublicShell'
import { fmt } from '@/lib/utils'
import { Search, Package, ShoppingCart, ChevronRight, Star, SlidersHorizontal, X, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const DISCOUNT: Record<string, number> = { A: 0.40, B: 0.30, C: 0.20, Standard: 0 }
const SORT_OPTIONS = ['Popularast', 'Lägsta pris', 'Högsta pris', 'Namn A–Ö']

const PAGE_SIZE = 8

function ProductsContent() {
  const openLogin = useLoginModal()
  const cart = usePublicCart()
  const [products, setProducts]   = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [authUser, setAuthUser]   = useState<any>(null)
  const [customer, setCustomer]   = useState<any>(null)
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [sort, setSort]           = useState('Popularast')
  const [page, setPage]           = useState(1)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        sb.from('customers').select('*').eq('auth_user_id', session.user.id).single()
          .then(({ data }) => setCustomer(data))
      }
    })
    Promise.all([
      sb.from('products').select('*').order('name'),
      sb.from('categories').select('*').order('name'),
    ]).then(([{ data: p }, { data: c }]) => {
      setProducts(p || [])
      setCategories(c || [])
      setLoading(false)
    })
  }, [])

  const priceList = customer?.price_list_id || 'Standard'
  const discount  = DISCOUNT[priceList] ?? 0

  function custPrice(listPrice: number) {
    return Math.round(listPrice * (1 - discount))
  }

  // Filter
  let filtered = products.filter(p => {
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // Sort
  if (sort === 'Lägsta pris') filtered = [...filtered].sort((a, b) => a.list_price - b.list_price)
  else if (sort === 'Högsta pris') filtered = [...filtered].sort((a, b) => b.list_price - a.list_price)
  else if (sort === 'Namn A–Ö') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function addToCart(p: any) {
    cart.addItem({ id: p.id, name: p.name, brand: p.brand, list_price: p.list_price, image_url: p.image_url, unit: p.unit }, priceList)
    setJustAdded(p.id)
    setTimeout(() => setJustAdded(null), 1600)
  }

  function selectCat(id: string) {
    setSelectedCat(id)
    setPage(1)
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <style>{`
        .prod-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; }
        @media (max-width:1100px) { .prod-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width:720px)  { .prod-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width:480px)  { .prod-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden', marginTop: 64 }}>
        <img
          src="https://proluxshine.com/wp-content/uploads/2025/11/a7ffd562-5a98-4bc9-86a4-9af4db4d2282.webp"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,.72) 0%, rgba(0,0,0,.4) 60%, rgba(0,0,0,.15) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 48px' }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-.01em' }}>
            Alla Produkter
          </h1>
          <p style={{ color: 'rgba(255,255,255,.78)', fontSize: 15, maxWidth: 520, margin: 0, lineHeight: 1.6 }}>
            Professionella bilvårdsprodukter från Frescura, Virtus och Prolux Shine. Allt du behöver för exteriör, interiör och polering.
          </p>
        </div>
      </div>

      {/* ── BREADCRUMB ── */}
      <div style={{ borderBottom: '1px solid #e8e8e8', padding: '12px 48px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Hem</Link>
        <ChevronRight size={12} color="#ccc" />
        <Link href="/produkter" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>Produkter</Link>
        <ChevronRight size={12} color="#ccc" />
        <span style={{ color: '#111', fontSize: 13, fontWeight: 600 }}>
          {selectedCat === 'all' ? 'Alla Produkter' : categories.find(c => c.id === selectedCat)?.name || 'Alla'}
        </span>
      </div>

      {/* ── CATEGORY ICONS ── */}
      <div style={{ borderBottom: '1px solid #e8e8e8', padding: '20px 48px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 20, minWidth: 'max-content' }}>
          {/* "Alla"-knapp med ProLux-logo */}
          <button
            onClick={() => selectCat('all')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', minWidth: 72 }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: selectedCat === 'all' ? '#E8B84B' : '#f4f4f4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: selectedCat === 'all' ? '2px solid #E8B84B' : '2px solid #e8e8e8',
              transition: 'all .2s', overflow: 'hidden',
            }}>
              <span style={{ fontSize: 28 }}>🏪</span>
            </div>
            <span style={{ fontSize: 11, color: selectedCat === 'all' ? '#111' : '#666', fontWeight: selectedCat === 'all' ? 700 : 400, textAlign: 'center', lineHeight: 1.3 }}>Alla</span>
          </button>

          {/* En knapp per unik kategori med produktbild */}
          {categories.map(cat => {
            const catProduct = products.find(p => p.category_id === cat.id && p.image_url)
            const isActive = selectedCat === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => selectCat(cat.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', minWidth: 72 }}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: isActive ? '#E8B84B' : '#f4f4f4',
                  border: isActive ? '2px solid #E8B84B' : '2px solid #e8e8e8',
                  transition: 'all .2s', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: catProduct?.image_url ? 8 : 0,
                }}>
                  {catProduct?.image_url ? (
                    <img
                      src={catProduct.image_url}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Package size={28} color={isActive ? '#111' : '#bbb'} strokeWidth={1.5} />
                  )}
                </div>
                <span style={{ fontSize: 11, color: isActive ? '#111' : '#666', fontWeight: isActive ? 700 : 400, textAlign: 'center', lineHeight: 1.3, maxWidth: 80 }}>
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── TOOLBAR: count + search + sort ── */}
      <div style={{ padding: '16px 48px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid #e8e8e8' }}>
        <span style={{ fontSize: 14, color: '#555', flexShrink: 0 }}>
          {loading ? '...' : `${filtered.length} produkter`}
        </span>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Sök produkt..."
            style={{ width: '100%', padding: '8px 36px 8px 36px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, color: '#111', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, lineHeight: 1 }}>×</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: '#555' }}>Sortera:</span>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 14, color: '#111', background: '#fff', cursor: 'pointer', outline: 'none' }}>
            {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      {loading ? (
        <div style={{ padding: '80px 48px', textAlign: 'center', color: '#aaa' }}>Laddar produkter...</div>
      ) : paged.length === 0 ? (
        <div style={{ padding: '80px 48px', textAlign: 'center', color: '#aaa' }}>
          <Package size={48} style={{ marginBottom: 16 }} />
          <p>Inga produkter hittades.</p>
        </div>
      ) : (
        <div className="prod-grid" style={{ padding: '0 40px' }}>
          {paged.map((p, i) => {
            const price = custPrice(p.list_price)
            const added = justAdded === p.id
            return (
              <div key={p.id} style={{ border: '1px solid #e8e8e8', borderRadius: 0, background: '#fff', display: 'flex', flexDirection: 'column', margin: '-1px 0 0 -1px' }}>
                <Link href={`/produkter/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ background: '#f8f8f8', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                    ) : (
                      <Package size={64} color="#ddd" strokeWidth={1} />
                    )}
                    {(i === 0 || i === 3) && (
                      <span style={{ position: 'absolute', top: 12, left: 12, background: '#E8B84B', color: '#111', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        Storsäljare
                      </span>
                    )}
                    {i === 2 && (
                      <span style={{ position: 'absolute', top: 12, left: 12, background: '#4CAF7D', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        Nyhet
                      </span>
                    )}
                  </div>
                </Link>
                <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 4px' }}>
                    {p.brand || 'ProLuxShine'}
                  </p>
                  <Link href={`/produkter/${p.id}`} style={{ textDecoration: 'none' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 12px', lineHeight: 1.3 }}>
                      {p.name}
                    </p>
                  </Link>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{fmt(price)} kr</div>
                      {discount > 0 && (
                        <div style={{ fontSize: 11, color: '#aaa', textDecoration: 'line-through' }}>{fmt(p.list_price)} kr</div>
                      )}
                    </div>
                    <button
                      onClick={() => authUser ? addToCart(p) : openLogin()}
                      style={{ width: 38, height: 38, borderRadius: '50%', background: added ? '#4CAF7D' : '#E8B84B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0 }}
                    >
                      <ShoppingCart size={16} color="#111" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '40px 48px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e0e0e0', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? .4 : 1 }}>
            <ChevronLeft size={16} color="#555" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: page === i + 1 ? 'none' : '1px solid #e0e0e0', background: page === i + 1 ? '#E8B84B' : '#fff', color: page === i + 1 ? '#111' : '#555', fontWeight: page === i + 1 ? 700 : 400, fontSize: 14, cursor: 'pointer' }}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e0e0e0', background: '#fff', cursor: page === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? .4 : 1 }}>
            <ChevronRight size={16} color="#555" />
          </button>
        </div>
      )}

      {/* ── B2B PROMPT ── */}
      {!customer && (
        <div style={{ margin: '0 40px 48px', background: '#0D0F13', borderRadius: 12, padding: '36px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <p style={{ color: '#E8B84B', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>B2B-partner</p>
            <h3 style={{ color: '#F0EDE8', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Handla till grossistpris</h3>
            <p style={{ color: '#9BA0AB', fontSize: 14, margin: 0 }}>Registrera dig som företagskund och få upp till 40% rabatt.</p>
          </div>
          <button onClick={openLogin} style={{ padding: '13px 28px', background: '#E8B84B', color: '#0F1115', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Bli B2B-kund
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProdukterPage() {
  return (
    <PublicShell>
      <ProductsContent />
    </PublicShell>
  )
}
