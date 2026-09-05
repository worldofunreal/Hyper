type Props = { tab: string; onTab: (t: any) => void; user: any; onAuth: () => void; onLegal: () => void; onLink: () => void }

const GAMES = [
  { slug: 'shadows-of-war', name: 'Shadows of War', tag: 'SOW', live: true },
  { slug: 'cosmicrafts', name: 'Cosmicrafts', tag: 'CC', live: true },
  { slug: 'nftropoly', name: 'NFTropoly', tag: 'NFTP', live: false },
]

const SECTIONS = [
  { id: 'library', label: 'Games', icon: '▦' },
  { id: 'social', label: 'Social', icon: '♦' },
  { id: 'feed', label: 'News', icon: '≋' },
  { id: 'store', label: 'Shop', icon: '⬣' },
]

export default function Sidebar({ tab, onTab, user, onLegal, onLink }: Props) {
  return (
    <aside className="w-[232px] bg-[#101722] border-r border-[#2A3546] flex flex-col shrink-0">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-b from-[#2D9CFF] to-[#0A48A0] border border-[#06294F] flex items-center justify-center font-display font-800 text-lg text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]" style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
            <span className="font-bold">H</span>
          </div>
          <div className="font-display font-bold text-[22px] leading-none tracking-wide text-white">HYPER</div>
        </div>
      </div>

      <div className="bnet-divider mx-3" />

      <div className="px-3 pt-3">
        <div className="bnet-eyebrow px-2 mb-1.5">Games</div>
        <div className="space-y-1">
          {GAMES.map(g => (
            <button key={g.slug} onClick={() => onTab('library')} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-left hover:bg-[#1E2836] group border border-transparent hover:border-[#2A3546]">
              <span className="w-8 h-8 bg-[#0E141D] border border-[#2A3546] flex items-center justify-center text-[11px] font-mono font-bold text-[#9EB3C8] group-hover:text-white group-hover:border-[#0074E0]">{g.tag.slice(0, 2)}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-[#D6E0EC] truncate">{g.name}</span>
                <span className="block text-[10px] font-mono text-[#5C6B80]">{g.live ? '● LIVE' : '○ SOON'}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-4">
        <div className="bnet-eyebrow px-2 mb-1.5">Menu</div>
        <div className="space-y-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => onTab(s.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 text-[13px] font-semibold border-l-2 ${tab === s.id ? 'bg-[#1E2836] border-[#F8B700] text-white' : 'border-transparent text-[#9EB3C8] hover:text-white hover:bg-[#151D27]'}`}
            >
              <span className="w-5 text-center text-[13px]">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <div className="bnet-divider mx-3" />
      <div className="p-3">
        {user ? (
          <>
            <div className="bnet-panel rounded-sm p-2.5 flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#0E141D] border border-[#F8B700]/40 flex items-center justify-center text-sm font-bold text-[#F8B700] overflow-hidden shrink-0">
                {user.profile?.avatar_url ? <img src={user.profile.avatar_url} className="w-full h-full object-cover" /> : (user.display_name || user.username || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white truncate">{user.display_name || user.username}</div>
                <div className="text-[11px] font-mono text-[#00AE33]">● Online</div>
              </div>
            </div>
            <button onClick={onLink} className="w-full mt-2 py-1.5 btn-bnet-ghost rounded-sm text-[11px] font-bold">Link devices</button>
          </>
        ) : (
          <div className="text-[11px] font-mono text-[#5C6B80] px-1">Not signed in</div>
        )}
        <button onClick={onLegal} className="text-[10px] font-mono text-[#3D4A5E] hover:text-[#9EB3C8] mt-2 px-1">Hyper 2.0 — Legal</button>
      </div>
    </aside>
  )
}
