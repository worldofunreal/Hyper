import { useEffect, useState } from 'react'
import { wou } from '../lib/wou'

export default function FeedScreen() {
  const [feed, setFeed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    wou.getFeed(30).then(setFeed).finally(() => setLoading(false))
    const t = setInterval(() => wou.getFeed(30).then(setFeed).catch(() => {}), 8000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-full bg-[#0B0E13]">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="font-display font-bold text-[26px] tracking-wide text-white">NEWS</h1>
          <div className="bnet-divider flex-1" />
        </div>
        {loading ? <div className="text-[13px] text-[#5C6B80]">Loading…</div> : feed.length === 0 ? (
          <div className="bnet-panel rounded-sm p-10 text-center">
            <div className="font-display font-bold text-[22px] text-white tracking-wide">EMPTY</div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {feed.map((a: any) => (
              <div key={a.id} className="bnet-panel rounded-sm p-4 flex gap-3">
                <div className="w-10 h-10 bg-[#0E141D] border border-[#2A3546] flex items-center justify-center text-base text-[#F8B700] shrink-0 overflow-hidden">
                  {a.avatar_url ? <img src={a.avatar_url} className="w-full h-full object-cover" /> : '✦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-white truncate">{a.title}</span>
                    <span className="ml-auto px-1.5 py-0.5 bg-[#0E141D] border border-[#2A3546] text-[10px] font-mono text-[#9EB3C8]">{a.game ?? '—'}</span>
                  </div>
                  <p className="text-[12px] text-[#9EB3C8] mt-1">{a.description}</p>
                  <div className="text-[11px] font-mono text-[#5C6B80] mt-1.5">@{a.username} • {a.activity_type} • {new Date((a.timestamp ?? 0) * 1000).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
