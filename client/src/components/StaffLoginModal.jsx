import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { inputCls, primaryBtn, ghostBtn } from "../ui";

export default function StaffLoginModal() {
    const { user, staffLogin } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const dialog = useRef(null);
    const emailInput = useRef(null);
    const returnFocus = useRef(null);

    // Ctrl+Shift+A (Cmd+Shift+A on a Mac) opens or closes the form. Escape closes it.
    useEffect(() => {
        if (user) return;
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyL") {
                e.preventDefault();
                setOpen((o) => !o);
            } else if (e.key === "Escape") {
                setOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [user]);

    useEffect(() => {
        if (open) {
            returnFocus.current = document.activeElement;
            emailInput.current?.focus();
        } else {
            returnFocus.current?.focus?.();
        }
    }, [open]);

    function keepFocusInside(e) {
        if (e.key !== "Tab") return;
        const items = dialog.current.querySelectorAll("input, button");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    async function submit(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            await staffLogin(email, password);
            setOpen(false);
            setEmail("");
            setPassword("");
            navigate("/dashboard");
        } catch (err) {
            setPassword("");
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    if (!open || user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div
                ref={dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="staff-title"
                onKeyDown={keepFocusInside}
                className="w-full max-w-sm rounded-2xl border border-line bg-white p-7"
            >
                <h2 id="staff-title" className="text-xl font-extrabold">Staff sign in</h2>
                <p className="mt-1 text-sm text-muted">For hospital administrators and receptionists.</p>
                {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
                <form onSubmit={submit} className="mt-5 space-y-4">
                    <label className="block text-sm font-bold">
                        Email
                        <input ref={emailInput} className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
                    </label>
                    <label className="block text-sm font-bold">
                        Password
                        <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                    </label>
                    <div className="flex gap-3">
                        <button disabled={busy} className={primaryBtn}>{busy ? "Please wait..." : "Sign in"}</button>
                        <button type="button" onClick={() => setOpen(false)} className={ghostBtn}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}