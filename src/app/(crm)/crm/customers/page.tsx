'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Customer, Order, OrderItem, Activity, PRICE_LIST_LABEL } from '@/types'
import { fmt, formatDate, custPrice } from '@/lib/utils'
import {
  Plus, Mail, FileText, Bell, Calendar,
  TrendingUp, ShoppingBag, Package, Star, ChevronRight,
  Search, BarChart2, X, Trash2
} from 'lucide-react'
import Link from 'next/link'

const supabase = createClient()

// ── PRODUCT AFFINITY MAP ────────────────────────────────────
// Maps product name keywords → complementary product keywords
const AFFINITY: Record<string, string[]> = {
  'rapidet':   ['magic', 'gommalux', 'green power'],
  'magic':     ['rapidet', 'carnauba', 'keramisk'],
  'gommalux':  ['rapidet', 'magic'],
  'carnauba':  ['keramisk', 'magic', 'polish'],
  'keramisk':  ['carnauba', 'polish', 'magic'],
  'green':     ['magic', 'rapidet'],
  'polish':    ['carnauba', 'keramisk'],
}

function getRecommendations(topProducts: string[], allProductNames: string[]): string[] {
  const recs = new Set<string>()
  for (const bought of topProducts) {
    const key = Object.keys(AFFINITY).find(k => bought.toLowerCase().includes(k))
    if (key) {
      for (const rec of AFFINITY[key]) {
        const match = allProductNames.find(n => n.toLowerCase().includes(rec) && !topProducts.includes(n))
        if (match) recs.add(match)
      }
    }
  }
  return Array.from(recs).slice(0, 4)
}

type Tab = 'overview' | 'orders' | 'stats' | 'notes'
type ReminderPriority = 'low' | 'normal' | 'high'

interface Reminder {
  id: string
  customer_id: string
  title: string
  due_date: string
  priority: ReminderPriority
  status: 'upcoming' | 'done'
  created_at: string
}

const PRIORITY_COLOR: Record<ReminderPriority, string> = {
  low: 'var(--text3)',
  normal: 'var(--blue)',
  high: 'var(--red)',
}
const PRIORITY_LABEL: Record<ReminderPriority, string> = {
  low: 'Låg', normal: 'Normal', high: 'Hög'
}

const activityColor: Record<string, string> = {
  note: 'var(--text3)', call: 'var(--green)', email: 'var(--blue)', meeting: 'var(--gold)', order: 'var(--gold)'
}

