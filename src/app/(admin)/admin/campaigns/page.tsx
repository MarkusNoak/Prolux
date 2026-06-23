'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Campaign } from '@/types'
import { formatDate, fmt } from '@/lib/utils'
import { Plus, Tag } from 'lucide-react'

const supabase = createClient()

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({
    code: '', name: '', discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: '', min_order_amount: '', max_uses: '', valid_from: '', valid_to: '', active: true
  })

  useEffect(() => {
    supabase.from('campaigns').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setCampaigns(data)
      setLoading(false)
    })
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function saveCampaign() {
    const payload = {
      code: form.code.toUpperCase(), name: form.name,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value) || 0,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      valid_from: form.valid_from || new Date().toISOString().split('T')[0],
      valid_to: form.valid_to || null,
      active: form.active, used_count: 0
    }
    const { data, error } = await supabase.from('campaigns').insert(payload).select().single()
    if (!error && data) {
      setCampaigns(c => [data, ...c])
      showToast('Kampanj skapad!')
    } else {
      showToast('Fel: ' + (error?.message || 'Okänt fel'))
    }
    setShowModal(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('campaigns').update({ active: !active }).eq('id', id)
    setCampaigns(cs => cs.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Kampanjer</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Rabattkoder och kampanjer</p>
        </div>
        <button onClick={() => { setForm({ code:'', name:'', discount_type:'percent', discount_value:'', min_order_amount:'', max_uses:'', valid_from:'', valid_to:'', active:true }); setShowModal(true) }} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', background:'var(--gold)', border:'none', borderRadius:8, color:'#111', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          <Plus size={16} /> Ny kampanj
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 60 }}>Laddar...</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {campaigns.map(c => (
            <div key={c.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(232,184,75,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Tag size={22} color="var(--gold)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em' }}>{c.code}</span>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: c.active ? 'rgba(76,175,125,.15)' : 'rgba(224,82,82,.1)', color: c.active ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{c.active ? 'AKTIV' : 'INAKTIV'}</span>
                </div>
                <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                <div style={{ display: 'flex', gap: 20, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Rabatt: <strong style={{ color: 'var(--text)' }}>{c.discount_type === 'percent' ? `${c.discount_value}%` : `${fmt(c.discount_value)} kr`}</strong></span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Min. order: <strong style={{ color: 'var(--text)' }}>{fmt(c.min_order_amount)} kr</strong></span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Använd: <strong style={{ color: 'var(--text)' }}>{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''} ggr</strong></span>
                  {c.valid_from && <span style={{ fontSize: 12, color: 'var(--text2)' }}>Fr.o.m: <strong style={{ color: 'var(--text)' }}>{formatDate(c.valid_from)}</strong></span>}
                  {c.valid_to && <span style={{ fontSize: 12, color: 'var(--text2)' }}>T.o.m: <strong style={{ color: 'var(--text)' }}>{formatDate(c.valid_to)}</strong></span>}
                </div>
              </div>
              <button onClick={() => toggleActive(c.id, c.active)} style={{ padding: '8px 16px', background: c.active ? 'rgba(224,82,82,.1)' : 'rgba(76,175,125,.12)', border: `1px solid ${c.active ? 'rgba(224,82,82,.25)' : 'rgba(76,175,125,.25)'}`, borderRadius: 8, color: c.active ? 'var(--red)' : 'var(--green)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {c.active ? 'Inaktivera' : 'Aktivera'}
              </button>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 60 }}>Inga kampanjer ännu</div>
          )}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, width: 500 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Ny kampanj</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Kampanjkod', key: 'code', placeholder: 'SOMMAR25', col: 1 },
                { label: 'Namn', key: 'name', placeholder: 'Sommarrea 2025', col: 1 },
                { label: 'Rabattvärde', key: 'discount_value', placeholder: '25', col: 1 },
                { label: 'Min. orderbelopp (kr)', key: 'min_order_amount', placeholder: '500', col: 1 },
                { label: 'Max användningar', key: 'max_uses', placeholder: 'Obegränsat', col: 1 },
                { label: 'Giltig från', key: 'valid_from', type: 'date', col: 1 },
                { label: 'Giltig till', key: 'valid_to', type: 'date', col: 1 },
              ].map(({ label, key, placeholder, type, col }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                  <input type={type || 'text'} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rabattyp</label>
                <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none' }}>
                  <option value="percent">Procent (%)</option>
                  <option value="fixed">Fast belopp (kr)</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Avbryt</button>
              <button onClick={saveCampaign} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 6, color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Skapa kampanj</button>
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
