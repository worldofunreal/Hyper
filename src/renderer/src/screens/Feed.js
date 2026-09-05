import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { wou } from '../lib/wou';
export default function FeedScreen() {
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        wou.getFeed(30).then(setFeed).finally(() => setLoading(false));
        const t = setInterval(() => wou.getFeed(30).then(setFeed).catch(() => { }), 8000);
        return () => clearInterval(t);
    }, []);
    return (_jsx("div", { className: "min-h-full bg-[#0B0E13]", children: _jsxs("div", { className: "max-w-3xl mx-auto px-6 py-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("h1", { className: "font-display font-bold text-[26px] tracking-wide text-white", children: "NEWS" }), _jsx("div", { className: "bnet-divider flex-1" })] }), loading ? _jsx("div", { className: "text-[13px] text-[#5C6B80]", children: "Loading\u2026" }) : feed.length === 0 ? (_jsx("div", { className: "bnet-panel rounded-sm p-10 text-center", children: _jsx("div", { className: "font-display font-bold text-[22px] text-white tracking-wide", children: "EMPTY" }) })) : (_jsx("div", { className: "space-y-2.5", children: feed.map((a) => (_jsxs("div", { className: "bnet-panel rounded-sm p-4 flex gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-[#0E141D] border border-[#2A3546] flex items-center justify-center text-base text-[#F8B700] shrink-0 overflow-hidden", children: a.avatar_url ? _jsx("img", { src: a.avatar_url, className: "w-full h-full object-cover" }) : '✦' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-[14px] font-semibold text-white truncate", children: a.title }), _jsx("span", { className: "ml-auto px-1.5 py-0.5 bg-[#0E141D] border border-[#2A3546] text-[10px] font-mono text-[#9EB3C8]", children: a.game ?? '—' })] }), _jsx("p", { className: "text-[12px] text-[#9EB3C8] mt-1", children: a.description }), _jsxs("div", { className: "text-[11px] font-mono text-[#5C6B80] mt-1.5", children: ["@", a.username, " \u2022 ", a.activity_type, " \u2022 ", new Date((a.timestamp ?? 0) * 1000).toLocaleTimeString()] })] })] }, a.id))) }))] }) }));
}
