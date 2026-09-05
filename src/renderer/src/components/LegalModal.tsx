const REPO = 'https://github.com/worldofunreal/Hyper'

function open(url: string) {
  const h = (window as any).hyper
  if (h?.openExternal) h.openExternal(url)
  else window.open(url, '_blank')
}

export default function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-[440px] bnet-panel rounded-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#F8B700] via-[#FFD34D] to-[#F8B700]" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display font-bold text-[24px] text-white tracking-wide">LEGAL</h2>
            <button onClick={onClose} className="ml-auto w-8 h-8 btn-bnet-ghost rounded-sm text-[#9EB3C8] hover:text-white">✕</button>
          </div>
          <div className="space-y-2 text-[13px] text-[#9EB3C8]">
            <p>© 2024–2026 World of Unreal. MIT License.</p>
            <p>Hyper is an original work. Not affiliated with or endorsed by any sign-in provider. All third-party marks belong to their owners.</p>
          </div>
          <div className="bnet-divider my-4" />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => open('https://worldofunreal.com/privacy')} className="btn-bnet-ghost py-2 rounded-sm text-[12px] font-bold">Privacy</button>
            <button onClick={() => open('https://worldofunreal.com/terms')} className="btn-bnet-ghost py-2 rounded-sm text-[12px] font-bold">Terms</button>
            <button onClick={() => open(`${REPO}/blob/main/docs/legal/NOTICE`)} className="btn-bnet-ghost py-2 rounded-sm text-[12px] font-bold">Notices</button>
            <button onClick={() => open(REPO)} className="btn-bnet-ghost py-2 rounded-sm text-[12px] font-bold">Source</button>
          </div>
          <p className="text-[11px] font-mono text-[#5C6B80] text-center mt-4">Rights & deletion: privacy@worldofunreal.com</p>
        </div>
      </div>
    </div>
  )
}