export default function CrmCustomersPage() {
  const [customers, setCustomers]     = useState<Customer[]>([])
  const [selected, setSelected]       = useState<Customer | null>(null)
  const [orders, setOrders]           = useState<Order[]>([])
  const [orderItems, setOrderItems]   = useState<OrderItem[]>([])
  const [activities, setActivities]   = useState<Activity[]>([])
  const [allProductNames, setAllProductNames] = useState<string[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [tab, setTab]                 = useState<Tab>('overview')
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [isMobile, setIsMobile]       = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  const [noteText, setNoteText]       = useState('')
  const [noteType, setNoteType]       = useState<'note'|'call'|'email'|'meeting'>('note')
  const [toast, setToast]             = useState('')
  const [reminders, setReminders]     = useState<Reminder[]>([])
  const [allReminders, setAllReminders] = useState<Reminder[]>([])
  const [reminderText, setReminderText] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderPriority, setReminderPriority] = useState<ReminderPriority>('normal')
  // New customer modal
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({ company: '', contact_name: '', email: '', phone: '', city: '', org_nr: '', price_list_id: 'Standard' as string })
  const [savingCustomer, setSavingCustomer] = useState(false)

  // Prefetch cache: customer id → data
  const prefetchCache = useRef<Map<string, { orders: any[]; activities: any[]; reminders: any[] }>>(new Map())

  useEffect(() => {
    Promise.all([
      supabase.from('customers').select('id,company,contact_name,email,phone,city,org_nr,price_list_id,status,notes,last_order_at,created_at').order('company'),
      supabase.from('products').select('id,name').eq('active', true),
      supabase.from('reminders').select('id,customer_id,due_date,status').eq('status', 'upcoming'),
    ]).then(([{ data: c }, { data: p }, { data: r }]) => {
      if (c) setCustomers(c as Customer[])
      if (p) setAllProductNames(p.map((x: any) => x.name))
      if (r) setAllReminders(r as any[])
      setLoading(false)
    })
  }, [])

  async function prefetchCustomer(c: Customer) {
    if (prefetchCache.current.has(c.id)) return
    const [{ data: o }, { data: a }, { data: r }] = await Promise.all([
      supabase.from('orders').select('id,order_nr,status,total,subtotal,vat_amount,created_at,order_items(id,product_name,product_sku,qty,unit_price,list_price,total_price)').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('activities').select('id,type,title,body,created_by,created_at').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('reminders').select('*').eq('customer_id', c.id).order('due_date', { ascending: true }),
    ])
    prefetchCache.current.set(c.id, { orders: o || [], activities: a || [], reminders: r || [] })
  }

  async function selectCustomer(c: Customer) {
    setSelected(c)
    setTab('overview')
    if (window.innerWidth < 768) setMobileShowDetail(true)

    // Use prefetch cache if available — instant load
    const cached = prefetchCache.current.get(c.id)
    if (cached) {
      setOrders(cached.orders)
      setOrderItems(cached.orders.flatMap((o: any) => o.order_items || []))
      setActivities(cached.activities)
      setReminders(cached.reminders)
      return
    }

    const [{ data: o }, { data: a }, { data: r }] = await Promise.all([
      supabase.from('orders').select('id,order_nr,status,total,subtotal,vat_amount,created_at,order_items(id,product_name,product_sku,qty,unit_price,list_price,total_price)').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('activities').select('id,type,title,body,created_by,created_at').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('reminders').select('*').eq('customer_id', c.id).order('due_date', { ascending: true }),
    ])
    if (o) {
      setOrders(o as any)
      setOrderItems(o.flatMap((order: any) => order.order_items || []))
    }
    if (a) setActivities(a as any)
    if (r) setReminders(r)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function addActivity() {
    if (!selected || !noteText.trim()) return
    const titles = { note: 'Anteckning', call: 'Samtal', email: 'E-post', meeting: 'Möte' }
    const { data, error } = await supabase.from('activities').insert({
      customer_id: selected.id, type: noteType,
      title: titles[noteType], body: noteText, created_by: 'Bashar'
    }).select().single()
    if (!error && data) {
      setActivities(as => [data, ...as])
      setNoteText('')
      showToast('Sparad')
    }
  }

  async function deleteActivity(id: string) {
    await supabase.from('activities').delete().eq('id', id)
    setActivities(as => as.filter(a => a.id !== id))
  }

  async function addReminder() {
    if (!selected || !reminderText.trim() || !reminderDate) return
    const { data, error } = await supabase.from('reminders').insert({
      customer_id: selected.id,
      title: reminderText,
      due_date: reminderDate,
      priority: reminderPriority,
      status: 'upcoming',
      created_by: 'Bashar',
    }).select().single()
    if (!error && data) {
      setReminders(rs => [data, ...rs].sort((a, b) => a.due_date.localeCompare(b.due_date)))
      setReminderText('')
      setReminderDate('')
      showToast('Påminnelse skapad')
    }
  }

  async function toggleReminder(id: string) {
    const r = reminders.find(x => x.id === id)
    if (!r) return
    const newStatus = r.status === 'done' ? 'upcoming' : 'done'
    await supabase.from('reminders').update({ status: newStatus }).eq('id', id)
    setReminders(rs => rs.map(x => x.id === id ? { ...x, status: newStatus } : x))
  }

  async function deleteReminder(id: string) {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(rs => rs.filter(r => r.id !== id))
  }

  async function saveNewCustomer() {
    if (!newCustomerForm.company.trim() || !newCustomerForm.email.trim()) return
    setSavingCustomer(true)
    const { data, error } = await supabase.from('customers').insert({
      ...newCustomerForm,
      status: 'active',
    }).select().single()
    if (!error && data) {
      setCustomers(cs => [...cs, data].sort((a, b) => a.company.localeCompare(b.company)))
      setShowNewCustomer(false)
      setNewCustomerForm({ company: '', contact_name: '', email: '', phone: '', city: '', org_nr: '', price_list_id: 'Standard' })
      selectCustomer(data)
      showToast('Kund skapad!')
    } else {
      showToast('Fel: ' + (error?.message || 'Kunde inte spara'))
    }
    setSavingCustomer(false)
  }

  function sendOffer() {
    if (!selected) return
    const sub = `Offert från ProLuxShine — ${selected.company}`
    const body = `Hej ${selected.contact_name},\n\nTack för visat intresse! Jag bifogar en offert anpassad efter er prislista ${selected.price_list_id}.\n\nVänliga hälsningar,\nBashar\nProLuxShine`
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(selected.email)}&su=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  // ── STATS ─────────────────────────────────────────────────
  const totalSpend    = orders.reduce((s, o) => s + (o.total || 0), 0)
  const ordersThisYear = orders.filter(o => new Date(o.created_at).getFullYear() === new Date().getFullYear()).length
  const avgOrderValue = orders.length ? Math.round(totalSpend / orders.length) : 0

  // Product frequency from order_items
  const productFreq: Record<string, { name: string; qty: number; total: number }> = {}
  for (const item of orderItems) {
    if (!productFreq[item.product_name]) productFreq[item.product_name] = { name: item.product_name, qty: 0, total: 0 }
    productFreq[item.product_name].qty += item.qty
    productFreq[item.product_name].total += item.total_price
  }
  const topProducts = Object.values(productFreq).sort((a, b) => b.qty - a.qty).slice(0, 6)
  const maxQty = topProducts[0]?.qty || 1

  const lastOrdered = topProducts.slice(0, 3).map(p => p.name)
  const recommendations = getRecommendations(lastOrdered, allProductNames)

  const today = new Date().toISOString().slice(0, 10)
  const overdueReminders = reminders.filter(r => r.status !== 'done' && r.due_date < today)
  const upcomingReminders = reminders.filter(r => r.status !== 'done' && r.due_date >= today)

  const filtered = customers.filter(c =>
    !search || c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name.toLowerCase().includes(search.toLowerCase())
  )

  const PL_BADGE_COLOR: Record<string, string> = {
    A: 'rgba(76,175,125,.15)', B: 'rgba(74,143,212,.12)', C: 'rgba(155,110,232,.12)', Standard: 'rgba(255,255,255,.06)'
  }
  const PL_TEXT_COLOR: Record<string, string> = {
    A: 'var(--green)', B: 'var(--blue)', C: '#9B6EE8', Standard: 'var(--text3)'
  }

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 58px)' }}>

      {/* ── LEFT: Customer list ──────────────────────────── */}
      <div style={{ width: isMobile ? '100%' : 300, flexShrink: 0, borderRight: isMobile ? 'none' : '1px solid var(--line)', display: isMobile && mobileShowDetail ? 'none' : 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg2)' }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Kunder</span>
            <button onClick={() => setShowNewCustomer(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#111', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={12} /> Ny kund
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input placeholder="Sök kund..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 28px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '8px 0' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ padding: '13px 14px', borderBottom: '1px solid var(--border2)' }}>
                  <div style={{ height: 13, width: `${55 + i * 7}%`, background: 'var(--bg3)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />
                  <div style={{ height: 11, width: '40%', background: 'var(--bg3)', borderRadius: 4, opacity: 0.6, animation: 'pulse 1.5s ease infinite' }} />
                </div>
              ))}
            </div>
          ) : filtered.map(c => {
            const isActive = selected?.id === c.id
            // Count overdue reminders for badge
            const overdueCount = allReminders.filter(r => r.customer_id === c.id && r.due_date < today).length
            return (
              <div key={c.id} onClick={() => selectCustomer(c)} onMouseEnter={() => prefetchCustomer(c)}
                style={{ padding: '13px 14px', borderBottom: '1px solid var(--border2)', cursor: 'pointer', background: isActive ? 'rgba(232,184,75,.07)' : 'transparent', borderLeft: `3px solid ${isActive ? 'var(--gold)' : 'transparent'}`, transition: 'all .12s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: isActive ? 'var(--gold)' : 'var(--text)', marginBottom: 2 }}>{c.company}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {overdueCount > 0 && (
                      <span style={{ background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>{overdueCount}</span>
                    )}
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: PL_BADGE_COLOR[c.price_list_id], color: PL_TEXT_COLOR[c.price_list_id], fontWeight: 700, whiteSpace: 'nowrap' }}>PL {c.price_list_id}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.contact_name}</div>
                {c.last_order_at && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>Senast: {formatDate(c.last_order_at)}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT: Detail panel ──────────────────────────── */}
      {selected ? (
        <div style={{ flex: 1, overflowY: 'auto', display: isMobile && !mobileShowDetail ? 'none' : 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <div style={{ padding: isMobile ? '14px 16px 12px' : '20px 28px 16px', borderBottom: '1px solid var(--line)', background: 'var(--bg2)', flexShrink: 0 }}>
            {isMobile && (
              <button onClick={() => setMobileShowDetail(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', marginBottom: 12, padding: 0 }}>
                ← Tillbaka till kunder
              </button>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{selected.company}</h2>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: PL_BADGE_COLOR[selected.price_list_id], color: PL_TEXT_COLOR[selected.price_list_id], fontWeight: 700 }}>
                    {PRICE_LIST_LABEL[selected.price_list_id]}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text2)', fontSize: 13 }}>
                  {selected.contact_name}{selected.contact_role ? ` · ${selected.contact_role}` : ''} ·{' '}
                  <a href={`tel:${selected.phone}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{selected.phone || '—'}</a> ·{' '}
                  <a href={`mailto:${selected.email}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{selected.email}</a>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <a href={`mailto:${selected.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: 'rgba(74,143,212,.1)', border: '1px solid rgba(74,143,212,.2)', borderRadius: 7, color: 'var(--blue)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  <Mail size={13} /> Mail
                </a>
                {!isMobile && (
                  <button onClick={sendOffer} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: 'rgba(232,184,75,.1)', border: '1px solid rgba(232,184,75,.2)', borderRadius: 7, color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <FileText size={13} /> Skicka offert
                  </button>
                )}
                <Link href="/crm/orders" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: 'var(--gold)', border: 'none', borderRadius: 7, color: '#111', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  <Plus size={13} /> Ny order
                </Link>
              </div>
            </div>

            {/* Quick KPIs */}
            <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Totalt köpt', value: `${fmt(totalSpend)} kr`, icon: ShoppingBag, color: 'var(--gold)' },
                { label: 'Ordrar i år', value: ordersThisYear, icon: FileText, color: 'var(--blue)' },
                { label: 'Snittvärde', value: `${fmt(avgOrderValue)} kr`, icon: TrendingUp, color: 'var(--green)' },
                { label: 'Påminnelser', value: upcomingReminders.length + (overdueReminders.length > 0 ? ` (${overdueReminders.length} försen.)` : ''), icon: Bell, color: overdueReminders.length > 0 ? 'var(--red)' : 'var(--text3)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={14} color={color} />
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{label}:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginTop: 16, borderBottom: '2px solid var(--border)' }}>
              {([
                { key: 'overview', label: 'Översikt' },
                { key: 'orders', label: `Ordrar (${orders.length})` },
                { key: 'stats', label: 'Statistik & rekommendationer' },
                { key: 'notes', label: `Anteckningar${reminders.filter(r=>r.status!=='done').length > 0 ? ` · ${reminders.filter(r=>r.status!=='done').length} påm.` : ''}` },
              ] as const).map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key as Tab)}
                  style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid var(--gold)' : '2px solid transparent', color: tab === key ? 'var(--gold)' : 'var(--text2)', fontSize: 12, fontWeight: tab === key ? 700 : 400, cursor: 'pointer', marginBottom: -2, whiteSpace: 'nowrap' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB: Overview ──────────────────────────────── */}
          {tab === 'overview' && (
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Contact details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 24px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                {[
                  ['E-post', selected.email], ['Telefon', selected.phone || '—'], ['Stad', selected.city || '—'],
                  ['Org.nr', selected.org_nr || '—'], ['Status', selected.status], ['Födelsedag', selected.birthday ? formatDate(selected.birthday) : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Overdue reminders alert */}
              {overdueReminders.length > 0 && (
                <div style={{ background: 'rgba(224,82,82,.08)', border: '1px solid rgba(224,82,82,.2)', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Bell size={15} color="var(--red)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Försenade påminnelser ({overdueReminders.length})</span>
                  </div>
                  {overdueReminders.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(224,82,82,.1)' }}>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{r.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--red)' }}>{r.due_date}</span>
                      <button onClick={() => toggleReminder(r.id)} style={{ background: 'var(--red)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 11, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>Klar</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Last purchases + recommendations */}
              {topProducts.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Senaste köp</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {topProducts.slice(0, 4).map(p => (
                      <span key={p.name} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(76,175,125,.1)', border: '1px solid rgba(76,175,125,.2)', borderRadius: 6, color: 'var(--green)', fontWeight: 600 }}>{p.name} ×{p.qty}</span>
                    ))}
                  </div>
                  {recommendations.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Star size={12} color="var(--gold)" /> Rekommendationer
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {recommendations.map(rec => (
                          <span key={rec} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(232,184,75,.08)', border: '1px solid rgba(232,184,75,.18)', borderRadius: 6, color: 'var(--gold)' }}>{rec}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Last 3 orders */}
              {orders.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Senaste ordrar</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {orders.slice(0, 3).map(o => (
                      <div key={o.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Order #{o.order_nr}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{formatDate(o.created_at)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{fmt(o.total)} kr</div>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(76,175,125,.12)', color: 'var(--green)', fontWeight: 700 }}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setTab('orders')} style={{ padding: '9px 0', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                      Visa alla {orders.length} ordrar →
                    </button>
                  </div>
                </div>
              )}

              {/* Quick note */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Snabbanteckning</div>
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Skriv en anteckning om kunden..." rows={3}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={noteType} onChange={e => setNoteType(e.target.value as any)}
                      style={{ padding: '6px 10px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, outline: 'none' }}>
                      <option value="note">Anteckning</option>
                      <option value="call">Samtal</option>
                      <option value="email">E-post</option>
                      <option value="meeting">Möte</option>
                    </select>
                    <button onClick={addActivity} style={{ padding: '6px 16px', background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#111', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Spara</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Orders ────────────────────────────────── */}
          {tab === 'orders' && (
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map(o => (
                  <div key={o.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: o.order_items?.length ? 10 : 0 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Order #{o.order_nr}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{formatDate(o.created_at)} · {o.delivery_city || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>{fmt(o.total)} kr</div>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(76,175,125,.12)', color: 'var(--green)', fontWeight: 700 }}>{o.status}</span>
                      </div>
                    </div>
                    {(o as any).order_items?.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(o as any).order_items.map((item: OrderItem) => (
                          <span key={item.id} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text2)' }}>
                            {item.product_name} ×{item.qty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {orders.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Inga ordrar ännu</p>}
              </div>
            </div>
          )}

          {/* ── TAB: Stats & Recommendations ───────────────── */}
          {tab === 'stats' && (
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* KPI strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Totalt köpt (inkl. moms)', value: `${fmt(totalSpend)} kr`, color: 'var(--gold)' },
                  { label: 'Antal ordrar', value: orders.length, color: 'var(--blue)' },
                  { label: 'Genomsnittlig orderstorlek', value: `${fmt(avgOrderValue)} kr`, color: 'var(--green)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Top products */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <BarChart2 size={16} color="var(--gold)" />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Mest köpta produkter</h3>
                </div>
                {topProducts.length > 0 ? (
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    {topProducts.map((p, i) => (
                      <div key={p.name} style={{ padding: '13px 18px', borderBottom: i < topProducts.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{p.qty} st</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{fmt(p.total)} kr</span>
                          </div>
                        </div>
                        <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(p.qty / maxQty) * 100}%`, background: i === 0 ? 'var(--gold)' : 'rgba(232,184,75,.35)', borderRadius: 3, transition: 'width .4s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    Inga ordrar — statistik visas efter första köpet
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Star size={16} color="var(--gold)" />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Rekommendationer baserade på köphistorik</h3>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 14px' }}>
                  Produkter som passar bra till vad {selected.company} brukar köpa:
                </p>
                {lastOrdered.length > 0 ? (
                  <>
                    <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>Senast köpt:</span>
                      {lastOrdered.map(n => (
                        <span key={n} style={{ fontSize: 11, padding: '3px 9px', background: 'rgba(76,175,125,.1)', border: '1px solid rgba(76,175,125,.2)', borderRadius: 5, color: 'var(--green)', fontWeight: 600 }}>{n}</span>
                      ))}
                    </div>
                    {recommendations.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        {recommendations.map(rec => (
                          <div key={rec} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(232,184,75,.08)', border: '1px solid rgba(232,184,75,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package size={17} color="var(--gold)" />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{rec}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Passar till deras köp</div>
                            </div>
                            <ChevronRight size={14} color="var(--text3)" style={{ marginLeft: 'auto', marginTop: 2, flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text3)', fontSize: 13 }}>Inga ytterligare rekommendationer för tillfället.</div>
                    )}
                  </>
                ) : (
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '30px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    Rekommendationer genereras automatiskt när kunden har köphistorik
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Notes & Reminders ─────────────────────── */}
          {tab === 'notes' && (
            <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

              {/* Activity log */}
              <div>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Anteckningar & aktiviteter</h3>
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Skriv anteckning, samtalsnotis, mötesinformation..." rows={4}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select value={noteType} onChange={e => setNoteType(e.target.value as any)}
                      style={{ padding: '7px 10px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, outline: 'none' }}>
                      <option value="note">📝 Anteckning</option>
                      <option value="call">📞 Samtal</option>
                      <option value="email">📧 E-post</option>
                      <option value="meeting">🤝 Möte</option>
                    </select>
                    <button onClick={addActivity} style={{ padding: '7px 18px', background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#111', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Spara</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activities.map(a => (
                    <div key={a.id} style={{ background: 'var(--bg3)', border: `1px solid ${activityColor[a.type]}28`, borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: activityColor[a.type], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {a.type === 'note' ? '📝' : a.type === 'call' ? '📞' : a.type === 'email' ? '📧' : '🤝'} {a.title}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>{formatDate(a.created_at)}</span>
                        <button onClick={() => deleteActivity(a.id)} title="Ta bort" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, flexShrink: 0 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {a.body && <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{a.body}</p>}
                    </div>
                  ))}
                  {activities.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Inga aktiviteter</p>}
                </div>
              </div>

              {/* Reminders */}
              <div>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  <Bell size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} color="var(--gold)" />
                  Påminnelser
                </h3>

                {/* Add reminder */}
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <input value={reminderText} onChange={e => setReminderText(e.target.value)} placeholder="Vad ska du komma ihåg?"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} color="var(--text3)" />
                      <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
                        style={{ flex: 1, padding: '7px 10px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, outline: 'none' }} />
                    </div>
                    <select value={reminderPriority} onChange={e => setReminderPriority(e.target.value as ReminderPriority)}
                      style={{ padding: '7px 10px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, color: PRIORITY_COLOR[reminderPriority], fontSize: 12, outline: 'none', fontWeight: 600 }}>
                      <option value="low">Låg</option>
                      <option value="normal">Normal</option>
                      <option value="high">Hög</option>
                    </select>
                  </div>
                  <button onClick={addReminder} style={{ width: '100%', padding: '8px 0', background: 'var(--gold)', border: 'none', borderRadius: 7, color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    + Lägg till påminnelse
                  </button>
                </div>

                {/* Overdue */}
                {overdueReminders.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Försenade</div>
                    {overdueReminders.map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(224,82,82,.06)', border: '1px solid rgba(224,82,82,.2)', borderRadius: 8, marginBottom: 6 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 3 }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--red)' }}>Försenad: {r.due_date}</div>
                        </div>
                        <button onClick={() => toggleReminder(r.id)} style={{ padding: '4px 8px', background: 'var(--green)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 10, cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>✓</button>
                        <button onClick={() => deleteReminder(r.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text3)', flexShrink: 0, padding: 2 }}><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upcoming */}
                {upcomingReminders.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Kommande</div>
                    {upcomingReminders.map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'var(--bg3)', border: `1px solid ${PRIORITY_COLOR[r.priority]}28`, borderRadius: 8, marginBottom: 6 }}>
                        <div style={{ width: 3, height: '100%', minHeight: 36, background: PRIORITY_COLOR[r.priority], borderRadius: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 3 }}>{r.title}</div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}><Calendar size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{r.due_date}</span>
                            <span style={{ fontSize: 10, color: PRIORITY_COLOR[r.priority], fontWeight: 700 }}>{PRIORITY_LABEL[r.priority]}</span>
                          </div>
                        </div>
                        <button onClick={() => toggleReminder(r.id)} style={{ padding: '4px 8px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text3)', fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>✓ Klar</button>
                        <button onClick={() => deleteReminder(r.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text3)', flexShrink: 0, padding: 2 }}><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Done */}
                {reminders.filter(r => r.status === 'done').length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, opacity: 0.6 }}>Avklarade</div>
                    {reminders.filter(r => r.status === 'done').map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 8, marginBottom: 4, opacity: 0.5 }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'line-through', flex: 1 }}>{r.title}</span>
                        <button onClick={() => deleteReminder(r.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {reminders.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '20px 0' }}>Inga påminnelser</div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text3)' }}>
          <div style={{ fontSize: 52 }}>👥</div>
          <p style={{ margin: 0, fontSize: 14 }}>Välj en kund i listan för att se detaljer</p>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '12px 20px', fontSize: 13, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
          {toast}
        </div>
      )}

      {/* ── NEW CUSTOMER MODAL ─────────────────────────────── */}
      {showNewCustomer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 24 }}>Ny kund</div>

            {[
              { label: 'Företagsnamn *', key: 'company', placeholder: 'AB Bilservice', type: 'text' },
              { label: 'Kontaktperson *', key: 'contact_name', placeholder: 'Erik Lindgren', type: 'text' },
              { label: 'E-post *', key: 'email', placeholder: 'erik@foretag.se', type: 'email' },
              { label: 'Telefon', key: 'phone', placeholder: '08-123 45 67', type: 'tel' },
              { label: 'Stad', key: 'city', placeholder: 'Stockholm', type: 'text' },
              { label: 'Org.nr', key: 'org_nr', placeholder: '556123-4567', type: 'text' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
                <input
                  type={type}
                  value={(newCustomerForm as any)[key]}
                  onChange={e => setNewCustomerForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '9px 13px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Prislista</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['A', 'B', 'C', 'Standard'].map(pl => (
                  <button key={pl} onClick={() => setNewCustomerForm(f => ({ ...f, price_list_id: pl }))}
                    style={{ flex: 1, padding: '8px 4px', background: newCustomerForm.price_list_id === pl ? 'rgba(232,184,75,.1)' : 'var(--bg3)', border: `1px solid ${newCustomerForm.price_list_id === pl ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, color: newCustomerForm.price_list_id === pl ? 'var(--gold)' : 'var(--text3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    {pl}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                {newCustomerForm.price_list_id === 'A' ? 'Platinum — 40% rabatt' : newCustomerForm.price_list_id === 'B' ? 'Gold — 30% rabatt' : newCustomerForm.price_list_id === 'C' ? 'Silver — 20% rabatt' : 'Utan rabatt (listavis)'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNewCustomer(false)} style={{ flex: 1, padding: 11, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Avbryt
              </button>
              <button onClick={saveNewCustomer} disabled={savingCustomer || !newCustomerForm.company || !newCustomerForm.email}
                style={{ flex: 2, padding: 11, background: 'var(--gold)', color: '#111', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', opacity: (savingCustomer || !newCustomerForm.company || !newCustomerForm.email) ? 0.6 : 1 }}>
                {savingCustomer ? 'Sparar…' : 'Skapa kund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
