import { useEffect, useState } from 'react'
import { wou } from '../lib/wou'

export default function SocialScreen({ user }: { user: any }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [clans, setClans] = useState<any[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [newClan, setNewClan] = useState({ tag: '', name: '', desc: '' })

  useEffect(() => { wou.getClans(20).then(setClans).catch(() => {}) }, [])

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      try { setResults(await wou.searchPlayers(q, 8)) } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  async function createClan() {
    setErr(null)
    try { await wou.createClan(newClan.tag, newClan.name, newClan.desc); setNewClan({ tag: '', name: '', desc: '' }); setClans(await wou.getClans(20)) } catch (e: any) { setErr(e.message) }
  }

  return (
    <div className="h-full flex bg-[#0B0E13]">
      <aside className="w-[300px] bg-[#101722] border-r border-[#2A3546] p-4 hidden md:flex flex-col gap-5 shrink-0 overflow-auto">
        <div>
          <div className="bnet-eyebrow mb-2">Find players</div>
          <div className="bnet-inset rounded-sm flex items-center gap-2 px-3 py-2">
            <span className="text-[#5C6B80] text-xs">⌕</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Handle or name…" className="bg-transparent flex-1 text-[13px] placeholder-[#3D4A5E] focus:outline-none text-white" />
          </div>
          <div className="mt-2 space-y-1">
            {results.length === 0 ? <p className="text-[12px] text-[#5C6B80] px-1 py-2">{q.length < 2 ? 'Type 2+ characters.' : 'No players found.'}</p> : results.map(p => (
              <div key={p.id} className="flex items-center gap-2.5 p-2 hover:bg-[#1E2836] border border-transparent hover:border-[#2A3546] rounded-sm">
                <div className="w-8 h-8 bg-[#0E141D] border border-[#2A3546] flex items-center justify-center text-[11px] font-bold text-white overflow-hidden shrink-0">
                  {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : (p.display_name?.slice(0, 1) ?? '?').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-white truncate">{p.display_name} {p.clan_tag && <span className="text-[10px] font-mono text-[#F8B700]">[{p.clan_tag}]</span>}</div>
                  <div className="text-[11px] font-mono text-[#5C6B80] truncate">@{p.username}</div>
                </div>
                <button onClick={() => wou.follow(p.id).catch(e => setErr(e.message))} className="btn-bnet-ghost px-2.5 py-1 rounded-sm text-[11px] font-bold">Add</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bnet-eyebrow mb-2">Guilds</div>
          <div className="space-y-2">
            {clans.map(c => (
              <div key={c.tag} className="bnet-panel rounded-sm p-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-[#F8B700]/15 border border-[#F8B700]/40 text-[#F8B700] font-mono text-[10px] font-bold">[{c.tag}]</span>
                  <span className="text-[13px] font-semibold text-white truncate">{c.name}</span>
                  <span className="ml-auto text-[10px] font-mono text-[#5C6B80]">{c.member_count}</span>
                </div>
                <p className="text-[12px] text-[#9EB3C8] line-clamp-2 mt-1">{c.description || '—'}</p>
              </div>
            ))}
            {clans.length === 0 && <p className="text-[12px] text-[#5C6B80]">Empty.</p>}
          </div>

          <div className="mt-3 bnet-inset rounded-sm p-3 space-y-2">
            <div className="bnet-eyebrow">New guild</div>
            <input value={newClan.tag} onChange={e => setNewClan(s => ({ ...s, tag: e.target.value.toUpperCase() }))} placeholder="TAG (2-5)" maxLength={5} className="w-full px-3 py-1.5 bg-[#0B0E13] border border-[#2A3546] rounded-sm text-[12px] font-mono text-white focus:outline-none focus:border-[#F8B700]" />
            <input value={newClan.name} onChange={e => setNewClan(s => ({ ...s, name: e.target.value }))} placeholder="Guild name" className="w-full px-3 py-1.5 bg-[#0B0E13] border border-[#2A3546] rounded-sm text-[13px] text-white focus:outline-none focus:border-[#F8B700]" />
            <input value={newClan.desc} onChange={e => setNewClan(s => ({ ...s, desc: e.target.value }))} placeholder="Charter" className="w-full px-3 py-1.5 bg-[#0B0E13] border border-[#2A3546] rounded-sm text-[13px] text-white focus:outline-none focus:border-[#F8B700]" />
            {err && <div className="text-[11px] text-[#FF9B9B]">{err}</div>}
            <button disabled={!user} onClick={createClan} className="btn-bnet-blue w-full py-2 text-[13px] font-bold disabled:opacity-40">Create</button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0E13]">
        <div className="h-[52px] border-b border-[#2A3546] bg-[#101722] flex items-center px-5 gap-3">
          <span className="w-2 h-2 bg-[#00AE33] inline-block" />
          <span className="font-display font-semibold text-[18px] tracking-wide text-white uppercase">General</span>
          <span className="text-[12px] text-[#5C6B80]">General</span>
        </div>
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="max-w-md text-center bnet-panel rounded-sm p-8">
            <div className="font-display font-bold text-[28px] text-white tracking-wide">PARTY</div>
          </div>
        </div>
        <div className="p-3 border-t border-[#2A3546] bg-[#101722] flex gap-2">
          <input placeholder="Message" disabled className="flex-1 px-4 py-2.5 bnet-inset rounded-sm text-[13px] placeholder-[#3D4A5E] disabled:opacity-60" />
          <button disabled className="px-5 py-2.5 bg-[#1E2836] border border-[#2A3546] text-[#5C6B80] font-bold text-[13px] rounded-sm cursor-not-allowed">Send</button>
        </div>
      </div>
    </div>
  )
}
