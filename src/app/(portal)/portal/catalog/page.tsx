'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import { fmt, custPrice } from '@/lib/utils'
import { Plus, X, Minus, Search } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  wash: 'Tvätt',
  wheels: 'Fälg & Däck',
  polish: 'Vax & Polish',
  exterior: 'Exteriör',
  interior: 'Interiör',
  degreaser: 'Avfettning',
  accessories: 'Tillbehör',
}

const CAT_ICON: Record<string, string> = {
  wash: '🧴',
  wheels: '⚙️',
  polish: '✨',
  exterior: '🚗',
  interior: '🪑',
  degreaser: '🧪',
  accessories: '📦',
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addItem, priceList } = useCart()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        const prods = (data || []) as Product[]
        setProducts(prods)
        const cats = [...new Set(prods.map(p => p.category_id))]
        setCategories(cats)
        setLoading(false)
      })
  }, [])

  const filtered = products.filter(p => {
    const matchCat = category === 'all' || p.category_id === category
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand?.toLowerCase() || '').includes(q) ||
      (p.description?.toLowerCase() || '').includes(q) ||
      p.sku.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  function openProduct(p: Product) {
    setSelectedProduct(p)
    setQty(1)
  }

  function addToCart() {
    if (selectedProduct) {
      addItem(selectedProduct, qty)
      setSelectedProduct(null)
    }
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    borderRadius: 20,
    fontSize: '12px',
    fontWeight: active ? 600 : 500,
    color: active ? '#111' : 'var(--text3)',
    background: active ? 'var(--gold)' : 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  })

  const btnStyle: React.CSSProperties = {
    width: 26,
    height: 26,
    border: '1px solid var(--border)',
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--text2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '48px 48px 36px', borderBottom: '1px solid var(--border)' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--gold)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            marginBottom: 14,
            display: 'block',
          }}
        >
          Produktkatalog
        </span>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '44px',
            fontWeight: 500,
            color: 'var(--text)',
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Virtus &amp; Frescura{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Sverige</em>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
            background: 'var(--bg2)',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 16,
              color: 'var(--text3)',
            }}
          >
            <Search size={15} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '13px 14px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              outline: 'none',
            }}
            placeholder='Sök — "fälgrengöring", "vax", "förtvätt"…'
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                padding: '0 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setCategory('all')} style={chipStyle(category === 'all')}>
            Alla
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={chipStyle(category === cat)}>
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text3)' }}>
          Laddar produkter…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text3)' }}>
          Inga produkter hittades.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: '1px',
            background: 'rgba(255,255,255,.04)',
            padding: '1px',
            marginTop: 1,
          }}
        >
          {filtered.map((p, i) => {
            const price = custPrice(p.list_price, priceList)
            const isFeature = i === 0
            return (
              <div
                key={p.id}
                onClick={() => openProduct(p)}
                style={{
                  background: 'var(--bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  gridColumn: isFeature ? 'span 2' : 'span 1',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'var(--bg2)',
                    height: isFeature ? 480 : 280,
                  }}
                >
                  {p.badge && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        left: 14,
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 4,
                        zIndex: 2,
                        background: p.badge === 'top' ? 'var(--gold)' : 'rgba(255,255,255,.1)',
                        color: p.badge === 'top' ? '#111' : 'var(--text)',
                      }}
                    >
                      {p.badge === 'top' ? 'Bästsäljare' : 'Nyhet'}
                    </div>
                  )}
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      alt={p.name}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%,-50%)',
                        fontSize: isFeature ? 80 : 64,
                      }}
                    >
                      {CAT_ICON[p.category_id] || '✨'}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: '20px 22px 24px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.1em',
                      marginBottom: 6,
                      display: 'block',
                    }}
                  >
                    {CATEGORY_LABELS[p.category_id] || p.category_id}
                  </span>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: isFeature ? 28 : 20,
                      fontWeight: 500,
                      color: 'var(--text)',
                      marginBottom: 8,
                      lineHeight: 1.2,
                      flex: 1,
                    }}
                  >
                    {p.name}
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text3)',
                      lineHeight: 1.7,
                      marginBottom: 18,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {p.description}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: 'var(--text3)',
                          textTransform: 'uppercase',
                          letterSpacing: '.08em',
                          marginBottom: 4,
                          display: 'block',
                        }}
                      >
                        Ditt pris
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: isFeature ? 32 : 24,
                          fontWeight: 500,
                          color: 'var(--text)',
                        }}
                      >
                        {fmt(price)} kr
                      </span>
                      {price < p.list_price && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text3)',
                            textDecoration: 'line-through',
                            marginLeft: 6,
                          }}
                        >
                          {fmt(p.list_price)} kr
                        </span>
                      )}
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        addItem(p, 1)
                      }}
                      style={{
                        width: 42,
                        height: 42,
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        color: 'var(--text3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Lägg i varukorg"
                    >
                      <Plus size={17} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedProduct(null)
          }}
          style={{
            display: 'flex',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.8)',
            zIndex: 300,
            alignItems: 'flex-end',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 680,
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--bg3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2,
                color: 'var(--text2)',
              }}
            >
              <X size={12} />
            </button>

            <div
              style={{
                height: 340,
                position: 'relative',
                overflow: 'hidden',
                background: 'var(--bg3)',
                borderRadius: '10px 10px 0 0',
              }}
            >
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt={selectedProduct.name}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    fontSize: 96,
                  }}
                >
                  {CAT_ICON[selectedProduct.category_id] || '✨'}
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(to top,rgba(22,25,32,.9),transparent)',
                }}
              />
            </div>

            <div style={{ padding: '28px 32px 24px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                  marginBottom: 8,
                  display: 'block',
                }}
              >
                {selectedProduct.brand}
              </span>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 32,
                  fontWeight: 500,
                  color: 'var(--text)',
                  lineHeight: 1.1,
                  marginBottom: 12,
                }}
              >
                {selectedProduct.name}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text2)',
                  lineHeight: 1.8,
                  marginBottom: 24,
                }}
              >
                {selectedProduct.description}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 14,
                  paddingTop: 20,
                  borderTop: '1px solid rgba(255,255,255,.04)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      marginBottom: 6,
                      display: 'block',
                    }}
                  >
                    Ditt pris
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 40,
                      fontWeight: 500,
                      color: 'var(--gold)',
                      lineHeight: 1,
                    }}
                  >
                    {fmt(custPrice(selectedProduct.list_price, priceList))} kr
                  </span>
                  {custPrice(selectedProduct.list_price, priceList) < selectedProduct.list_price && (
                    <span
                      style={{
                        fontSize: '14px',
                        color: 'var(--text3)',
                        textDecoration: 'line-through',
                        marginLeft: 8,
                      }}
                    >
                      {fmt(selectedProduct.list_price)} kr
                    </span>
                  )}
                </div>

                {/* Qty selector */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{
                      width: 40,
                      height: 40,
                      background: 'var(--bg3)',
                      border: 'none',
                      color: 'var(--text2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <span
                    style={{
                      minWidth: 40,
                      textAlign: 'center',
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    style={{
                      width: 40,
                      height: 40,
                      background: 'var(--bg3)',
                      border: 'none',
                      color: 'var(--text2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  style={{
                    flex: 1,
                    minWidth: 180,
                    padding: 15,
                    background: 'var(--gold)',
                    color: '#111',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '.04em',
                    cursor: 'pointer',
                  }}
                >
                  Lägg i varukorg
                </button>
              </div>

              {/* SKU & unit */}
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  gap: 20,
                  fontSize: '12px',
                  color: 'var(--text3)',
                }}
              >
                <span>SKU: <strong style={{ color: 'var(--text2)' }}>{selectedProduct.sku}</strong></span>
                <span>Enhet: <strong style={{ color: 'var(--text2)' }}>{selectedProduct.unit}</strong></span>
                {selectedProduct.stock_qty !== undefined && (
                  <span>
                    Lager:{' '}
                    <strong
                      style={{
                        color: selectedProduct.stock_qty > 0 ? 'var(--green)' : '#E05252',
                      }}
                    >
                      {selectedProduct.stock_qty > 0
                        ? `${selectedProduct.stock_qty} st`
                        : 'Slut i lager'}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
