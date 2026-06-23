'use client'
import { ReactNode, useState } from 'react'
import { CartProvider, useCart } from '@/hooks/useCart'
import { PortalSidebar } from './PortalSidebar'
import { Topnav } from './Topnav'
import { PriceList } from '@/types'
import { ShoppingBag, X, Minus, Plus, Trash2 } from 'lucide-react'
import { fmt } from '@/lib/utils'
import { useRouter } from 'next/navigation'

function CartPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, updateQty, removeItem, subtotal, vatAmount, total } = useCart()
  const router = useRouter()

  return (
    <div
      style={{
        position: 'fixed',
        top: '58px',
        right: 0,
        bottom: 0,
        width: '380px',
        background: 'var(--bg2)',
        borderLeft: '1px solid var(--border)',
        zIndex: 80,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .3s cubic-bezier(.22,.68,0,1.1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '20px',
            fontWeight: 500,
            color: 'var(--text)',
          }}
        >
          Varukorg
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text2)',
          }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Items */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: 'var(--text3)',
              padding: '40px 0',
            }}
          >
            <ShoppingBag size={40} style={{ opacity: 0.2 }} />
            <p style={{ fontSize: '13px' }}>Varukorgen är tom</p>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.product.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: 14,
                border: '1px solid rgba(255,255,255,.04)',
                borderRadius: 8,
                background: 'var(--bg3)',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: 'var(--bg2)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {item.product.image_url ? (
                  <img
                    src={item.product.image_url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt=""
                  />
                ) : (
                  '🧴'
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text)',
                    marginBottom: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.product.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: 8 }}>
                  {item.product.sku}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => updateQty(item.product.id, item.qty - 1)}
                    style={{
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
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      fontWeight: 600,
                      minWidth: 22,
                      textAlign: 'center',
                      color: 'var(--text)',
                    }}
                  >
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product.id, item.qty + 1)}
                    style={{
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
                    }}
                  >
                    <Plus size={12} />
                  </button>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: 'var(--gold)',
                      marginLeft: 'auto',
                    }}
                  >
                    {fmt(item.unitPrice * item.qty)} kr
                  </span>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
          background: 'var(--bg2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            color: 'var(--text3)',
            padding: '4px 0',
          }}
        >
          <span>Delsumma</span>
          <span>{fmt(subtotal)} kr</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            color: 'var(--text3)',
            padding: '4px 0',
          }}
        >
          <span>Moms (25%)</span>
          <span>{fmt(vatAmount)} kr</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text)',
            borderTop: '1px solid rgba(255,255,255,.04)',
            paddingTop: 12,
            marginTop: 6,
          }}
        >
          <span>Totalt inkl. moms</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 20,
              color: 'var(--gold)',
              fontWeight: 500,
            }}
          >
            {fmt(total)} kr
          </span>
        </div>
        <button
          onClick={() => {
            router.push('/portal/checkout')
            onClose()
          }}
          disabled={items.length === 0}
          style={{
            width: '100%',
            padding: 14,
            background: 'var(--gold)',
            color: '#111',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 13,
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            marginTop: 14,
            marginBottom: 8,
            opacity: items.length === 0 ? 0.5 : 1,
          }}
        >
          Gå till kassa
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 11,
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text3)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Fortsätt handla
        </button>
      </div>
    </div>
  )
}

function InnerShell({
  children,
  email,
  priceList,
}: {
  children: ReactNode
  email: string
  priceList: string
}) {
  const [cartOpen, setCartOpen] = useState(false)
  const { itemCount } = useCart()

  return (
    <>
      <Topnav
        title="Portal"
        email={email}
        priceList={priceList}
        cartCount={itemCount}
        onCartClick={() => setCartOpen(v => !v)}
      />
      <PortalSidebar email={email} priceList={priceList} />
      <main
        style={{
          position: 'fixed',
          top: '58px',
          left: '248px',
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          background: 'var(--bg)',
        }}
      >
        {children}
      </main>
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            top: '58px',
            background: 'rgba(0,0,0,.4)',
            zIndex: 79,
          }}
        />
      )}
    </>
  )
}

export function PortalShell({
  children,
  email,
  priceList,
}: {
  children: ReactNode
  email: string
  priceList: string
}) {
  return (
    <CartProvider initialPriceList={priceList as PriceList}>
      <InnerShell email={email} priceList={priceList}>
        {children}
      </InnerShell>
    </CartProvider>
  )
}
