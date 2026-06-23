'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/utils'
import { X, Pencil, Trash2 } from 'lucide-react'

const EMPTY_FORM = {
  name: '', sku: '', category: '', description: '',
  list_price: '', stock_qty: '', status: 'active', sort_order: '',
}

const STATUS_CSS: Record<string, { bg: string; color: string }> = {
  active:       { bg: 'rgba(76,175,125,.12)',  color: '#4CAF7D' },
  inactive:     { bg: 'rgba(155,163,176,.08)', color: '#9BA0AB' },
  discontinued: { bg: 'rgba(224,82,82,.12)',   color: '#E05252' },
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv', inactive: 'Inaktiv', discontinued: 'Utgått',
}

export default function AdminProducts() {
  const [products, setProducts]   = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState({ ...EMPTY_FORM })
  const [toast, setToast]         = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const sb = createClient()
    const { data } = await sb.from('products').select('*').order('sort_order').order('name')
    setProducts(data || [])
  }

  function openCreate() {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(p: any) {
    setEditId(p.id)
    setForm({
      name: p.name || '', sku: p.sku || '', category: p.category || '',
      description: p.description || '', list_price: String(p.list_price || ''),
      stock_qty: String(p.stock_qty || ''), status: p.status || 'active',
      sort_order: String(p.sort_order || ''),
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.name || !form.sku) { showToast('Namn och SKU krävs'); return }
    const sb = createClient()
    const payload = {
      name: form.name, sku: form.sku, category: form.category,
      description: form.description, list_price: parseFloat(form.list_price) || 0,
      stock_qty: parseInt(form.stock_qty) || 0, status: form.status,
      sort_order: parseInt(form.sort_order) || 0,
    }
    if (editId) {
      const { error } = await sb.from('products').update(payload).eq('id', editId)
      if (error) { showToast('Fel: ' + error.message); return }
      showToast('Produkt uppdaterad')
    } else {
      const { error } = await sb.from('products').insert(payload)
      if (error) { showToast('Fel: ' + error.message); return }
      showToast('Produkt skapad: ' + form.name)
    }
    setShowModal(false)
    load()
  }

  async function deleteProduct(id: string) {
    const sb = createClient()
    await sb.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    setConfirmDelete(null)
    showToast('Produkt borttagen')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || p.category === catFilter
    return matchSearch && matchCat
  })

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '40px 40px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)', letterSpacing: '.28em', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>004 / Hantera</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '40px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.1 }}>Produkter</div>
        </div>
        <button onClick={openCreate} style={{ padding: '9px 18px', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#111' }}>
          + Ny produkt
        </button>
      </div>

      {/* Filters */}
      <div style={{ padding: '20px 40px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.04)', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Sök produkt, SKU…"
          style={{ flex: 1, maxWidth: 320, padding: '9px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '13px', outline: 'none' }}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '13px', outline: 'none' }}>
          <option value="">Alla kategorier</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>{filtered.length} produkter</span>
      </div>

      {/* Table */}
      <div style={{ padding: '0 40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['SKU', 'Produkt', 'Kategori', 'Listpris', 'Lager', 'Status', ''].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '14px 0', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const sc = STATUS_CSS[p.status] || STATUS_CSS.inactive
              const stockColor = p.stock_qty === 0 ? '#E05252' : p.stock_qty < 10 ? '#E8B84B' : p.stock_qty < 20 ? '#D48A3A' : '#4CAF7D'
              return (
                <tr key={p.id}>
                  <td style={{ padding: '14px 0', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text3)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>{p.sku}</td>
                  <td style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <strong style={{ fontSize: 13, color: 'var(--text)', display: 'block' }}>{p.name}</strong>
                    {p.description && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{p.description.slice(0, 48)}{p.description.length > 48 ? '…' : ''}</span>}
                  </td>
                  <td style={{ padding: '14px 0', fontSize: 12, color: 'var(--text2)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>{p.category || '—'}</td>
                  <td style={{ padding: '14px 0', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--gold)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>{fmt(p.list_price)} kr</td>
                  <td style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: stockColor }}>{p.stock_qty} st</span>
                  </td>
                  <td style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 4, background: sc.bg, color: sc.color }}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEdit(p)}
                        style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 5, background: 'transparent', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        style={{ width: 28, height: 28, border: '1px solid rgba(224,82,82,.2)', borderRadius: 5, background: 'transparent', color: '#E05252', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: 20 }}
        >
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>{editId ? 'Redigera produkt' : 'Ny produkt'}</div>
              <button onClick={() => setShowModal(false)} style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg3)', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Produktnamn *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="ProLux Shine Premium 500ml" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>SKU *</label>
                  <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="PLS-001" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Kategori</label>
                  <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Billack, Skyddsfilm…" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Listpris (kr)</label>
                  <input type="number" value={form.list_price} onChange={e => setForm(p => ({ ...p, list_price: e.target.value }))} placeholder="0" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Lagersaldo</label>
                  <input type="number" value={form.stock_qty} onChange={e => setForm(p => ({ ...p, stock_qty: e.target.value }))} placeholder="0" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Sorteringsordning</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} placeholder="0" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none' }}>
                    <option value="active">Aktiv</option>
                    <option value="inactive">Inaktiv</option>
                    <option value="discontinued">Utgått</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Beskrivning</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Kort produktbeskrivning…" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 72, boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={save} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#111', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {editId ? 'Spara ändringar' : 'Skapa produkt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
        >
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Ta bort produkt?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Denna åtgärd kan inte ångras. Produkten tas bort permanent.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={() => deleteProduct(confirmDelete)} style={{ padding: '9px 18px', background: '#E05252', border: 'none', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Ta bort</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '12px 20px', fontSize: 13, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  )
}
