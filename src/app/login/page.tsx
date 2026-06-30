'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('stefan@detailingproffs.se')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Fel lösenord eller e-post. Försök igen.'); setLoading(false); return }
    const role = data.user?.user_metadata?.role
    // Full reload so middleware picks up the new session cookie
    if (role === 'admin') window.location.href = '/admin/dashboard'
    else if (role === 'crm') window.location.href = '/crm/dashboard'
    else window.location.href = '/portal/dashboard'
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',background:'var(--bg)'}}>
      <div style={{width:'100%',maxWidth:'400px'}}>
        <div style={{fontFamily:'var(--font-serif)',fontSize:'28px',fontWeight:500,color:'var(--text)',marginBottom:'6px'}}>
          Prolux <span style={{color:'var(--gold)',fontStyle:'italic'}}>Shine</span>
        </div>
        <div style={{fontSize:'13px',color:'var(--text3)',marginBottom:'32px'}}>B2B-portal för återförsäljare</div>
        
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'18px'}}>
            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--text2)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'.06em'}}>E-post</label>
            <input 
              type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:'100%',padding:'11px 14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--text)',fontFamily:'var(--font-sans)',fontSize:'14px',outline:'none'}}
              placeholder="namn@foretag.se"
            />
          </div>
          <div style={{marginBottom:'18px'}}>
            <label style={{display:'block',fontSize:'11px',fontWeight:600,color:'var(--text2)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'.06em'}}>Lösenord</label>
            <input 
              type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              style={{width:'100%',padding:'11px 14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--text)',fontFamily:'var(--font-sans)',fontSize:'14px',outline:'none'}}
              placeholder="••••••••"
            />
          </div>
          {error && <div style={{fontSize:'12px',color:'var(--red)',marginBottom:'10px'}}>{error}</div>}
          <button 
            type="submit" disabled={loading}
            style={{width:'100%',padding:'13px',background:'var(--gold)',color:'#111',fontFamily:'var(--font-sans)',fontWeight:600,fontSize:'13px',letterSpacing:'.04em',border:'none',borderRadius:'6px',cursor:'pointer',opacity:loading?0.7:1}}
          >
            {loading ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>
        <div style={{marginTop:'18px',padding:'12px 14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'6px',fontSize:'12px',color:'var(--text3)',lineHeight:1.6}}>
          Demo: valfri e-post · lösenord <span style={{color:'var(--text2)',fontWeight:500}}>prolux2024</span>
        </div>
      </div>
    </div>
  )
}
