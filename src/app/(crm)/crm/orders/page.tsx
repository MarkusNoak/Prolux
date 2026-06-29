'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Customer, CartItem, Order, OrderStatus, ORDER_STATUS_LABEL } from '@/types'
import { custPrice, fmt, formatDate } from '@/lib/utils'
import { Plus, Minus, ShoppingCart, Search, Package, ArrowLeft, ChevronDown, Tag, Truck } from 'lucide-react'

const supabase = createClient()

type View = 'new' | 'confirm' | 'history'

export default function CrmOrdersPage() {
  const [view, setView] = useState<View>('new')
  const [orders, setOrders] = useState<(Order & { customers?: Customer })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [toast, setToast] = useState('')
  const [discount, setDiscount] = useState('')
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [delivery, setDelivery] = useState('Direkt')
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('id,order_nr,status,total,created_at,customers(id,company)').order('created_at', { ascending: false }).limit(50),
      supabase.from('customers').select('id,company,contact_name,price_list_id,city').eq('status', 'active').order('company'),
      supabase.from('products').select('id,sku,name,brand,unit,list_price,stock_qty,active').eq('active', true).order('sort_order')
    ]).then(([o, c, p]) => {
      if (o.data) setOrders(o.data as any)
      if (c.data) setCustomers(c.data as any)
      if (p.data) setProducts(p.data as any)
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

  function getQty(productId: string) {
    return cart.find(i => i.product.id === productId)?.qty || 0
  }

  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discountAmt = discountEnabled && discount ? parseInt(discount) || 0 : 0
  const afterDiscount = Math.max(0, subtotal - discountAmt)
  const vat = Math.round(afterDiscount * 0.25)
  const total = afterDiscount + vat

  async function placeOrder() {
    if (!selectedCustomer || cart.length === 0 || placing) return
    setPlacing(true)
    const { data: order, error } = await supabase.from('orders').insert({
      customer_id: selectedCustomer.id,
      status: 'confirmed' as OrderStatus,
      price_list_id: selectedCustomer.price_list_id,
      delivery_name: selectedCustomer.company,
      delivery_city: selectedCustomer.city,
      subtotal: afterDiscount,
      vat_amount: vat,
      total,
      notes: `Leverans: ${delivery}${discountAmt ? ` | Rabatt: ${discountAmt} kr` : ''}`
    }).select().single()

    if (error || !order) { showToast('Fel vid orderläggning'); setPlacing(false); return }

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
    setCustomerSearch('')
    setProductSearch('')
    setDiscount('')
    setDiscountEnabled(false)
    setDelivery('Direkt')
    setPlacing(false)
    setView('history')
    showToast(`Order #${order.order_nr} skapad!`)
  }

  const filteredCustomers = customers.filter(c =>
    !customerSearch || c.company.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredProducts = products.filter(p =>
    !productSearch ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase())
  )

  // ── HISTORY VIEW ───────────────────────────────────────────
  if (view === 'history') return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Alla ordrar</h1>
        <button onClick={() => setView('new')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={15} /> Ny order
        </button>
      </div>
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Order', 'Datum', 'Kund', 'Summa inkl. moms', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
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
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(76,175,125,.12)', color: 'var(--green)', fontWeight: 700 }}>
                    {ORDER_STATUS_LABEL[o.status] || o.status}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Inga ordrar</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--green)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 999 }}>{toast}</div>
      )}
    </div>
  )

  // ── CONFIRM VIEW ───────────────────────────────────────────
  if (view === 'confirm' && selectedCustomer) return (
    <div style={{ padding: '24px 20px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Bekräfta order</h1>
        <button onClick={() => setView('new')} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
          <ArrowLeft size={15} /> Gå tillbaka och ändra order
        </button>
      </div>

      {/* Customer info card */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>{selectedCustomer.company}</h2>
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 20px' }}>Org.nr: {selectedCustomer.org_nr || '—'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px' }}>
          {[
            { label: 'Kontaktperson', value: selectedCustomer.contact_name },
            { label: 'E-post', value: selectedCustomer.email },
            { label: 'Telefon', value: selectedCustomer.phone || '—' },
            { label: 'Adress', value: selectedCustomer.city || '—' },
            { label: 'Fakturaadress', value: selectedCustomer.city || '—' },
            { label: 'Referens', value: selectedCustomer.contact_name },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: discountEnabled ? 16 : 0 }}>
          <input type="checkbox" checked={discountEnabled} onChange={e => setDiscountEnabled(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--gold)', cursor: 'pointer' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Lägg till rabatt</span>
        </label>
        {discountEnabled && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="number"
                placeholder="Ange belopp"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none' }}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>kr</span>
            </div>
            <button style={{ padding: '11px 20px', background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Lägg till rabatt
            </button>
          </div>
        )}
      </div>

      {/* Delivery */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={15} color="var(--text3)" /> Leverans
        </h3>
        <div style={{ position: 'relative' }}>
          <select value={delivery} onChange={e => setDelivery(e.target.value)}
            style={{ width: '100%', padding: '11px 36px 11px 14px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
            <option>Direkt</option>
            <option>Standard (2-3 dagar)</option>
            <option>Express (nästa dag)</option>
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Order summary */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Kassan</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Produkt', 'Antal', 'À-pris', 'Summa'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', color: 'var(--text3)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cart.map(i => {
              const hasDiscount = i.unitPrice < i.product.list_price
              return (
                <tr key={i.product.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                  <td style={{ padding: '11px 20px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{i.product.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{i.product.brand} · {i.product.unit}</div>
                  </td>
                  <td style={{ padding: '11px 20px', color: 'var(--text2)' }}>{i.qty}</td>
                  <td style={{ padding: '11px 20px' }}>
                    {hasDiscount && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through' }}>{fmt(i.product.list_price)} kr</div>
                    )}
                    <div style={{ color: hasDiscount ? 'var(--green)' : 'var(--text2)', fontWeight: hasDiscount ? 600 : 400 }}>{fmt(i.unitPrice)} kr</div>
                  </td>
                  <td style={{ padding: '11px 20px', fontWeight: 700, color: 'var(--text)' }}>{fmt(i.qty * i.unitPrice)} kr</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {discountAmt > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--green)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={13} /> Rabatt</span>
              <span>-{fmt(discountAmt)} kr</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)' }}>
            <span>Moms (25%)</span><span>{fmt(vat)} kr</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: 'var(--text)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <span>Totalt inkl. moms</span><span style={{ color: 'var(--gold)' }}>{fmt(total)} kr</span>
          </div>
        </div>
      </div>

      <button onClick={placeOrder} disabled={placing}
        style={{ width: '100%', padding: '15px 0', background: placing ? 'var(--bg4)' : 'var(--gold)', border: 'none', borderRadius: 10, color: placing ? 'var(--text3)' : '#111', fontSize: 15, fontWeight: 700, cursor: placing ? 'not-allowed' : 'pointer' }}>
        {placing ? 'Skapar order...' : 'Bekräfta och skapa order'}
      </button>
    </div>
  )

  // ── NEW ORDER VIEW ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 58px)', overflow: 'hidden' }}>

      {/* LEFT: customer + products */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Skapa ny order</h1>
          <button onClick={() => setView('history')} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}>
            Alla ordrar →
          </button>
        </div>

        {/* Customer selector */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>👤</span> Välj kund
            </span>
            <button style={{ padding: '6px 14px', background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#111', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Skapa ny kund
            </button>
          </div>

          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                placeholder="Sök företag..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 30px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {filteredCustomers.slice(0, 8).map(c => (
              <button key={c.id} onClick={() => { setSelectedCustomer(c); setCart([]) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: selectedCustomer?.id === c.id ? 'rgba(232,184,75,.08)' : 'transparent', border: 'none', borderBottom: '1px solid var(--border2)', cursor: 'pointer', transition: 'background .1s' }}>
                <span style={{ fontSize: 13, color: selectedCustomer?.id === c.id ? 'var(--gold)' : 'var(--text)', fontWeight: selectedCustomer?.id === c.id ? 600 : 400 }}>{c.company}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Prislista {c.price_list_id}</span>
              </button>
            ))}
            {filteredCustomers.length === 0 && (
              <p style={{ padding: '16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13, margin: 0 }}>Inga kunder hittades</p>
            )}
          </div>
        </div>

        {/* Product search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            placeholder="Sök produkt..."
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Product list rows */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Laddar produkter...</div>
          ) : filteredProducts.map((p, i) => {
            const pl = selectedCustomer?.price_list_id || 'Standard'
            const price = custPrice(p.list_price, pl)
            const qty = getQty(p.id)
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < filteredProducts.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                {/* Product image */}
                <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg4)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} /> : <Package size={20} color="var(--text3)" />}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.brand} · {p.unit}</div>
                </div>
                {/* Price */}
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right' }}>
                  {fmt(price)} kr
                </div>
                {/* Qty controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => updateQty(p.id, -1)} disabled={qty === 0}
                    style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--bg4)', border: '1px solid var(--border)', color: qty === 0 ? 'var(--text3)' : 'var(--text)', cursor: qty === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus size={13} />
                  </button>
                  <span style={{ width: 26, textAlign: 'center', fontSize: 14, fontWeight: 700, color: qty > 0 ? 'var(--gold)' : 'var(--text3)' }}>{qty}</span>
                  <button onClick={() => addToCart(p)}
                    style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--gold)', border: 'none', color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT: cart sidebar */}
      <div style={{ width: 320, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg2)', flexShrink: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Varukorg</span>
          {selectedCustomer && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{selectedCustomer.company}</span>}
        </div>

        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)' }}>
            <ShoppingCart size={36} strokeWidth={1.2} />
            <span style={{ fontSize: 13 }}>Varukorgen är tom</span>
          </div>
        ) : (
          <>
            {/* Cart items table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 0, borderBottom: '1px solid var(--border)' }}>
                {['Produkt', '', 'Antal', 'À-pris', 'Summa'].slice(0, 4).map((h, i) => (
                  <div key={i} style={{ padding: '8px 12px 8px', fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: i === 0 ? 'block' : i === 3 ? 'block' : 'none' }}>{h}</div>
                ))}
              </div>
              {/* Simplified: just a proper table header */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Produkt</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', color: 'var(--text3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Antal</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', color: 'var(--text3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>À-pris</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(i => {
                    const hasDiscount = i.unitPrice < i.product.list_price
                    return (
                    <tr key={i.product.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12, lineHeight: 1.3 }}>{i.product.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{i.product.brand} · {i.product.unit}</div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text2)' }}>{i.qty}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        {hasDiscount && <div style={{ fontSize: 10, color: 'var(--text3)', textDecoration: 'line-through' }}>{fmt(i.product.list_price)} kr</div>}
                        <div style={{ color: hasDiscount ? 'var(--green)' : 'var(--text2)', fontWeight: hasDiscount ? 600 : 400 }}>{fmt(i.unitPrice)} kr</div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{fmt(i.qty * i.unitPrice)} kr</td>
                    </tr>
                  )})}

                </tbody>
              </table>
            </div>

            {/* Totals + CTA */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                <span>Summa (ex. moms)</span>
                <span>{fmt(subtotal)} kr</span>
              </div>
              {!selectedCustomer && (
                <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginBottom: 10 }}>Välj en kund för att fortsätta</p>
              )}
              <button
                onClick={() => { if (selectedCustomer && cart.length > 0) setView('confirm') }}
                disabled={!selectedCustomer || cart.length === 0}
                style={{ width: '100%', padding: '13px 0', background: selectedCustomer && cart.length > 0 ? 'var(--gold)' : 'var(--bg4)', border: 'none', borderRadius: 9, color: selectedCustomer && cart.length > 0 ? '#111' : 'var(--text3)', fontSize: 14, fontWeight: 700, cursor: selectedCustomer && cart.length > 0 ? 'pointer' : 'not-allowed' }}>
                Skapa order
              </button>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--green)', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 999 }}>{toast}</div>
      )}
    </div>
  )
}
