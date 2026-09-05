import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { wou } from '../lib/wou';
function open(url) {
    const h = window.hyper;
    if (h?.openExternal)
        h.openExternal(url);
    else
        window.open(url, '_blank');
}
export default function LinkModal({ onClose }) {
    const [code, setCode] = useState(null);
    const [linked, setLinked] = useState({ telegram: false, discord: false, telegram_ids: [], discord_ids: [] });
    const [err, setErr] = useState(null);
    function refresh() { wou.botLinked().then(setLinked).catch(() => { }); }
    useEffect(refresh, []);
    async function mint() {
        setErr(null);
        try {
            setCode((await wou.botLinkStart()).code);
        }
        catch (e) {
            setErr(e.message);
        }
    }
    async function unlink(ns, id) {
        setErr(null);
        try {
            await wou.botUnlink(ns, id);
            refresh();
        }
        catch (e) {
            setErr(e.message);
        }
    }
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm", children: _jsxs("div", { className: "w-full max-w-[400px] bnet-panel rounded-sm overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-[#F8B700] via-[#FFD34D] to-[#F8B700]" }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("h2", { className: "font-display font-bold text-[24px] text-white tracking-wide", children: "DEVICES" }), _jsx("button", { onClick: onClose, className: "ml-auto w-8 h-8 btn-bnet-ghost rounded-sm text-[#9EB3C8] hover:text-white", children: "\u2715" })] }), err && _jsx("div", { className: "mb-3 px-3 py-2.5 bg-[#C22F2F]/15 border border-[#C22F2F]/50 text-[#FF9B9B] text-[12px] rounded-sm", children: err }), _jsxs("div", { className: "space-y-2 text-[13px]", children: [_jsxs("div", { className: "bnet-inset rounded-sm px-3 py-2.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-semibold text-white flex-1", children: "Telegram" }), _jsx("span", { className: "text-[11px] font-mono text-[#5C6B80]", children: linked.telegram ? '● linked' : '○' })] }), linked.telegram_ids.map(id => (_jsxs("div", { className: "flex items-center gap-2 mt-1.5", children: [_jsxs("span", { className: "font-mono text-[11px] text-[#5C6B80] flex-1 truncate", children: ["chat ", id.slice(0, 4), "\u2026", id.slice(-3)] }), _jsx("button", { onClick: () => unlink('tg', id), className: "text-[11px] text-[#FF9B9B] hover:text-white", children: "Remove" })] }, id)))] }), _jsxs("div", { className: "bnet-inset rounded-sm px-3 py-2.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-semibold text-white flex-1", children: "Discord" }), _jsx("span", { className: "text-[11px] font-mono text-[#5C6B80]", children: linked.discord ? '● linked' : '○' })] }), linked.discord_ids.map(id => (_jsxs("div", { className: "flex items-center gap-2 mt-1.5", children: [_jsxs("span", { className: "font-mono text-[11px] text-[#5C6B80] flex-1 truncate", children: ["user \u2026", id.slice(-4)] }), _jsx("button", { onClick: () => unlink('dc', id), className: "text-[11px] text-[#FF9B9B] hover:text-white", children: "Remove" })] }, id)))] })] }), code ? (_jsxs("div", { className: "mt-4 bnet-inset rounded-sm p-4 text-center", children: [_jsx("div", { className: "font-mono font-bold text-[28px] tracking-[0.2em] text-[#F8B700]", children: code }), _jsxs("p", { className: "text-[12px] text-[#9EB3C8] mt-2", children: ["Telegram: send ", _jsxs("span", { className: "font-mono text-white", children: ["/link ", code] }), " to @WorldofUnreal_bot", _jsx("br", {}), "Discord: ", _jsxs("span", { className: "font-mono text-white", children: ["/link ", code] })] }), _jsx("p", { className: "text-[11px] font-mono text-[#5C6B80] mt-1", children: "10 minutes, one use" })] })) : (_jsx("button", { onClick: mint, className: "btn-bnet-blue w-full py-2.5 font-bold text-[13px] mt-4", children: "Get link code" })), _jsx("button", { onClick: () => open('https://discord.com/oauth2/authorize?client_id=1539889954530787359'), className: "w-full text-[12px] text-[#9EB3C8] hover:text-white mt-3", children: "Add the Discord app \u2192" })] })] }) }));
}
