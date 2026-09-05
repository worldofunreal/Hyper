import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { wou } from '../lib/wou';
const PROVIDERS = ['discord', 'google', 'twitter', 'meta'];
export default function AuthModal({ onClose, dismissable = true }) {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState('email');
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);
    const [qr, setQr] = useState(null);
    const [qrLeft, setQrLeft] = useState(0);
    const [qrUser, setQrUser] = useState('');
    const pollRef = useRef(null);
    function stopQr() {
        if (pollRef.current)
            clearInterval(pollRef.current);
        pollRef.current = null;
    }
    useEffect(() => stopQr, []);
    async function startQr() {
        setErr(null);
        if (qr) {
            try {
                await wou.qrCancel(qr.id, qr.secret);
            }
            catch { }
            stopQr();
        }
        try {
            const q = await wou.startQr(qrUser.trim() || undefined);
            setQr(q);
            setQrLeft(q.expires_in_seconds);
            stopQr();
            pollRef.current = setInterval(async () => {
                try {
                    const s = await wou.qrStatus(q.id, q.secret);
                    if (s.status === 'approved' && s.session_token && s.account) {
                        stopQr();
                        await wou.persist(s.session_token, s.account);
                        onClose();
                    }
                    else if (s.status === 'expired') {
                        stopQr();
                        setQr(null);
                        setErr('Code expired.');
                    }
                }
                catch { }
                setQrLeft(v => (v > 0 ? v - 2 : 0));
            }, 2000);
        }
        catch (e) {
            setErr(e.message);
        }
    }
    async function cancelQr() {
        if (qr) {
            try {
                await wou.qrCancel(qr.id, qr.secret);
            }
            catch { }
        }
        stopQr();
        setQr(null);
    }
    async function sendOtp() {
        setErr(null);
        setBusy(true);
        try {
            await wou.requestOtp(email);
            setStep('otp');
        }
        catch (e) {
            setErr(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    async function verify() {
        setErr(null);
        setBusy(true);
        try {
            await wou.verifyOtp(email, code);
            onClose();
        }
        catch (e) {
            setErr(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    async function oauth(p) {
        setErr(null);
        setBusy(true);
        try {
            await wou.loginWithOAuth(p);
            onClose();
        }
        catch (e) {
            setErr(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    const card = (_jsxs("div", { className: "w-full max-w-[400px] bnet-panel rounded-sm overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-[#F8B700] via-[#FFD34D] to-[#F8B700]" }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-b from-[#2D9CFF] to-[#0A48A0] border border-[#06294F] flex items-center justify-center text-white font-bold text-lg", style: { clipPath: 'polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)' }, children: "H" }), _jsx("h2", { className: "font-display font-bold text-[26px] leading-none text-white tracking-wide", children: "HYPER" }), dismissable && (_jsx("button", { onClick: onClose, className: "ml-auto w-8 h-8 btn-bnet-ghost rounded-sm text-[#9EB3C8] hover:text-white", children: "\u2715" }))] }), err && _jsx("div", { className: "mb-3 px-3 py-2.5 bg-[#C22F2F]/15 border border-[#C22F2F]/50 text-[#FF9B9B] text-[12px] rounded-sm", children: err }), _jsx("div", { className: "bnet-inset rounded-sm p-3 mb-4 flex items-center gap-3", children: qr ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-white p-1.5 shrink-0", children: _jsx(QRCodeSVG, { value: qr.approve_url, size: 84 }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-[13px] font-semibold text-white", children: "Scan to sign in" }), _jsxs("div", { className: "text-[11px] font-mono text-[#5C6B80]", children: [Math.floor(qrLeft / 60), ":", String(qrLeft % 60).padStart(2, '0'), " left", qr.notified?.length ? ` · push: ${qr.notified.join(', ')}` : ''] }), _jsx("button", { onClick: cancelQr, className: "text-[12px] text-[#9EB3C8] hover:text-white mt-1", children: "Cancel" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-[13px] font-semibold text-white", children: "Scan to sign in" }), _jsx("input", { value: qrUser, onChange: e => setQrUser(e.target.value), placeholder: "@username for push (optional)", className: "mt-1.5 w-full px-2.5 py-1.5 bnet-inset rounded-sm text-[12px] font-mono text-white placeholder-[#3D4A5E] focus:outline-none focus:border-[#0074E0]" })] }), _jsx("button", { onClick: startQr, className: "btn-bnet-blue px-4 py-2 text-[12px] font-bold self-end", children: "Show" })] })) }), _jsx("div", { className: "space-y-3", children: step === 'email' ? (_jsxs(_Fragment, { children: [_jsx("input", { value: email, onChange: e => setEmail(e.target.value), placeholder: "name@example.com", className: "w-full px-3.5 py-2.5 bnet-inset rounded-sm text-[14px] text-white placeholder-[#3D4A5E] focus:outline-none focus:border-[#0074E0]" }), _jsx("button", { disabled: busy || !email, onClick: sendOtp, className: "btn-bnet-blue w-full py-2.5 font-bold text-[14px] disabled:opacity-50", children: busy ? 'Sending…' : 'Send code' })] })) : (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-[13px] text-[#9EB3C8] text-center", children: ["Code sent to ", _jsx("span", { className: "text-white font-mono", children: email })] }), _jsx("input", { value: code, onChange: e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6)), placeholder: "\u2013\u2013\u2013\u2013\u2013\u2013", maxLength: 6, className: "w-full px-4 py-3 bnet-inset rounded-sm text-center tracking-[0.5em] font-mono text-xl text-white focus:outline-none focus:border-[#F8B700]" }), _jsx("button", { disabled: busy || code.length !== 6, onClick: verify, className: "btn-bnet-gold w-full py-2.5 font-bold text-[15px] disabled:opacity-50", children: busy ? 'Verifying…' : 'Verify' }), _jsx("button", { onClick: () => setStep('email'), className: "w-full text-[12px] text-[#9EB3C8] hover:text-white", children: "\u2190 Change email" })] })) }), _jsx("div", { className: "bnet-divider my-4" }), _jsx("div", { className: "space-y-2", children: PROVIDERS.map(p => (_jsx("button", { onClick: () => oauth(p), disabled: busy, className: "btn-bnet-ghost w-full py-2.5 rounded-sm text-[13px] font-semibold capitalize disabled:opacity-50", children: busy ? 'Opening…' : `Continue with ${p}` }, p))) }), _jsx("div", { className: "bnet-divider my-4" }), _jsxs("div", { className: "space-y-2", children: [_jsx("button", { onClick: async () => { try {
                                    await wou.loginWithSolana();
                                    onClose();
                                }
                                catch (e) {
                                    setErr(e.message);
                                } }, className: "btn-bnet-ghost w-full py-2.5 rounded-sm text-[13px] font-semibold", children: "Phantom" }), _jsx("button", { onClick: async () => { try {
                                    await wou.loginWithEthereum();
                                    onClose();
                                }
                                catch (e) {
                                    setErr(e.message);
                                } }, className: "btn-bnet-ghost w-full py-2.5 rounded-sm text-[13px] font-semibold", children: "MetaMask" }), _jsx("button", { onClick: async () => { try {
                                    await wou.loginWithInternetIdentity();
                                    onClose();
                                }
                                catch (e) {
                                    setErr(e.message);
                                } }, className: "btn-bnet-ghost w-full py-2.5 rounded-sm text-[13px] font-semibold", children: "Internet Identity" })] })] })] }));
    if (!dismissable)
        return card;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm", children: card }));
}
