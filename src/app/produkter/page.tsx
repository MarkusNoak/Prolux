'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PublicShell, useLoginModal, usePublicCart } from '@/components/layout/PublicShell'
import { fmt } from '@/lib/utils'
import { Search, Package, ShoppingCart, Check, SlidersHorizontal, X, ChevronRight } from 'lucide-react'

const supabase = createClient()
const DISCOUNT: Record<string, number> = { A: 0.40, B: 0.30, C: 0.20, Standard: 0 }
const BADGES: Record<number, string> = { 0: 'Storsäljare', 2: 'Nyhet', 4: 'Nyhet', 6: 'Storsäljare' }

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
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        sb.from('customers').select('*').eq('auth_user_id', session.user.id).single()
          .then(({ data }) => { if (data) setCustomer(data) })
      }
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('customers').select('*').eq('auth_user_id', session.user.id).single()
          .then(({ data }) => { if (data) setCustomer(data) })
      } else setCustomer(null)
    })
    Promise.all([
      supabase.from('products').select('id,name,brand,list_price,image_url,unit,category_id,active').eq('active', true).order('sort_order'),
      supabase.from('categories').select('id,name,sort_order').order('sort_order'),
    ]).then(([{ data: p }, { data: c }]) => {
      if (p) setProducts(p)
      if (c) setCategories(c)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  function handleAddToCart(p: any) {
    const pl = customer?.price_list_id || 'Standard'
    cart.addItem(p, pl)
    setJustAdded(p.id)
    setTimeout(() => setJustAdded(null), 1500)
  }

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat
    return matchSearch && matchCat
  })

  const priceList = customer?.price_list_id || 'Standard'
  const isLoggedInCustomer = authUser && authUser.user_metadata?.role !== 'admin' && authUser.user_metadata?.role !== 'crm'

  return (
    <div style={{ paddingTop: 64, background: '#fff', minHeight: '100vh' }}>

      {/* ── Page header ── */}
      <div style={{ background: '#F8F5F0', borderBottom: '1px solid rgba(0,0,0,.07)', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#999', marginBottom: 14 }}>
            <span style={{ cursor: 'pointer', color: '#555' }} onClick={() => window.location.href = '/'}>Hem</span>
            <ChevronRight size={12} />
            <span>Produkter</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#111', letterSpacing: '-.02em' }}>
                Alla produkter
              </h1>
              {isLoggedInCustomer && customer && (
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888' }}>
                  Dina priser med prislista <strong style={{ color: '#C9971A' }}>{priceList}</strong> — {Math.round((DISCOUNT[priceList] ?? 0) * 100)}% rabatt
                </p>
              )}
            </div>
            {!isLoggedInCustomer && (
              <button onClick={openLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 7, background: '#C9971A', color: '#111', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0 }}>
                <ShoppingCart size={14} /> Logga in för att beställa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main layout: sidebar + grid ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32, alignItems: 'start' }} className="products-layout">

        {/* ── Sidebar ── */}
        <aside className="products-sidebar" style={{ position: 'sticky', top: 80 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>Kategorier</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[{ id: 'all', name: 'Alla produkter' }, ...categories].map(cat => {
              const count = cat.id === 'all' ? products.length : products.filter(p => p.category_id === cat.id).length
              return (
                <button key={cat.id} onClick={() => setSelectedCat(cat.id)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 7, border: 'none', textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: selectedCat === cat.id ? 700 : 400,
                  background: selectedCat === cat.id ? '#111' : 'transparent',
                  color: selectedCat === cat.id ? '#fff' : '#444',
                  transition: 'all .12s',
                }}>
                  <span>{cat.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.55 }}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* Varumärken */}
          <div style={{ fontSize: 11, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14, marginTop: 28 }}>Varumärken</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Virtus', 'Frescura'].map(brand => (
              <label key={brand} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#444', cursor: 'pointer' }}>
                <input type="checkbox" onChange={e => {
                  if (e.target.checked) setSearch(brand)
                  else if (search === brand) setSearch('')
                }} checked={search === brand} style={{ accentColor: '#C9971A' }} />
                {brand}
              </label>
            ))}
          </div>

          {isLoggedInCustomer && customer && (
            <div style={{ marginTop: 28, padding: '14px 16px', background: '#FEF9EE', border: '1px solid rgba(201,151,26,.2)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Din prislista</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>Nivå {priceList}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{Math.round((DISCOUNT[priceList] ?? 0) * 100)}% rabatt</div>
            </div>
          )}
        </aside>

        {/* ── Right side ── */}
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                placeholder="Sök produkt eller varumärke..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 36px', background: '#fff', border: '1.5px solid #e5e5e5', borderRadius: 8, color: '#111', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 2 }}>
                  <X size={13} />
                </button>
              )}
            </div>
            {/* Mobile filter toggle */}
            <button onClick={() => setFilterOpen(o => !o)} className="filter-btn" style={{ display: 'none', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <SlidersHorizontal size={14} /> Filter
            </button>
            <div style={{ fontSize: 13, color: '#999', flexShrink: 0 }}>
              {loading ? '…' : `${filtered.length} produkter`}
            </div>
          </div>

          {/* Mobile category strip */}
          <div className="mobile-cats" style={{ display: 'none', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {[{ id: 'all', name: 'Alla' }, ...categories].map(cat => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id)} style={{
                padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                background: selectedCat === cat.id ? '#111' : '#fff',
                borderColor: selectedCat === cat.id ? '#111' : '#e5e5e5',
                color: selectedCat === cat.id ? '#fff' : '#555',
                fontWeight: selectedCat === cat.id ? 700 : 400,
              }}>{cat.name}</button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: 200, background: '#F5F3EE', animation: 'pulse 1.5s ease infinite' }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ height: 10, width: '40%', background: '#F5F3EE', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 14, width: '80%', background: '#F5F3EE', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#ccc' }}>
              <Package size={48} strokeWidth={1} style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: 15, margin: 0, color: '#999' }}>Inga produkter matchar sökningen</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: 16 }}>
              {filtered.map((p, i) => {
                const unitPrice = isLoggedInCustomer && customer
                  ? Math.round(p.list_price * (1 - (DISCOUNT[priceList] ?? 0)))
                  : Math.round(p.list_price * 0.6)
                const added = justAdded === p.id
                const badge = BADGES[i % 8]
                return (
                  <div key={p.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow .2s, border-color .2s', position: 'relative', cursor: 'pointer' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 8px 28px rgba(0,0,0,.09)'; el.style.borderColor = '#C9971A' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.borderColor = '#eee' }}
                  >
                    {badge && (
                      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: badge === 'Nyhet' ? '#111' : '#C9971A', color: badge === 'Nyhet' ? '#fff' : '#111', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, letterSpacing: '.07em', textTransform: 'uppercase' }}>
                        {badge}
                      </div>
                    )}
                    <div style={{ height: 200, background: '#F5F2ED', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 16 }}>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        : <Package size={52} color="#ddd" strokeWidth={1} />
                      }
                    </div>
                    <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>{p.brand}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', flex: 1, lineHeight: 1.35, marginBottom: 12 }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{fmt(unitPrice)} kr</div>
                          <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>
                            {isLoggedInCustomer && customer ? `${p.unit} · prislista ${priceList}` : 'exkl. moms'}
                          </div>
                        </div>
                        {isLoggedInCustomer ? (
                          <button onClick={() => handleAddToCart(p)}
                            style={{ width: 36, height: 36, borderRadius: '50%', background: added ? '#4CAF7D' : '#C9971A', color: '#111', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                            {added ? <Check size={15} color="#fff" /> : <ShoppingCart size={14} />}
                          </button>
                        ) : (
                          <button onClick={openLogin}
                            style={{ width: 36, height: 36, borderRadius: '50%', background: '#C9971A', color: '#111', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShoppingCart size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* B2B prompt */}
          {!loading && filtered.length > 0 && !isLoggedInCustomer && (
            <div style={{ marginTop: 40, padding: '24px 28px', background: '#0D0F13', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F0EDE8', marginBottom: 4 }}>Är du B2B-kund?</div>
                <div style={{ fontSize: 13, color: 'rgba(240,237,232,.5)' }}>Logga in för att se dina avtalspriser och lägga beställningar.</div>
              </div>
              <button onClick={openLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 7, background: '#C9971A', color: '#111', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0 }}>
                Logga in på kundportalen
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .products-layout  { grid-template-columns: 220px 1fr; }
        .products-sidebar { display: block; }
        .mobile-cats      { display: none; }
        .filter-btn       { display: none; }
        @media (max-width: 720px) {
          .products-layout  { grid-template-columns: 1fr !important; }
          .products-sidebar { display: none !important; }
          .mobile-cats      { display: flex !important; }
          .filter-btn       { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

export default function PublicProductsPage() {
  return <PublicShell><ProductsContent /></PublicShell>
}
