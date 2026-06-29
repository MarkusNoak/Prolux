'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Deal, Customer, DEAL_STAGES, DealStage } from '@/types'
import { fmt, formatDate } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

const supabase = createClient()

const STAGE_COLORS: Record<DealStage, string> = {
  Prospekt: '#5C6270', Kontaktad: '#4A8FD4', Offert: '#E8B84B',
  Förhandling: '#9B6EE8', Vunnen: '#4CAF7D', Förlorad: '#E05252'
}

export default function CrmPipelinePage() {
  const [deals, setDeals] = useState<(Deal & { customers?: Customer })[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', customer_id: '', value: '', stage: 'Prospekt' as DealStage, expected_close: '', notes: '' })
  const [toast, setToast] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('deals').select('*,customers(*)').order('created_at', { ascending: false }),
      supabase.from('customers').select('id,company').eq('status', 'active').order('company')
    ]).then(([d, c]) => {
      if (d.data) setDeals(d.data)
      if (c.data) setCustomers(c.data as Customer[])
      setLoading(false)
    })
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function saveDeal() {
    if (!form.title.trim()) return showToast('Titel krävs')
    const { data, error } = await supabase.from('deals').insert({
      title: form.title.trim(),
      customer_id: form.customer_id || null,
      value: parseFloat(form.value) || 0,
      stage: form.stage,
      expected_close: form.expected_close || null,
      notes: form.notes || null,
    }).select('*,customers(*)').single()
    if (error) { showToast('Fel: ' + error.message); return }
    if (data) {
      setDeals(ds => [data, ...ds])
      showToast('Deal skapad!')
      setShowModal(false)
      setForm({ title: '', customer_id: '', value: '', stage: 'Prospekt', expected_close: '', notes: '' })
    }
  }

  async function moveToStage(dealId: string, stage: DealStage) {
    await supabase.from('deals').update({ stage }).eq('id', dealId)
    setDeals(ds => ds.map(d => d.id === dealId ? { ...d, stage } : d))
  }

  async function deleteDeal(id: string) {
    await supabase.from('deals').delete().eq('id', id)
    setDeals(ds => ds.filter(d => d.id !== id))
    showToast('Deal raderad')
  }

  const stageDeals = (stage: DealStage) => deals.filter(d => d.stage === stage)
  const stageTotal = (stage: DealStage) => stageDeals(stage).reduce((s, d) => s + (d.value || 0), 0)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text3)' }}>Laddar pipeline...</div>

  return (
    <div style={{ padding: 24, height: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Pipeline</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>{deals.filter(d => d.stage !== 'Vunnen' && d.stage !== 'Förlorad').length} aktiva deals · {fmt(deals.filter(d => d.stage !== 'Vunnen' && d.stage !== 'Förlorad').reduce((s,d) => s+d.value,0))} kr i pipeline</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={16} /> Ny deal
        </button>
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: 14, flex: 1, overflow: 'auto', paddingBottom: 16 }}>
        {DEAL_STAGES.map(stage => {
          const color = STAGE_COLORS[stage]
          const columnDeals = stageDeals(stage)
          return (
            <div key={stage}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragging) moveToStage(dragging, stage) }}
              style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}
            >
              {/* Column header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: `${color}10` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stage}</span>
                  <span style={{ fontSize: 11, background: `${color}20`, color, borderRadius: 10, padding: '2px 8px', fontWeight: 700 }}>{columnDeals.length}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{fmt(stageTotal(stage))} kr</div>
              </div>
              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {columnDeals.map(d => (
                  <div key={d.id}
                    draggable
                    onDragStart={() => setDragging(d.id)}
                    onDragEnd={() => setDragging(null)}
                    style={{ background: 'var(--bg4)', border: `1px solid ${dragging === d.id ? color : 'var(--border)'}`, borderRadius: 10, padding: 14, cursor: 'grab', transition: 'all .15s' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{d.title}</span>
                      <button onClick={() => deleteDeal(d.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 2, flexShrink: 0 }}><X size={12} /></button>
                    </div>
                    {d.customers && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{d.customers.company}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>{fmt(d.value)} kr</span>
                      {(d as any).expected_close && <span style={{ fontSize: 10, color: 'var(--text3)' }}>{formatDate((d as any).expected_close)}</span>}
                    </div>
                    {(d as any).notes && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8, lineHeight: 1.4 }}>{(d as any).notes}</div>}
                    {/* Move buttons */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                      {DEAL_STAGES.filter(s => s !== stage).slice(0, 3).map(s => (
                        <button key={s} onClick={() => moveToStage(d.id, s)} style={{ fontSize: 9, padding: '2px 6px', background: `${STAGE_COLORS[s]}15`, border: `1px solid ${STAGE_COLORS[s]}30`, borderRadius: 4, color: STAGE_COLORS[s], cursor: 'pointer', fontWeight: 600 }}>→ {s}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, width: 480 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Ny deal</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'grid', gap: 14 }}>
              {[
                { label: 'Titel', key: 'title', placeholder: 'Produktpaket Virtus 2025' },
                { label: 'Värde (kr)', key: 'value', placeholder: '25000' },
                { label: 'Stängningsdatum', key: 'expected_close', type: 'date' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                  <input type={type || 'text'} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kund</label>
                <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none' }}>
                  <option value="">Välj kund...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stage</label>
                <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as DealStage }))} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none' }}>
                  {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Anteckning</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Skriv en anteckning..." style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={saveDeal} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Skapa deal</button>
            </div>
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
