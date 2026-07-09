'use client'
import { ReactNode, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CartProvider, useCart } from '@/hooks/useCart'
import { PriceList } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/utils'
import {
  LayoutDashboard, Tag, ShoppingBag, LogOut,
  Menu, X, Minus, Plus, Trash2, ShoppingCart,
} from 'lucide-react'

const NAV = [
  { href: '/portal/dashboard', label: 'Översikt',    icon: LayoutDashboard },
  { href: '/portal/catalog',   label: 'Produkter',   icon: Tag },
  { href: '/portal/orders',    label: 'Mina ordrar', icon: ShoppingBag },
]

// ── Cart slide-in ────────────────────────────────────────────
function CartPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, updateQty, removeItem, subtotal, vatAmount, total } = useCart()
  const router = useRouter()

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 149 }}
        />
      )}
      <div style={{
        position: 'fixed', top: 'var(--nav-h)', right: 0, bottom: 0, width: 360,
        background: 'var(--bg2)', borderLeft: '1px solid var(--line)',
        zIndex: 150,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .28s cubic-bezier(.22,.68,0,1.08)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>Varukorg</span>
          <button onClick={onClose} style={{ width: 32, height: 32, border: '1px solid var(--line)', borderRadius: 8, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)', paddingTop: 60 }}>
              <ShoppingCart size={40} strokeWidth={1.2} style={{ opacity: .25 }} />
              <span style={{ fontSize: 13 }}>Varukorgen är tom</span>
            </div>
          ) : items.map(item => (
            <div key={item.product.id} style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--bg3)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--bg4)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {item.product.image_url
                  ? <img src={item.product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🧴'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{item.product.sku}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateQty(item.product.id, item.qty - 1)} style={{ width: 26, height: 26, border: '1px solid var(--line)', borderRadius: 6, background: 'transparent', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Minus size={11} /></button>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 22, textAlign: 'center', color: 'var(--text)' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.product.id, item.qty + 1)} style={{ width: 26, height: 26, border: '1px solid var(--line)', borderRadius: 6, background: 'transparent', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={11} /></button>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold)', marginLeft: 'auto' }}>{fmt(item.unitPrice * item.qty)} kr</span>
                  <button onClick={() => removeItem(item.product.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
          {[
            { label: 'Delsumma', val: subtotal },
            { label: 'Moms (25%)', val: vatAmount },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text3)', padding: '3px 0' }}>
              <span>{label}</span><span>{fmt(val)} kr</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--text)', borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 8 }}>
            <span>Totalt inkl. moms</span>
            <span style={{ color: 'var(--gold)', fontSize: 18 }}>{fmt(total)} kr</span>
          </div>
          <button
            onClick={() => { router.push('/portal/checkout'); onClose() }}
            disabled={items.length === 0}
            style={{ width: '100%', padding: 13, background: items.length > 0 ? 'var(--gold)' : 'var(--bg4)', color: items.length > 0 ? '#111' : 'var(--text3)', border: 'none', borderRadius: 9, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, cursor: items.length > 0 ? 'pointer' : 'not-allowed', marginTop: 14, marginBottom: 6, opacity: items.length === 0 ? .5 : 1 }}
          >
            Gå till kassa →
          </button>
          <button onClick={onClose} style={{ width: '100%', padding: 10, background: 'transparent', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text3)', fontFamily: 'var(--font-sans)', fontSize: 12, cursor: 'pointer' }}>
            Fortsätt handla
          </button>
        </div>
      </div>
    </>
  )
}

// ── Inner shell (needs cart context) ─────────────────────────
function InnerShell({ children, email, priceList }: { children: ReactNode; email: string; priceList: string }) {
  const pathname   = usePathname()
  const supabase   = createClient()
  const { itemCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Topbar ───────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 'var(--nav-h)',
        background: 'rgba(8,10,14,.9)',
        backdropFilter: 'saturate(180%) blur(24px)',
        WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        borderBottom: '1px solid var(--line)',
        boxShadow: '0 1px 0 rgba(255,255,255,.03) inset',
        display: 'flex', alignItems: 'center',
        paddingInline: 20, gap: 12,
      }}>
        <Link href="/portal/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, marginRight: 4 }}>
          <Image src="/logo.svg" alt="Prolux Shine" width={118} height={34} priority style={{ display: 'block' }} />
        </Link>

        {/* Desktop nav pills */}
        <nav className="portal-desktop-nav" style={{ display: 'none', gap: 2, alignItems: 'center', flex: 1 }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 13px', borderRadius: 7,
                background: active ? 'rgba(232,184,75,.09)' : 'transparent',
                color: active ? 'var(--gold)' : 'var(--text3)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                border: `1px solid ${active ? 'var(--line-gold)' : 'transparent'}`,
                transition: 'all .15s',
              }}>
                <Icon size={14} style={{ opacity: active ? 1 : 0.6 }} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side desktop */}
        <div className="portal-desktop-right" style={{ display: 'none', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>
          {/* Pricelist badge */}
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, background: 'rgba(232,184,75,.1)', color: 'var(--gold)', border: '1px solid rgba(232,184,75,.25)' }}>
            Prislista {priceList}
          </span>
          {/* User pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 6px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--line)', borderRadius: 20 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg4), var(--bg5))', border: '1px solid var(--line-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>
              {email.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
          </div>
          {/* Cart button */}
          <button onClick={() => setCartOpen(v => !v)} style={{
            position: 'relative', width: 38, height: 38,
            border: cartOpen ? '1px solid rgba(232,184,75,.4)' : '1px solid var(--line)',
            borderRadius: 9, background: cartOpen ? 'rgba(232,184,75,.08)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: cartOpen ? 'var(--gold)' : 'var(--text2)',
            transition: 'all .15s',
          }}>
            <ShoppingBag size={16} />
            {itemCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: 'var(--gold)', color: '#111', fontSize: 9, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {itemCount}
              </span>
            )}
          </button>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text3)', fontSize: 12, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line-hi)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)' }}>
            <LogOut size={13} /> Logga ut
          </button>
        </div>

        {/* Mobile: cart icon + hamburger */}
        <div className="portal-mobile-btns" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <button onClick={() => setCartOpen(v => !v)} style={{ position: 'relative', padding: 8, background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: 'var(--gold)', color: '#111', fontSize: 9, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {itemCount}
              </span>
            )}
          </button>
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Meny" style={{ padding: 8, background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── Mobile fullscreen menu ───────────────────────── */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0, bottom: 0,
          background: 'rgba(8,10,14,.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 199,
          padding: '20px 16px 32px',
          display: 'flex', flexDirection: 'column', gap: 6,
          animation: 'fadeIn .15s ease',
        }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px', borderRadius: 10,
                background: active ? 'rgba(232,184,75,.08)' : 'rgba(255,255,255,.03)',
                color: active ? 'var(--gold)' : 'var(--text)',
                fontSize: 15, fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                border: `1px solid ${active ? 'var(--line-gold)' : 'var(--line)'}`,
                boxShadow: active ? '0 0 20px rgba(232,184,75,.08)' : 'none',
              }}>
                <Icon size={18} style={{ color: active ? 'var(--gold)' : 'var(--text3)', opacity: active ? 1 : 0.7 }} />
                {label}
              </Link>
            )
          })}
          <div style={{ flex: 1 }} />
          <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{email}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Prislista {priceList}</div>
          </div>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text2)', fontSize: 15, cursor: 'pointer' }}>
            <LogOut size={18} /> Logga ut
          </button>
        </div>
      )}

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />

      <style>{`
        .portal-desktop-nav   { display: none !important; }
        .portal-desktop-right { display: none !important; }
        .portal-mobile-btns   { display: flex !important; }
        @media (min-width: 900px) {
          .portal-desktop-nav   { display: flex !important; }
          .portal-desktop-right { display: flex !important; }
          .portal-mobile-btns   { display: none !important; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Public export ─────────────────────────────────────────────
export function PortalShell({ children, email, priceList }: { children: ReactNode; email: string; priceList: string }) {
  return (
    <CartProvider initialPriceList={priceList as PriceList}>
      <InnerShell email={email} priceList={priceList}>
        {children}
      </InnerShell>
    </CartProvider>
  )
}
