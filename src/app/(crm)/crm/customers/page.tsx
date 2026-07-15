'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, Search, Bell } from 'lucide-react'
import Link from 'next/link'

const supabase = createClient()

export default function CrmCustomersPage() {
  const [customers, setCustomers]     = useState<Customer[]>([])
  const [allReminders, setAllReminders] = useState<{ customer_id: string; due_date: string }[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({ company: '', contact_name: '', email: '', phone: '', city: '', org_nr: '', price_list_id: 'Standard' })
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [toast, setToast]             = useState('')

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    Promise.all([
      supabase.from('customers').select('id,company,contact_name,email,phone,city,org_nr,price_list_id,status,last_order_at,created_at').order('company'),
      supabase.from('reminders').select('customer_id,due_date').eq('status', 'upcoming'),
    ]).then(([{ data: c }, { data: r }]) => {
      if (c) setCustomers(c as Customer[])
      if (r) setAllReminders(r as any[])
      setLoading(false)
    })
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

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
      showToast('Kund skapad!')
    } else {
      showToast('Fel: ' + (error?.message || 'Kunde inte spara'))
    }
    setSavingCustomer(false)
  }

  const filtered = customers.filter(c =>
    !search ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name.toLowerCase().includes(search.toLowerCase())
  )

  const PL_BADGE_COLOR: Record<string, string> = {
    A: 'rgba(76,175,125,.15)', B: 'rgba(74,143,212,.12)', C: 'rgba(155,110,232,.12)', Standard: 'rgba(255,255,255,.06)'
  }
  const PL_TEXT_COLOR: Record<string, string> = {
    A: 'var(--green)', B: 'var(--blue)', C: '#9B6EE8', Standard: 'var(--text3)'
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Kunder</h1>
          {!loading && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text3)' }}>{customers.length} kunder totalt</p>}
        </div>
        <button onClick={() => setShowNewCustomer(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          <Plus size={14} /> Ny kund
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
        <input
          placeholder="Sök företag eller kontaktperson..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '11px 14px 11px 36px', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 9, color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Customer list */}
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 80px 80px', gap: 0, padding: '10px 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg2)' }}>
          {['Företag', 'Kontaktperson', 'Stad', 'Prislista', 'Senast'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '8px 0' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 80px 80px', gap: 0, padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ height: 14, width: `${50 + i * 8}%`, background: 'var(--bg4)', borderRadius: 4, animation: 'pulse 1.5s ease infinite' }} />
                <div style={{ height: 12, width: '80%', background: 'var(--bg4)', borderRadius: 4, opacity: 0.6, animation: 'pulse 1.5s ease infinite' }} />
                <div style={{ height: 12, width: '60%', background: 'var(--bg4)', borderRadius: 4, opacity: 0.5, animation: 'pulse 1.5s ease infinite' }} />
                <div style={{ height: 12, width: '50%', background: 'var(--bg4)', borderRadius: 4, opacity: 0.4, animation: 'pulse 1.5s ease infinite' }} />
                <div style={{ height: 12, width: '60%', background: 'var(--bg4)', borderRadius: 4, opacity: 0.4, animation: 'pulse 1.5s ease infinite' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
            {search ? 'Inga kunder matchar sökningen' : 'Inga kunder'}
          </div>
        ) : filtered.map((c, i) => {
          const overdueCount = allReminders.filter(r => r.customer_id === c.id && r.due_date < today).length
          return (
            <Link key={c.id} href={`/crm/customers/${c.id}`} style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 120px 80px 80px',
              gap: 0, padding: '15px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none',
              textDecoration: 'none',
              background: 'transparent',
              transition: 'background .1s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.company}</span>
                  {overdueCount > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(224,82,82,.15)', border: '1px solid rgba(224,82,82,.25)', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700, color: 'var(--red)' }}>
                      <Bell size={9} /> {overdueCount}
                    </span>
                  )}
                </div>
                {c.email && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.email}</div>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', alignSelf: 'center' }}>{c.contact_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', alignSelf: 'center' }}>{c.city || '—'}</div>
              <div style={{ alignSelf: 'center' }}>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: PL_BADGE_COLOR[c.price_list_id], color: PL_TEXT_COLOR[c.price_list_id], fontWeight: 700 }}>
                  {c.price_list_id}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>
                {c.last_order_at ? formatDate(c.last_order_at) : '—'}
              </div>
            </Link>
          )
        })}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)', padding: '12px 20px', fontSize: 13, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
          {toast}
        </div>
      )}

      {/* New customer modal */}
      {showNewCustomer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520 }}>
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
                  style={{ width: '100%', padding: '9px 13px', background: 'var(--bg4)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Prislista</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['A', 'B', 'C', 'Standard'].map(pl => (
                  <button key={pl} onClick={() => setNewCustomerForm(f => ({ ...f, price_list_id: pl }))}
                    style={{ flex: 1, padding: '8px 4px', background: newCustomerForm.price_list_id === pl ? 'rgba(232,184,75,.1)' : 'var(--bg3)', border: `1px solid ${newCustomerForm.price_list_id === pl ? 'var(--gold)' : 'var(--line)'}`, borderRadius: 8, color: newCustomerForm.price_list_id === pl ? 'var(--gold)' : 'var(--text3)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {pl}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                {newCustomerForm.price_list_id === 'A' ? 'Platinum — 40% rabatt' : newCustomerForm.price_list_id === 'B' ? 'Gold — 30% rabatt' : newCustomerForm.price_list_id === 'C' ? 'Silver — 20% rabatt' : 'Utan rabatt (listavis)'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNewCustomer(false)} style={{ flex: 1, padding: 11, background: 'var(--bg3)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
                Avbryt
              </button>
              <button onClick={saveNewCustomer} disabled={savingCustomer || !newCustomerForm.company || !newCustomerForm.email}
                style={{ flex: 2, padding: 11, background: 'var(--gold)', color: '#111', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: (savingCustomer || !newCustomerForm.company || !newCustomerForm.email) ? 0.6 : 1 }}>
                {savingCustomer ? 'Sparar…' : 'Skapa kund'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .4 } }
      `}</style>
    </div>
  )
}
