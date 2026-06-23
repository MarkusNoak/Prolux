'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Mail, Clock } from 'lucide-react'

const supabase = createClient()

interface Automation {
  id: string
  name: string
  trigger: string
  action: string
  active: boolean
  last_run_at: string | null
  run_count: number
  created_at: string
}

export default function AdminAutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase.from('automations').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setAutomations(data)
      setLoading(false)
    })
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function toggleAutomation(id: string, active: boolean) {
    await supabase.from('automations').update({ active: !active }).eq('id', id)
    setAutomations(as => as.map(a => a.id === id ? { ...a, active: !active } : a))
    showToast(!active ? 'Automation aktiverad' : 'Automation inaktiverad')
  }

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Automationer</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>E-postautomationer och schemalagda händelser</p>
      </div>

      <div style={{ background: 'rgba(232,184,75,.08)', border: '1px solid rgba(232,184,75,.2)', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Zap size={18} color="var(--gold)" />
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)' }}>Automationer körs dagligen via edge function <code style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>run-automations</code>. Aktivera/inaktivera nedan.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 60 }}>Laddar...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {automations.map(a => (
            <div key={a.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: a.active ? 'rgba(76,175,125,.12)' : 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={20} color={a.active ? 'var(--green)' : 'var(--text3)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{a.name}</span>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: a.active ? 'rgba(76,175,125,.15)' : 'rgba(92,98,112,.15)', color: a.active ? 'var(--green)' : 'var(--text3)', fontWeight: 700 }}>{a.active ? 'AKTIV' : 'PAUSAD'}</span>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Trigger: <strong style={{ color: 'var(--text)' }}>{a.trigger}</strong></span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Åtgärd: <strong style={{ color: 'var(--text)' }}>{a.action}</strong></span>
                  {a.last_run_at && (
                    <span style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> Senast körd: <strong style={{ color: 'var(--text)' }}>{new Date(a.last_run_at).toLocaleString('sv-SE')}</strong>
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>Körningar: <strong style={{ color: 'var(--text)' }}>{a.run_count || 0}</strong></span>
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
                <input type="checkbox" checked={a.active} onChange={() => toggleAutomation(a.id, a.active)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span onClick={() => toggleAutomation(a.id, a.active)} style={{ position: 'absolute', inset: 0, borderRadius: 12, background: a.active ? 'var(--green)' : 'var(--bg4)', border: `1px solid ${a.active ? 'var(--green)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all .2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: a.active ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                </span>
              </label>
            </div>
          ))}
          {automations.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 60 }}>Inga automationer konfigurerade</div>
          )}
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
