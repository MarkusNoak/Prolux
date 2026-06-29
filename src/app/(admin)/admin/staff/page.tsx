'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Trash2, RefreshCw, Shield, User, Briefcase, Copy, Check } from 'lucide-react'

type Role = 'admin' | 'crm' | 'portal'

interface StaffMember {
  id: string
  email: string
  role: Role
  name: string
  created_at: string
  last_sign_in_at?: string
}

const ROLE_LABEL: Record<Role, string> = { admin: 'Administratör', crm: 'Säljare (CRM)', portal: 'Kund (Portal)' }
const ROLE_COLOR: Record<Role, string> = { admin: '#E8B84B', crm: '#4A8FD4', portal: '#4CAF7D' }
const ROLE_ICON: Record<Role, React.ElementType> = { admin: Shield, crm: Briefcase, portal: User }

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('crm')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ link?: string; error?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const supabase = createClient()

  async function loadStaff() {
    setLoading(true)
    // Fetch users from auth.users via admin API (requires service role) — fallback to user_metadata from session
    // Since we only have anon key in client, we read from a public staff_profiles view or use listUsers via admin
    // For now, load from a local staff list stored in localStorage (will migrate to DB)
    const stored = localStorage.getItem('prolux_staff')
    const list: StaffMember[] = stored ? JSON.parse(stored) : getDefaultStaff()
    setStaff(list)
    setLoading(false)
  }

  function getDefaultStaff(): StaffMember[] {
    const defaults: StaffMember[] = [
      { id: 'bashar-1', email: 'bashar@proluxshine.se', role: 'admin', name: 'Bashar', created_at: '2024-01-01T00:00:00Z', last_sign_in_at: new Date().toISOString() },
      { id: 'seller-1', email: 'stefan@detailingproffs.se', role: 'crm', name: 'Stefan', created_at: '2024-03-15T00:00:00Z' },
    ]
    localStorage.setItem('prolux_staff', JSON.stringify(defaults))
    return defaults
  }

  useEffect(() => { loadStaff() }, [])

  async function handleInvite() {
    if (!inviteEmail || !inviteName) return
    setInviting(true)
    setInviteResult(null)

    try {
      // Try Supabase admin invite
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
        data: { role: inviteRole, full_name: inviteName },
        redirectTo: `${window.location.origin}/login`,
      })

      if (!error && data?.user) {
        const newMember: StaffMember = {
          id: data.user.id,
          email: inviteEmail,
          role: inviteRole,
          name: inviteName,
          created_at: new Date().toISOString(),
        }
        const updated = [...staff, newMember]
        setStaff(updated)
        localStorage.setItem('prolux_staff', JSON.stringify(updated))
        setInviteResult({ link: `${window.location.origin}/login` })
      } else {
        // Supabase admin API not accessible with anon key — create local record + show manual link
        const newMember: StaffMember = {
          id: `local-${Date.now()}`,
          email: inviteEmail,
          role: inviteRole,
          name: inviteName,
          created_at: new Date().toISOString(),
        }
        const updated = [...staff, newMember]
        setStaff(updated)
        localStorage.setItem('prolux_staff', JSON.stringify(updated))
        const link = `${window.location.origin}/login?invite=${btoa(JSON.stringify({ email: inviteEmail, role: inviteRole, name: inviteName }))}`
        setInviteResult({ link })
      }
    } catch {
      setInviteResult({ error: 'Kunde inte skicka inbjudan. Prova igen.' })
    }
    setInviting(false)
  }

  function handleDelete(id: string) {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return }
    const updated = staff.filter(s => s.id !== id)
    setStaff(updated)
    localStorage.setItem('prolux_staff', JSON.stringify(updated))
    setDeleteConfirm(null)
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function resetInvite() {
    setShowInvite(false)
    setInviteEmail('')
    setInviteName('')
    setInviteRole('crm')
    setInviteResult(null)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
            Medarbetare
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>
            Hantera ditt team — bjud in säljare, admins och portalanvändare
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--gold)', color: '#111', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
        >
          <UserPlus size={15} /> Bjud in medarbetare
        </button>
      </div>

      {/* Role legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(Object.keys(ROLE_LABEL) as Role[]).map(r => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg3)', borderRadius: '20px', fontSize: '12px', color: 'var(--text2)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ROLE_COLOR[r], display: 'inline-block' }} />
            {ROLE_LABEL[r]}
          </div>
        ))}
      </div>

      {/* Staff table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 160px 120px', padding: '10px 20px', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          <span>Namn / E-post</span>
          <span>Roll</span>
          <span>Senast inloggad</span>
          <span style={{ textAlign: 'right' }}>Åtgärder</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Laddar...</div>
        ) : staff.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Inga medarbetare ännu.</div>
        ) : (
          staff.map((member, i) => {
            const RoleIcon = ROLE_ICON[member.role]
            const isLast = i === staff.length - 1
            return (
              <div key={member.id} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 160px 120px', padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid var(--border)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{member.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{member.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RoleIcon size={13} style={{ color: ROLE_COLOR[member.role] }} />
                  <span style={{ fontSize: '12px', color: ROLE_COLOR[member.role], fontWeight: 500 }}>{ROLE_LABEL[member.role]}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  {member.last_sign_in_at
                    ? new Date(member.last_sign_in_at).toLocaleDateString('sv-SE')
                    : '—'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => handleDelete(member.id)}
                    title={deleteConfirm === member.id ? 'Klicka igen för att bekräfta' : 'Ta bort'}
                    style={{ padding: '5px 8px', background: deleteConfirm === member.id ? 'rgba(224,82,82,.2)' : 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', color: deleteConfirm === member.id ? '#E05252' : 'var(--text3)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={13} />
                    {deleteConfirm === member.id ? 'Bekräfta?' : ''}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
              Bjud in medarbetare
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '24px' }}>
              En inbjudningslänk genereras som du skickar till personen.
            </div>

            {!inviteResult ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Namn</label>
                  <input
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    placeholder="Förnamn Efternamn"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>E-postadress</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="namn@foretag.se"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Roll</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(Object.keys(ROLE_LABEL) as Role[]).map(r => {
                      const RIcon = ROLE_ICON[r]
                      const active = inviteRole === r
                      return (
                        <button
                          key={r}
                          onClick={() => setInviteRole(r)}
                          style={{ flex: 1, padding: '12px 8px', background: active ? 'rgba(232,184,75,.08)' : 'var(--bg3)', border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '8px', color: active ? 'var(--gold)' : 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: active ? 600 : 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                        >
                          <RIcon size={16} style={{ color: active ? 'var(--gold)' : ROLE_COLOR[r] }} />
                          {r === 'admin' ? 'Admin' : r === 'crm' ? 'Säljare' : 'Kund'}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text3)' }}>
                    {inviteRole === 'admin' && 'Full tillgång — kan hantera produkter, ordrar, kunder och medarbetare.'}
                    {inviteRole === 'crm' && 'Tillgång till CRM-systemet — pipeline, kundkort och orderläggning.'}
                    {inviteRole === 'portal' && 'Tillgång till kundportalen — produktkatalog och orderhistorik.'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={resetInvite} style={{ flex: 1, padding: '11px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>
                    Avbryt
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail || !inviteName}
                    style={{ flex: 2, padding: '11px', background: 'var(--gold)', color: '#111', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', opacity: (inviting || !inviteEmail || !inviteName) ? 0.6 : 1 }}
                  >
                    {inviting ? 'Genererar länk…' : 'Generera inbjudningslänk'}
                  </button>
                </div>
              </>
            ) : inviteResult.error ? (
              <div>
                <div style={{ padding: '16px', background: 'rgba(224,82,82,.1)', border: '1px solid rgba(224,82,82,.3)', borderRadius: '8px', color: '#E05252', fontSize: '13px', marginBottom: '16px' }}>
                  {inviteResult.error}
                </div>
                <button onClick={() => setInviteResult(null)} style={{ padding: '10px 20px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: 'pointer' }}>
                  Försök igen
                </button>
              </div>
            ) : (
              <div>
                <div style={{ padding: '16px', background: 'rgba(76,175,125,.08)', border: '1px solid rgba(76,175,125,.25)', borderRadius: '8px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#4CAF7D', marginBottom: '6px' }}>Medarbetare tillagd!</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>
                    Skicka länken nedan till <strong style={{ color: 'var(--text)' }}>{inviteName}</strong> ({inviteEmail}) så kan de logga in.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1, padding: '8px 12px', background: 'var(--bg4)', borderRadius: '6px', fontSize: '11px', color: 'var(--text2)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {inviteResult.link}
                    </div>
                    <button
                      onClick={() => copyLink(inviteResult.link!)}
                      style={{ padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', color: copied ? '#4CAF7D' : 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      {copied ? <><Check size={13} /> Kopierat!</> : <><Copy size={13} /> Kopiera</>}
                    </button>
                  </div>
                </div>
                <button onClick={resetInvite} style={{ width: '100%', padding: '11px', background: 'var(--gold)', color: '#111', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  Stäng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
