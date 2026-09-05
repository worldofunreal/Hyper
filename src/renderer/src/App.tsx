import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import LibraryScreen from './screens/Library'
import SocialScreen from './screens/Social'
import FeedScreen from './screens/Feed'
import AuthModal from './components/AuthModal'
import LegalModal from './components/LegalModal'
import LinkModal from './components/LinkModal'
import { wou } from './lib/wou'

type Tab = 'library' | 'social' | 'feed' | 'store'

export default function App() {
  const [tab, setTab] = useState<Tab>('library')
  const [user, setUser] = useState<any | null>(null)
  const [ready, setReady] = useState(false)
  const [legal, setLegal] = useState(false)
  const [link, setLink] = useState(false)

  useEffect(() => {
    let cancelled = false
    wou.hydrate()
      .catch(() => null)
      .then(u => { if (!cancelled) { setUser(u); setReady(true) } })
    const h = (e: any) => { setUser(e.detail?.user ?? null) }
    window.addEventListener('wou:auth', h as any)
    return () => { cancelled = true; window.removeEventListener('wou:auth', h as any) }
  }, [])

  if (!ready) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-[#0B0E13]">
        <div className="w-12 h-12 bg-gradient-to-b from-[#2D9CFF] to-[#0A48A0] border border-[#06294F] flex items-center justify-center text-white font-bold text-2xl" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>H</div>
        <div className="font-display font-semibold text-[20px] tracking-[0.2em] text-[#9EB3C8]">CONNECTING…</div>
      </div>
    )
  }

  // No session → only login.
  if (!user) {
    return (
      <div className="h-screen w-screen bnet-login-bg overflow-auto">
        <div className="absolute inset-0 bnet-grid pointer-events-none" />
        <div className="relative min-h-full flex flex-col lg:flex-row">
          <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 py-12 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-b from-[#2D9CFF] to-[#0A48A0] border border-[#06294F] flex items-center justify-center text-white font-bold text-2xl" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>H</div>
              <div className="font-display font-bold text-white tracking-wide leading-none" style={{ fontSize: 44 }}>HYPER</div>
            </div>
            <h1 className="font-display font-bold text-white leading-[0.95] mt-8" style={{ fontSize: 64 }}>EVERY WORLD.<br /><span className="text-[#F8B700]">ONE ACCOUNT.</span></h1>
            <p className="text-[14px] text-[#9EB3C8] mt-4 max-w-md leading-relaxed">Shadows of War, Cosmicrafts and NFTropoly behind a single sign-in.</p>
          </div>
          <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
            <AuthModal dismissable={false} onClose={() => {}} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex bg-[#0B0E13] text-[#D6E0EC] overflow-hidden">
      <Sidebar tab={tab} onTab={setTab} user={user} onAuth={() => {}} onLegal={() => setLegal(true)} onLink={() => setLink(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} onAuth={() => {}} tab={tab} />

        <main className="flex-1 overflow-hidden relative bg-[#0B0E13]">
          <div className="relative h-full overflow-auto">
            {tab === 'library' && <LibraryScreen />}
            {tab === 'social' && <SocialScreen user={user} />}
            {tab === 'feed' && <FeedScreen />}
            {tab === 'store' && (
              <div className="min-h-full flex items-center justify-center p-10">
                <div className="bnet-panel rounded-sm p-10 max-w-md w-full text-center">
                  <div className="font-display font-bold text-[36px] text-white tracking-wide mt-1">NFTROPOLY</div>
                  <button onClick={() => (window as any).hyper ? (window as any).hyper.openExternal('https://nftropoly.com') : window.open('https://nftropoly.com', '_blank')} className="btn-bnet-gold w-full py-2.5 font-bold text-[15px] mt-5">OPEN STORE</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      {legal && <LegalModal onClose={() => setLegal(false)} />}
      {link && <LinkModal onClose={() => setLink(false)} />}
    </div>
  )
}
