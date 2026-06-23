import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DISCOUNT, PriceList } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(amount: number): string {
  return Math.round(amount).toLocaleString('sv-SE')
}

export function custPrice(listPrice: number, priceList: PriceList): number {
  return Math.round(listPrice * (1 - DISCOUNT[priceList]))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}
