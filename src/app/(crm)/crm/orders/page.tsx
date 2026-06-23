'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Customer, CartItem, Order, OrderStatus, ORDER_STATUS_LABEL } from '@/types'
import { custPrice, fmt, formatDate } from '@/lib/utils'
import { Plus, Minus, ShoppingCart, Search, Package } from 'lucide-react'

const supabase = createClient()

export default function CrmOrdersPage() {
  const [tab, setTab] = useState<'new' | 'history'>('history')
  const [orders, setOrders] = useState<(Order & { customers?: Customer })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('*,customers(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('customers').select('*').eq('status', 'active').order('company'),
      supabase.from('products').select('*').eq('active', true).order('sort_order')
    ]).then(([o, c, p]) => {
      if (o.data) setOrders(o.data)
      if (c.data) setCustomers(c.data)
      if (p.data) setProducts(p.data)
      setLoading(false)
    })
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function addToCart(p: Product) {
    const pl = selectedCustomer?.price_list_id || 'Standard'
    const unitPrice = custPrice(p.list_price, pl)
    setCart(items => {
      const existing = items.find(i => i.product.id === p.id)
      if (existing) return items.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...items, { product: p, qty: 1, unitPrice }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart(items => items.map(i => i.product.id === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0))
  }

  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const vat = Math.round(subtotal * 0.25)
  const total = subtotal + vat

  async function placeOrder() {
    if (!selectedCustomer || cart.length === 0) return
    const { data: order, error } = await supabase.from('orders').insert({
      customer_id: selectedCustomer.id,
      status: 'confirmed' as OrderStatus,
      price_list_id: selectedCustomer.price_list_id,
      delivery_name: selectedCustomer.company,
      delivery_city: selectedCustomer.city,
      subtotal, vat_amount: vat, total, notes: 'Skapad av Bashar via CRM'
    }).select().single()
    if (error || !order) { showToast('Fel vid orderläggning'); return }

    await supabase.from('order_items').insert(cart.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name: i.product.name,
      product_sku: i.product.sku,
      qty: i.qty,
      unit_price: i.unitPrice,
      list_price: i.product.list_price,
      total_price: i.qty * i.unitPrice
    })))

    setOrders(os => [{ ...order, customers: selectedCustomer }, ...os])
    setCart([])
    setSelectedCustomer(null)
    setTab('history')
    showToast(`Order #${order.order_nr} skapad!`)
  }

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 58px)' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 24px', background: 'var(--bg2)', flexShrink: 0 }}>
        {[{ key: 'history', label: 'Orderhistorik' }, { key: 'new', label: '+ Ny order' }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as any)} style={{ padding: '14px 20px', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid var(--gold)' : '2px solid transparent', color: tab === key ? 'var(--gold)' : 'var(--text2)', fontSize: 13, fontWeight: tab === key ? 600 : 400, cursor: 'pointer', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {tab === 'history' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Datum', 'Kund', 'Summa inkl. moms', 'Status'].map(h => (
                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Laddar...</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>#{o.order_nr}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>{formatDate(o.created_at)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 500 }}>{o.customers?.company || '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--gold)', fontWeight: 700 }}>{fmt(o.total)} kr</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(76,175,125,.12)', color: 'var(--green)', fontWeight: 700 }}>{ORDER_STATUS_LABEL[o.status] || o.status}</span></td>
                  </tr>
                ))}
                {!loading && orders.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Inga ordrar</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Product catalog */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                  <input placeholder="Sök produkt..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 12px 9px 34px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <select value={selectedCustomer?.id || ''} onChange={e => { const c = customers.find(c => c.id === e.target.value); setSelectedCustomer(c || null); setCart([]) }} style={{ padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', minWidth: 200 }}>
                  <option value="">Välj kund (prislista)...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company} (PL {c.price_list_id})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {filtered.map(p => {
                const pl = selectedCustomer?.price_list_id || 'Standard'
                const price = custPrice(p.list_price, pl)
                const inCart = cart.find(i => i.product.id === p.id)
                return (
                  <div key={p.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ width: '100%', height: 100, background: 'var(--bg4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 }}>
                      {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} /> : <Package size={32} color="var(--text3)" />}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.brand} · {p.sku}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>{fmt(price)} kr<span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>/{p.unit}</span></div>
                    {inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => updateQty(p.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                        <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{inCart.qty}</span>
                        <button onClick={() => updateQty(p.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--gold)', border: 'none', color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(p)} style={{ padding: '8px 0', background: 'rgba(232,184,75,.1)', border: '1px solid rgba(232,184,75,.25)', borderRadius: 8, color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Lägg till</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cart sidebar */}
          <div style={{ width: 320, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg2)' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={16} color="var(--gold)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Order</span>
              {cart.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{cart.reduce((s,i)=>s+i.qty,0)} produkter</span>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 0', fontSize: 13 }}>Lägg till produkter</div>
              ) : cart.map(i => (
                <div key={i.product.id} style={{ marginBottom: 12, background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{i.product.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQty(i.product.id, -1)} style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10} /></button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', width: 24, textAlign: 'center' }}>{i.qty}</span>
                    <button onClick={() => updateQty(i.product.id, 1)} style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg4)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={10} /></button>
                    <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{fmt(i.qty * i.unitPrice)} kr</span>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text2)' }}>
                  <span>Delsumma</span><span>{fmt(subtotal)} kr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: 'var(--text2)' }}>
                  <span>Moms (25%)</span><span>{fmt(vat)} kr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  <span>Totalt</span><span style={{ color: 'var(--gold)' }}>{fmt(total)} kr</span>
                </div>
                {!selectedCustomer && <p style={{ fontSize: 11, color: 'var(--red)', textAlign: 'center', marginBottom: 8 }}>Välj en kund</p>}
                <button onClick={placeOrder} disabled={!selectedCustomer} style={{ width: '100%', padding: '12px 0', background: selectedCustomer ? 'var(--gold)' : 'var(--bg4)', border: 'none', borderRadius: 8, color: selectedCustomer ? '#111' : 'var(--text3)', fontSize: 13, fontWeight: 700, cursor: selectedCustomer ? 'pointer' : 'not-allowed' }}>Lägg order</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '12px 20px', fontSize: 13, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
          {toast}
        </div>
      )}
    </div>
  )
}
