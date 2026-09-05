import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { wou } from '../lib/wou';
const TITLES = {
    library: 'Games',
    social: 'Social',
    feed: 'News',
    store: 'Shop',
};
export default function TopBar({ user, tab }) {
    return (_jsxs("header", { className: "h-[56px] bg-[#101722]/95 backdrop-blur border-b border-[#2A3546] flex items-center px-5 gap-4 shrink-0", children: [_jsxs("div", { className: "flex items-center gap-2 text-[13px]", children: [_jsx("span", { className: "text-[#5C6B80] font-semibold", children: "Hyper" }), _jsx("span", { className: "text-[#3D4A5E]", children: "/" }), _jsx("span", { className: "font-display font-semibold text-[18px] tracking-wide text-white uppercase", children: TITLES[tab ?? 'library'] ?? 'Games' })] }), _jsx("div", { className: "flex-1" }), _jsxs("div", { className: "hidden md:flex items-center gap-2 bnet-inset rounded-sm px-3 py-1.5 w-[280px]", children: [_jsx("span", { className: "text-[#5C6B80] text-xs", children: "\u2315" }), _jsx("input", { placeholder: "Search", className: "bg-transparent flex-1 text-[13px] placeholder-[#5C6B80] focus:outline-none text-[#D6E0EC]" })] }), user ? (_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "hidden sm:block text-right", children: [_jsx("div", { className: "text-[13px] font-semibold text-white leading-tight", children: user.display_name || user.username }), _jsxs("div", { className: "text-[11px] font-mono text-[#9EB3C8] leading-tight", children: ["@", user.username] })] }), _jsx("button", { onClick: () => wou.clear(), className: "btn-bnet-ghost px-3.5 py-1.5 rounded-sm text-[12px] font-semibold", children: "Log out" })] })) : null] }));
}
