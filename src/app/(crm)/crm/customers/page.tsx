'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Customer, Order, Activity, PRICE_LIST_LABEL, PriceList } from '@/types'
import { fmt, formatDate } from '@/lib/utils'
import { Plus, X, Mail, Phone, FileText, MessageSquare } from 'lucide-react'

const supabase = createClient()

export default function CrmCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selected, setSelected] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [noteText, setNoteText] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase.from('customers').select('*').order('company').then(({ data }) => {
      if (data) setCustomers(data)
      setLoading(false)
    })
  }, [])

  async function selectCustomer(c: Customer) {
    setSelected(c)
    const [{ data: o }, { data: a }] = await Promise.all([
      supabase.from('orders').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('activities').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(20)
    ])
    if (o) setOrders(o)
    if (a) setActivities(a)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function addNote(type: 'note' | 'call' | 'email' | 'meeting') {
    if (!selected || !noteText.trim()) return
    const { data, error } = await supabase.from('activities').insert({
      customer_id: selected.id, type, title: type === 'note' ? 'Anteckning' : type === 'call' ? 'Samtal' : type === 'email' ? 'E-post' : 'Möte',
      body: noteText, created_by: 'Bashar'
    }).select().single()
    if (!error && data) {
      setActivities(as => [data, ...as])
      setNoteText('')
      showToast('Aktivitet sparad')
    }
  }

  function sendOffer() {
    if (!selected) return
    const subject = `Offert från ProLuxShine — ${selected.company}`
    const body = `Hej ${selected.contact_name},\n\nTack för visat intresse! Jag bifogar en offert baserad på er prislista.\n\nMed vänliga hälsningar,\nBashar\nProLuxShine`
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(selected.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const filtered = customers.filter(c =>
    !search || c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const activityIcon: Record<string, any> = { note: MessageSquare, call: Phone, email: Mail, meeting: FileText, order: FileText }
  const activityColor: Record<string, string> = { note: 'var(--text3)', call: 'var(--green)', email: 'var(--blue)', meeting: 'var(--gold)', order: 'var(--gold)' }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 58px)' }}>
      {/* List panel */}
      <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <input placeholder="Sök kund..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Laddar...</div>
          ) : filtered.map(c => (
            <div key={c.id} onClick={() => selectCustomer(c)} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border2)', cursor: 'pointer', background: selected?.id === c.id ? 'rgba(232,184,75,.07)' : 'transparent', borderLeft: selected?.id === c.id ? '3px solid var(--gold)' : '3px solid transparent', transition: 'all .15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{c.company}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.contact_name}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: c.price_list_id === 'A' ? 'rgba(76,175,125,.15)' : c.price_list_id === 'B' ? 'rgba(74,143,212,.12)' : 'rgba(155,110,232,.12)', color: c.price_list_id === 'A' ? 'var(--green)' : c.price_list_id === 'B' ? 'var(--blue)' : '#9B6EE8', fontWeight: 700 }}>PL {c.price_list_id}</span>
              </div>
              {c.last_order_at && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Senast order: {formatDate(c.last_order_at)}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected ? (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{selected.company}</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>{selected.contact_name} · {selected.contact_role || 'Kontakt'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`mailto:${selected.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(74,143,212,.1)', border: '1px solid rgba(74,143,212,.2)', borderRadius: 8, color: 'var(--blue)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  <Mail size={13} /> E-post
                </a>
                <button onClick={sendOffer} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(232,184,75,.1)', border: '1px solid rgba(232,184,75,.2)', borderRadius: 8, color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <FileText size={13} /> Skicka offert
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'E-post', value: selected.email },
                { label: 'Telefon', value: selected.phone || '—' },
                { label: 'Stad', value: selected.city || '—' },
                { label: 'Prislista', value: PRICE_LIST_LABEL[selected.price_list_id] },
                { label: 'Org.nr', value: selected.org_nr || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 32 }}>
            {/* Orders */}
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Orderhistorik</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {orders.map(o => (
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
                {orders.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Inga ordrar ännu</p>}
              </div>
            </div>

            {/* Activity log */}
            <div>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Aktiviteter</h3>
              {/* Add activity */}
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Skriv anteckning, samtalsnotis..." rows={3} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {(['note', 'call', 'email', 'meeting'] as const).map(t => (
                    <button key={t} onClick={() => addNote(t)} style={{ padding: '6px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, color: activityColor[t], fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{t === 'note' ? 'Anteckning' : t === 'call' ? 'Samtal' : t === 'email' ? 'E-post' : 'Möte'}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activities.map(a => {
                  const Icon = activityIcon[a.type] || MessageSquare
                  return (
                    <div key={a.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Icon size={13} color={activityColor[a.type]} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: activityColor[a.type] }}>{a.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>{formatDate(a.created_at)}</span>
                      </div>
                      {a.body && <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{a.body}</p>}
                    </div>
                  )
                })}
                {activities.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Inga aktiviteter</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text3)' }}>
          <div style={{ fontSize: 48 }}>👥</div>
          <p style={{ margin: 0, fontSize: 14 }}>Välj en kund för att se detaljer</p>
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
