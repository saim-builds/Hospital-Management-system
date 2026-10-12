import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const input = "mt-2 w-full rounded-xl border border-[#C5D6DD] bg-white px-4 py-3 text-sm";

export default function AuthPage({ mode }) {
    const isRegister = mode === "register";
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    async function submit(e) {
        e.preventDefault();
        setError("");
        if (isRegister && form.password !== form.confirm) {
            setError("The two passwords do not match.");
            return;
        }
        setBusy(true);
        try {
            if (isRegister) await register(form.name, form.email, form.password);
            else await login(form.email, form.password);
            navigate(location.state?.from || "/dashboard", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="mx-auto max-w-md px-6 py-16">
            <div className="rounded-2xl border border-line bg-white p-8">
                <h1 className="text-2xl font-extrabold">{isRegister ? "Create your account" : "Log in"}</h1>
                <p className="mt-2 text-sm text-muted">
                    {isRegister ? "Patients can book appointments and see their records." : "Welcome back to Medora."}
                </p>
                {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

                <form onSubmit={submit} className="mt-6 space-y-4">
                    {isRegister && (
                        <label className="block text-sm font-bold">
                            Full name
                            <input className={input} value={form.name} onChange={set("name")} autoComplete="name" required />
                        </label>
                    )}
                    <label className="block text-sm font-bold">
                        Email
                        <input className={input} type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
                    </label>
                    <label className="block text-sm font-bold">
                        Password
                        <input
                            className={input}
                            type="password"
                            value={form.password}
                            onChange={set("password")}
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            required
                        />
                    </label>
                    {isRegister && (
                        <label className="block text-sm font-bold">
                            Confirm password
                            <input className={input} type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" required />
                        </label>
                    )}
                    <button
                        disabled={busy}
                        className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
                    >
                        {busy ? "Please wait..." : isRegister ? "Sign up" : "Log in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    {isRegister ? (
                        <>Already have an account? <Link to="/login" className="font-bold text-primary">Log in</Link></>
                    ) : (
                        <>New patient? <Link to="/register" className="font-bold text-primary">Create an account</Link></>
                    )}
                </p>
            </div>
        </main>
    );
}