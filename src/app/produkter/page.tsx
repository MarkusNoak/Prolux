'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PublicShell, useLoginModal, usePublicCart } from '@/components/layout/PublicShell'
import { fmt } from '@/lib/utils'
import { Search, Package, ShoppingCart, Check } from 'lucide-react'

const supabase = createClient()
const DISCOUNT: Record<string, number> = { A: 0.40, B: 0.30, C: 0.20, Standard: 0 }

function ProductsContent() {
  const openLogin = useLoginModal()
  const cart = usePublicCart()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [authUser, setAuthUser] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [justAdded, setJustAdded] = useState<string | null>(null)

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
    <div style={{ paddingTop: 64, background: '#FAFAF8', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ background: 'linear-gradient(180deg, #FEF9EE 0%, #F5F3EE 100%)', borderBottom: '1px solid rgba(0,0,0,.07)', padding: '52px 24px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#C9971A', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 10 }}>Sortiment</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 400, color: '#111', margin: '0 0 14px', lineHeight: 1.1 }}>
          Våra produkter
        </h1>
        {isLoggedInCustomer && customer ? (
          <p style={{ fontSize: 16, color: '#666', margin: '0 0 10px', maxWidth: 480, marginInline: 'auto', lineHeight: 1.7 }}>
            Dina B2B-priser med prislista <strong style={{ color: '#C9971A' }}>{priceList}</strong> ({Math.round((DISCOUNT[priceList] ?? 0) * 100)}% rabatt)
          </p>
        ) : (
          <p style={{ fontSize: 16, color: '#666', margin: '0 0 28px', maxWidth: 480, marginInline: 'auto', lineHeight: 1.7 }}>
            Premium bilvårdsprodukter för professionella. Logga in för dina B2B-priser.
          </p>
        )}
        {!isLoggedInCustomer && (
          <button onClick={openLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 9, background: '#111', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            <ShoppingCart size={15} /> Logga in för att beställa
          </button>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px' }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
            <input
              placeholder="Sök produkt eller varumärke..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '11px 14px 11px 36px', background: '#fff', border: '1.5px solid rgba(0,0,0,.1)', borderRadius: 9, color: '#111', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          {[{ id: 'all', name: 'Alla' }, ...categories].map(cat => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.id)} style={{
              padding: '7px 16px', borderRadius: 20, border: '1.5px solid',
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              background: selectedCat === cat.id ? '#111' : '#fff',
              borderColor: selectedCat === cat.id ? '#111' : 'rgba(0,0,0,.12)',
              color: selectedCat === cat.id ? '#fff' : '#555',
              fontWeight: selectedCat === cat.id ? 700 : 400,
            }}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ height: 200, background: '#F5F3EE', animation: 'pulse 1.5s ease infinite' }} />
                <div style={{ padding: 20 }}>
                  <div style={{ height: 12, width: '40%', background: '#F5F3EE', borderRadius: 4, marginBottom: 10 }} />
                  <div style={{ height: 16, width: '80%', background: '#F5F3EE', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#bbb' }}>
            <Package size={48} strokeWidth={1} style={{ margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontSize: 16, margin: 0, color: '#999' }}>Inga produkter matchar sökningen</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {filtered.map(p => {
              const unitPrice = isLoggedInCustomer && customer
                ? Math.round(p.list_price * (1 - (DISCOUNT[priceList] ?? 0)))
                : isLoggedInCustomer
                  ? p.list_price
                  : Math.round(p.list_price * 0.6)
              const added = justAdded === p.id
              return (
                <div key={p.id} style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,.06)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all .2s', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#C9971A'; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 8px 24px rgba(201,151,26,.1)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(0,0,0,.06)'; el.style.transform = 'none'; el.style.boxShadow = '0 1px 4px rgba(0,0,0,.04)' }}
                >
                  <div style={{ height: 200, background: '#F9F7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={52} color="#ccc" strokeWidth={1} />}
                  </div>
                  <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 11, color: '#bbb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{p.brand}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111', flex: 1, lineHeight: 1.3, marginBottom: 14 }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#bbb', marginBottom: 2 }}>
                          {isLoggedInCustomer && customer ? `Ditt pris (${priceList})` : isLoggedInCustomer ? 'Pris' : 'B2B-pris från'}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#C9971A' }}>{fmt(unitPrice)} kr</div>
                        <div style={{ fontSize: 10, color: '#ccc' }}>exkl. moms · {p.unit}</div>
                      </div>
                      {isLoggedInCustomer ? (
                        <button onClick={() => handleAddToCart(p)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 8, background: added ? '#4CAF7D' : '#111', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                          {added ? <><Check size={13} /> Lagd</> : <><ShoppingCart size={13} /> Lägg i korg</>}
                        </button>
                      ) : (
                        <button onClick={openLogin} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                          <ShoppingCart size={13} /> Beställ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && !isLoggedInCustomer && (
          <div style={{ marginTop: 48, padding: '28px 36px', background: '#FEF9EE', border: '1.5px solid rgba(201,151,26,.2)', borderRadius: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: '#111', fontWeight: 500, margin: '0 0 6px' }}>Är du B2B-kund?</p>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 18px' }}>Logga in för att se dina avtalspriser och lägga beställningar.</p>
            <button onClick={openLogin} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 9, background: '#111', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Logga in på kundportalen
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .4 } }
      `}</style>
    </div>
  )
}

export default function PublicProductsPage() {
  return <PublicShell><ProductsContent /></PublicShell>
}
