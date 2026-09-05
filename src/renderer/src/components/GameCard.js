import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const ART = {
    'shadows-of-war': { bg: 'linear-gradient(135deg,#1B3A5C 0%,#0B1D33 60%,#070D16 100%)', glyph: '⚔' },
    'cosmicrafts': { bg: 'linear-gradient(135deg,#2A1B5C 0%,#141033 60%,#0A0816 100%)', glyph: '✦' },
    'nftropoly': { bg: 'linear-gradient(135deg,#1B5C43 0%,#0E3325 60%,#07140E 100%)', glyph: '⬣' },
};
export default function GameCard({ slug, title, subtitle, description, storeUrl }) {
    const [local, setLocal] = useState(null);
    const [remote, setRemote] = useState(null);
    const [status, setStatus] = useState('idle');
    const [pct, setPct] = useState(0);
    const [msg, setMsg] = useState('');
    const art = ART[slug] ?? { bg: 'linear-gradient(135deg,#22303F,#0B0E13)', glyph: '▦' };
    async function refresh() {
        if (!window.hyper) {
            setStatus('web');
            return;
        }
        try {
            const r = await window.hyper.checkGame(slug);
            setLocal(r.local);
            setRemote(r.remote);
            if (r.error) {
                setMsg(r.error);
                setStatus('idle');
            }
            else if (r.update)
                setStatus('update');
            else
                setStatus(r.local?.version !== '0.0.0' ? 'ready' : 'install');
        }
        catch (e) {
            setMsg(e.message);
            setStatus('idle');
        }
    }
    useEffect(() => {
        refresh();
        if (!window.hyper)
            return;
        const off1 = window.hyper.onLauncherProgress((d) => { if (d.slug === slug)
            setPct(d.pct); });
        const off2 = window.hyper.onLauncherStatus((d) => { if (d.slug === slug) {
            setMsg(d.message);
            setStatus(d.status);
        } });
        return () => { off1(); off2(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);
    async function handleAction() {
        if (!window.hyper || status === 'web')
            return window.open(storeUrl, '_blank');
        if (status === 'ready') {
            setMsg('Launching…');
            try {
                await window.hyper.launchGame(slug);
                setMsg('Running');
            }
            catch (e) {
                setMsg(e.message);
            }
        }
        else {
            setStatus('downloading');
            try {
                await window.hyper.updateGame(slug);
                await refresh();
            }
            catch (e) {
                setMsg(e.message);
                setStatus('idle');
            }
        }
    }
    const isReady = status === 'ready';
    const actionLabel = isReady ? 'PLAY' : status === 'update' ? 'UPDATE' : status === 'downloading' ? `WORKING ${pct.toFixed(0)}%` : status === 'web' ? 'PLAY IN BROWSER' : 'INSTALL';
    return (_jsxs("div", { className: "bnet-panel rounded-sm overflow-hidden flex", children: [_jsx("div", { className: "w-[104px] shrink-0 flex items-center justify-center text-[40px] text-white/80 border-r border-[#2A3546]", style: { background: art.bg }, children: art.glyph }), _jsxs("div", { className: "flex-1 min-w-0 p-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-widest border ${isReady ? 'border-[#00AE33]/50 text-[#4ADE80]' : 'border-[#2A3546] text-[#9EB3C8]'}`, children: subtitle }), _jsxs("span", { className: "ml-auto text-[11px] font-mono text-[#5C6B80]", children: ["v", local?.version ?? '—', remote ? ` → ${remote.version}` : ''] })] }), _jsx("h3", { className: "font-display font-bold text-[24px] leading-tight text-white tracking-wide mt-1", children: title.toUpperCase() }), _jsx("p", { className: "text-[12px] text-[#9EB3C8] mt-0.5 line-clamp-2", children: description }), msg && _jsx("div", { className: "text-[11px] font-mono text-[#00AEFF] mt-1 truncate", children: msg }), status === 'downloading' && (_jsx("div", { className: "mt-2 h-[6px] bg-[#0E141D] border border-[#2A3546] overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-[#0074E0] to-[#00AEFF] transition-all", style: { width: `${pct}%` } }) })), _jsxs("div", { className: "flex gap-2 mt-3", children: [_jsx("button", { onClick: handleAction, className: `${isReady || status === 'web' ? 'btn-bnet-gold' : 'btn-bnet-blue'} flex-1 py-2 font-bold text-[14px] tracking-wide`, children: actionLabel }), window.hyper && (_jsx("button", { onClick: () => window.hyper?.openGameFolder(slug), title: "Open install folder", className: "btn-bnet-ghost px-3.5 py-2 text-[12px] font-semibold rounded-sm", children: "Files" })), storeUrl && _jsx("button", { onClick: () => window.hyper ? window.hyper.openExternal(storeUrl) : window.open(storeUrl, '_blank'), className: "btn-bnet-ghost px-3.5 py-2 text-[12px] font-semibold rounded-sm", children: "Site \u2197" })] })] })] }));
}
