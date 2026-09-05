import GameCard from '../components/GameCard'

export default function LibraryScreen() {
  return (
    <div className="min-h-full bg-[#0B0E13]">
      <div className="relative overflow-hidden border-b border-[#2A3546]" style={{ background: 'linear-gradient(120deg,#12304F 0%,#0B1D33 45%,#070D16 100%)' }}>
        <div className="absolute inset-0 bnet-grid opacity-60" />
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-10 flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="flex-1">
            <div className="bnet-eyebrow">Season live</div>
            <h1 className="font-display font-bold text-white tracking-wide leading-[0.95] mt-2" style={{ fontSize: 56 }}>SHADOWS<br />OF WAR</h1>
            <p className="text-[13px] text-[#9EB3C8] mt-2 max-w-xl">Territorial war on real world maps.</p>
            <div className="flex items-center gap-3 mt-4">
              <span className="px-2 py-1 text-[10px] font-mono font-bold tracking-widest bg-[#00AE33]/15 border border-[#00AE33]/40 text-[#4ADE80]">● 3 ONLINE</span>
            </div>
          </div>
          <div className="bnet-panel rounded-sm p-4 w-full sm:w-[300px] shrink-0">
            <div className="bnet-eyebrow">Collection</div>
            <div className="font-display font-bold text-[40px] text-white leading-none mt-1">03<span className="text-[#5C6B80] text-[20px]"> / 03</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display font-bold text-[22px] tracking-wide text-white">ALL GAMES</h2>
          <div className="bnet-divider flex-1" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <GameCard
            slug="shadows-of-war"
            title="Shadows of War"
            subtitle="RTS • LIVE"
            description="Territorial RTS."
            storeUrl="https://shadowsofwar.io"
          />
          <GameCard
            slug="cosmicrafts"
            title="Cosmicrafts"
            subtitle="SPACE • BETA"
            description="Fleet battles."
            storeUrl="https://cosmicrafts.com"
          />
          <GameCard
            slug="nftropoly"
            title="NFTropoly"
            subtitle="STORE • LIVE"
            description="Assets & collectibles."
            storeUrl="https://nftropoly.com"
          />
        </div>
      </div>
    </div>
  )
}
