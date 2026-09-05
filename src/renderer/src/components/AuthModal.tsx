import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { wou } from '../lib/wou'

const PROVIDERS = ['discord', 'google', 'twitter', 'meta'] as const

export default function AuthModal({ onClose, dismissable = true }: { onClose: () => void; dismissable?: boolean }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [qr, setQr] = useState<{ id: string; approve_url: string; secret: string; expires_in_seconds: number; notified?: string[] } | null>(null)
  const [qrLeft, setQrLeft] = useState(0)
  const [qrUser, setQrUser] = useState('')
  const pollRef = useRef<any>(null)

  function stopQr() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }
  useEffect(() => stopQr, [])

  async function startQr() {
    setErr(null)
    if (qr) { try { await wou.qrCancel(qr.id, qr.secret) } catch {} stopQr() }
    try {
      const q = await wou.startQr(qrUser.trim() || undefined)
      setQr(q)
      setQrLeft(q.expires_in_seconds)
      stopQr()
      pollRef.current = setInterval(async () => {
        try {
          const s = await wou.qrStatus(q.id, q.secret)
          if (s.status === 'approved' && s.session_token && s.account) {
            stopQr()
            await wou.persist(s.session_token, s.account)
            onClose()
          } else if (s.status === 'expired') {
            stopQr(); setQr(null); setErr('Code expired.')
          }
        } catch {}
        setQrLeft(v => (v > 0 ? v - 2 : 0))
      }, 2000)
    } catch (e: any) { setErr(e.message) }
  }
  async function cancelQr() {
    if (qr) { try { await wou.qrCancel(qr.id, qr.secret) } catch {} }
    stopQr(); setQr(null)
  }

  async function sendOtp() {
    setErr(null); setBusy(true)
    try { await wou.requestOtp(email, false); setStep('otp') } catch (e: any) { setErr(wou.describeOtpError ? wou.describeOtpError(e).message : e.message) } finally { setBusy(false) }
  }
  async function verify() {
    setErr(null); setBusy(true)
    try { await wou.verifyOtp(email, code); onClose() } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }
  async function oauth(p: typeof PROVIDERS[number]) {
    setErr(null); setBusy(true)
    try { await wou.loginWithOAuth(p); onClose() } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }

  const card = (
    <div className="w-full max-w-[400px] bnet-panel rounded-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#F8B700] via-[#FFD34D] to-[#F8B700]" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-b from-[#2D9CFF] to-[#0A48A0] border border-[#06294F] flex items-center justify-center text-white font-bold text-lg" style={{ clipPath: 'polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)' }}>H</div>
          <h2 className="font-display font-bold text-[26px] leading-none text-white tracking-wide">HYPER</h2>
          {dismissable && (
            <button onClick={onClose} className="ml-auto w-8 h-8 btn-bnet-ghost rounded-sm text-[#9EB3C8] hover:text-white">✕</button>
          )}
        </div>

        {err && <div className="mb-3 px-3 py-2.5 bg-[#C22F2F]/15 border border-[#C22F2F]/50 text-[#FF9B9B] text-[12px] rounded-sm">{err}</div>}

        <div className="bnet-inset rounded-sm p-3 mb-4 flex items-center gap-3">
          {qr ? (
            <>
              <div className="bg-white p-1.5 shrink-0">
                <QRCodeSVG value={qr.approve_url} size={84} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white">Scan to sign in</div>
                <div className="text-[11px] font-mono text-[#5C6B80]">{Math.floor(qrLeft / 60)}:{String(qrLeft % 60).padStart(2, '0')} left{qr.notified?.length ? ` · push: ${qr.notified.join(', ')}` : ''}</div>
                <button onClick={cancelQr} className="text-[12px] text-[#9EB3C8] hover:text-white mt-1">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-white">Scan to sign in</div>
                <input value={qrUser} onChange={e => setQrUser(e.target.value)} placeholder="@username for push (optional)" className="mt-1.5 w-full px-2.5 py-1.5 bnet-inset rounded-sm text-[12px] font-mono text-white placeholder-[#3D4A5E] focus:outline-none focus:border-[#0074E0]" />
              </div>
              <button onClick={startQr} className="btn-bnet-blue px-4 py-2 text-[12px] font-bold self-end">Show</button>
            </>
          )}
        </div>

        <div className="space-y-3">
          {step === 'email' ? (
            <>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full px-3.5 py-2.5 bnet-inset rounded-sm text-[14px] text-white placeholder-[#3D4A5E] focus:outline-none focus:border-[#0074E0]" />
              <button disabled={busy || !email} onClick={sendOtp} className="btn-bnet-blue w-full py-2.5 font-bold text-[14px] disabled:opacity-50">{busy ? 'Sending…' : 'Send code'}</button>
            </>
          ) : (
            <>
              <p className="text-[13px] text-[#9EB3C8] text-center">Code sent to <span className="text-white font-mono">{email}</span></p>
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="––––––" maxLength={6} className="w-full px-4 py-3 bnet-inset rounded-sm text-center tracking-[0.5em] font-mono text-xl text-white focus:outline-none focus:border-[#F8B700]" />
              <button disabled={busy || code.length !== 6} onClick={verify} className="btn-bnet-gold w-full py-2.5 font-bold text-[15px] disabled:opacity-50">{busy ? 'Verifying…' : 'Verify'}</button>
              <button onClick={() => setStep('email')} className="w-full text-[12px] text-[#9EB3C8] hover:text-white">← Change email</button>
            </>
          )}
        </div>

        <div className="bnet-divider my-4" />

        <div className="space-y-2">
          {PROVIDERS.map(p => (
            <button key={p} onClick={() => oauth(p)} disabled={busy} className="btn-bnet-ghost w-full py-2.5 rounded-sm text-[13px] font-semibold capitalize disabled:opacity-50">
              {busy ? 'Opening…' : `Continue with ${p}`}
            </button>
          ))}
        </div>

        <div className="bnet-divider my-4" />

        <div className="space-y-2">
          <button onClick={async () => { try { await wou.loginWithSolana(); onClose() } catch (e: any) { setErr(e.message) } }} className="btn-bnet-ghost w-full py-2.5 rounded-sm text-[13px] font-semibold">Phantom</button>
          <button onClick={async () => { try { await wou.loginWithEthereum(); onClose() } catch (e: any) { setErr(e.message) } }} className="btn-bnet-ghost w-full py-2.5 rounded-sm text-[13px] font-semibold">MetaMask</button>
          <button onClick={async () => { try { await wou.loginWithInternetIdentity(); onClose() } catch (e: any) { setErr(e.message) } }} className="btn-bnet-ghost w-full py-2.5 rounded-sm text-[13px] font-semibold">Internet Identity</button>
        </div>
      </div>
    </div>
  )

  if (!dismissable) return card
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {card}
    </div>
  )
}
