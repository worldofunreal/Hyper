import { wou } from '../lib/wou'

const TITLES: Record<string, string> = {
  library: 'Games',
  social: 'Social',
  feed: 'News',
  store: 'Shop',
}

export default function TopBar({ user, tab }: { user: any; onAuth: () => void; tab?: string }) {
  return (
    <header className="h-[56px] bg-[#101722]/95 backdrop-blur border-b border-[#2A3546] flex items-center px-5 gap-4 shrink-0">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-[#5C6B80] font-semibold">Hyper</span>
        <span className="text-[#3D4A5E]">/</span>
        <span className="font-display font-semibold text-[18px] tracking-wide text-white uppercase">{TITLES[tab ?? 'library'] ?? 'Games'}</span>
      </div>
      <div className="flex-1" />
      <div className="hidden md:flex items-center gap-2 bnet-inset rounded-sm px-3 py-1.5 w-[280px]">
        <span className="text-[#5C6B80] text-xs">⌕</span>
        <input placeholder="Search" className="bg-transparent flex-1 text-[13px] placeholder-[#5C6B80] focus:outline-none text-[#D6E0EC]" />
      </div>
      {user ? (
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-[13px] font-semibold text-white leading-tight">{user.display_name || user.username}</div>
            <div className="text-[11px] font-mono text-[#9EB3C8] leading-tight">@{user.username}</div>
          </div>
          <button onClick={() => wou.clear()} className="btn-bnet-ghost px-3.5 py-1.5 rounded-sm text-[12px] font-semibold">Log out</button>
        </div>
      ) : null}
    </header>
  )
}
