import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LibraryScreen from './screens/Library';
import SocialScreen from './screens/Social';
import FeedScreen from './screens/Feed';
import AuthModal from './components/AuthModal';
import LegalModal from './components/LegalModal';
import LinkModal from './components/LinkModal';
import { wou } from './lib/wou';
export default function App() {
    const [tab, setTab] = useState('library');
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);
    const [legal, setLegal] = useState(false);
    const [link, setLink] = useState(false);
    useEffect(() => {
        let cancelled = false;
        wou.hydrate()
            .catch(() => null)
            .then(u => { if (!cancelled) {
            setUser(u);
            setReady(true);
        } });
        const h = (e) => { setUser(e.detail?.user ?? null); };
        window.addEventListener('wou:auth', h);
        return () => { cancelled = true; window.removeEventListener('wou:auth', h); };
    }, []);
    if (!ready) {
        return (_jsxs("div", { className: "h-screen w-screen flex flex-col items-center justify-center gap-4 bg-[#0B0E13]", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-b from-[#2D9CFF] to-[#0A48A0] border border-[#06294F] flex items-center justify-center text-white font-bold text-2xl", style: { clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }, children: "H" }), _jsx("div", { className: "font-display font-semibold text-[20px] tracking-[0.2em] text-[#9EB3C8]", children: "CONNECTING\u2026" })] }));
    }
    // No session → only login.
    if (!user) {
        return (_jsxs("div", { className: "h-screen w-screen bnet-login-bg overflow-auto", children: [_jsx("div", { className: "absolute inset-0 bnet-grid pointer-events-none" }), _jsxs("div", { className: "relative min-h-full flex flex-col lg:flex-row", children: [_jsxs("div", { className: "flex-1 flex flex-col justify-center px-8 sm:px-16 py-12 max-w-2xl", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-b from-[#2D9CFF] to-[#0A48A0] border border-[#06294F] flex items-center justify-center text-white font-bold text-2xl", style: { clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }, children: "H" }), _jsx("div", { className: "font-display font-bold text-white tracking-wide leading-none", style: { fontSize: 44 }, children: "HYPER" })] }), _jsxs("h1", { className: "font-display font-bold text-white leading-[0.95] mt-8", style: { fontSize: 64 }, children: ["EVERY WORLD.", _jsx("br", {}), _jsx("span", { className: "text-[#F8B700]", children: "ONE ACCOUNT." })] }), _jsx("p", { className: "text-[14px] text-[#9EB3C8] mt-4 max-w-md leading-relaxed", children: "Shadows of War, Cosmicrafts and NFTropoly behind a single sign-in." })] }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6 sm:p-12", children: _jsx(AuthModal, { dismissable: false, onClose: () => { } }) })] })] }));
    }
    return (_jsxs("div", { className: "h-screen w-screen flex bg-[#0B0E13] text-[#D6E0EC] overflow-hidden", children: [_jsx(Sidebar, { tab: tab, onTab: setTab, user: user, onAuth: () => { }, onLegal: () => setLegal(true), onLink: () => setLink(true) }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsx(TopBar, { user: user, onAuth: () => { }, tab: tab }), _jsx("main", { className: "flex-1 overflow-hidden relative bg-[#0B0E13]", children: _jsxs("div", { className: "relative h-full overflow-auto", children: [tab === 'library' && _jsx(LibraryScreen, {}), tab === 'social' && _jsx(SocialScreen, { user: user }), tab === 'feed' && _jsx(FeedScreen, {}), tab === 'store' && (_jsx("div", { className: "min-h-full flex items-center justify-center p-10", children: _jsxs("div", { className: "bnet-panel rounded-sm p-10 max-w-md w-full text-center", children: [_jsx("div", { className: "font-display font-bold text-[36px] text-white tracking-wide mt-1", children: "NFTROPOLY" }), _jsx("button", { onClick: () => window.hyper ? window.hyper.openExternal('https://nftropoly.com') : window.open('https://nftropoly.com', '_blank'), className: "btn-bnet-gold w-full py-2.5 font-bold text-[15px] mt-5", children: "OPEN STORE" })] }) }))] }) })] }), legal && _jsx(LegalModal, { onClose: () => setLegal(false) }), link && _jsx(LinkModal, { onClose: () => setLink(false) })] }));
}
