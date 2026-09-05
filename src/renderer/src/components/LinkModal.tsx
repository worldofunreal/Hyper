import { useEffect, useState } from 'react'
import { wou } from '../lib/wou'

function open(url: string) {
  const h = (window as any).hyper
  if (h?.openExternal) h.openExternal(url)
  else window.open(url, '_blank')
}

type Links = { telegram: boolean; discord: boolean; telegram_ids: string[]; discord_ids: string[] }

export default function LinkModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState<string | null>(null)
  const [linked, setLinked] = useState<Links>({ telegram: false, discord: false, telegram_ids: [], discord_ids: [] })
  const [err, setErr] = useState<string | null>(null)

  function refresh() { wou.botLinked().then(setLinked).catch(() => {}) }
  useEffect(refresh, [])

  async function mint() {
    setErr(null)
    try { setCode((await wou.botLinkStart()).code) } catch (e: any) { setErr(e.message) }
  }
  async function unlink(ns: 'tg' | 'dc', id: string) {
    setErr(null)
    try { await wou.botUnlink(ns, id); refresh() } catch (e: any) { setErr(e.message) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-[400px] bnet-panel rounded-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#F8B700] via-[#FFD34D] to-[#F8B700]" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display font-bold text-[24px] text-white tracking-wide">DEVICES</h2>
            <button onClick={onClose} className="ml-auto w-8 h-8 btn-bnet-ghost rounded-sm text-[#9EB3C8] hover:text-white">✕</button>
          </div>
          {err && <div className="mb-3 px-3 py-2.5 bg-[#C22F2F]/15 border border-[#C22F2F]/50 text-[#FF9B9B] text-[12px] rounded-sm">{err}</div>}
          <div className="space-y-2 text-[13px]">
            <div className="bnet-inset rounded-sm px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white flex-1">Telegram</span>
                <span className="text-[11px] font-mono text-[#5C6B80]">{linked.telegram ? '● linked' : '○'}</span>
              </div>
              {linked.telegram_ids.map(id => (
                <div key={id} className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono text-[11px] text-[#5C6B80] flex-1 truncate">chat {id.slice(0, 4)}…{id.slice(-3)}</span>
                  <button onClick={() => unlink('tg', id)} className="text-[11px] text-[#FF9B9B] hover:text-white">Remove</button>
                </div>
              ))}
            </div>
            <div className="bnet-inset rounded-sm px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white flex-1">Discord</span>
                <span className="text-[11px] font-mono text-[#5C6B80]">{linked.discord ? '● linked' : '○'}</span>
              </div>
              {linked.discord_ids.map(id => (
                <div key={id} className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono text-[11px] text-[#5C6B80] flex-1 truncate">user …{id.slice(-4)}</span>
                  <button onClick={() => unlink('dc', id)} className="text-[11px] text-[#FF9B9B] hover:text-white">Remove</button>
                </div>
              ))}
            </div>
          </div>
          {code ? (
            <div className="mt-4 bnet-inset rounded-sm p-4 text-center">
              <div className="font-mono font-bold text-[28px] tracking-[0.2em] text-[#F8B700]">{code}</div>
              <p className="text-[12px] text-[#9EB3C8] mt-2">Telegram: send <span className="font-mono text-white">/link {code}</span> to @WorldofUnreal_bot<br />Discord: <span className="font-mono text-white">/link {code}</span></p>
              <p className="text-[11px] font-mono text-[#5C6B80] mt-1">10 minutes, one use</p>
            </div>
          ) : (
            <button onClick={mint} className="btn-bnet-blue w-full py-2.5 font-bold text-[13px] mt-4">Get link code</button>
          )}
          <button onClick={() => open('https://discord.com/oauth2/authorize?client_id=1539889954530787359')} className="w-full text-[12px] text-[#9EB3C8] hover:text-white mt-3">Add the Discord app →</button>
        </div>
      </div>
    </div>
  )
}
