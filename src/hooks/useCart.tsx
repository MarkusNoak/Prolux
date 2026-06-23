import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CartItem, Product, PriceList } from '@/types'
import { custPrice } from '@/lib/utils'

interface CartContextType {
  items: CartItem[]
  priceList: PriceList
  setPriceList: (pl: PriceList) => void
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  subtotal: number
  total: number
  vatAmount: number
  itemCount: number
  discount: number
  campaignDiscount: number
  campaignCode: string
  applyCampaign: (discount: number, code: string) => void
  clearCampaign: () => void
}

export const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({
  children,
  initialPriceList = 'B',
}: {
  children: ReactNode
  initialPriceList?: PriceList
}) {
  const [items, setItems] = useState<CartItem[]>([])
  const [priceList, setPriceList] = useState<PriceList>(initialPriceList)
  const [campaignDiscount, setCampaignDiscount] = useState(0)
  const [campaignCode, setCampaignCode] = useState('')

  const addItem = useCallback(
    (product: Product, qty = 1) => {
      const unitPrice = custPrice(product.list_price, priceList)
      setItems(prev => {
        const existing = prev.find(i => i.product.id === product.id)
        if (existing)
          return prev.map(i =>
            i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
          )
        return [...prev, { product, qty, unitPrice }]
      })
    },
    [priceList]
  )

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }, [])

  const updateQty = useCallback(
    (productId: string, qty: number) => {
      if (qty <= 0) {
        removeItem(productId)
        return
      }
      setItems(prev =>
        prev.map(i => (i.product.id === productId ? { ...i, qty } : i))
      )
    },
    [removeItem]
  )

  const clearCart = useCallback(() => setItems([]), [])

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
  const discount = items.reduce(
    (sum, i) => sum + (i.product.list_price - i.unitPrice) * i.qty,
    0
  )
  const subtotalAfterCampaign = Math.max(0, subtotal - campaignDiscount)
  const vatAmount = Math.round(subtotalAfterCampaign * 0.25)
  const total = subtotalAfterCampaign + vatAmount
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0)

  const applyCampaign = useCallback((disc: number, code: string) => {
    setCampaignDiscount(disc)
    setCampaignCode(code)
  }, [])

  const clearCampaign = useCallback(() => {
    setCampaignDiscount(0)
    setCampaignCode('')
  }, [])

  return (
    <CartContext.Provider
      value={{
        items,
        priceList,
        setPriceList,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        subtotal,
        total,
        vatAmount,
        itemCount,
        discount,
        campaignDiscount,
        campaignCode,
        applyCampaign,
        clearCampaign,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
