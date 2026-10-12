import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const input = "mt-2 w-full rounded-xl border border-[#C5D6DD] bg-white px-4 py-3 text-sm";

export default function Admin() {
    const [users, setUsers] = useState([]);
    const [version, setVersion] = useState(0);
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "doctor" });
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api
            .get("/users")
            .then((res) => setUsers(res.data.users))
            .catch(() => setError("Could not load users."));
    }, [version]);

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    async function create(e) {
        e.preventDefault();
        setError("");
        setNotice("");
        setBusy(true);
        try {
            await api.post("/users", form);
            setNotice(`${form.role} account created for ${form.name}.`);
            setForm({ name: "", email: "", password: "", role: form.role });
            setVersion((v) => v + 1);
        } catch (err) {
            setError(err.response?.data?.message || "Could not create the account.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <Link to="/dashboard" className="text-sm font-bold text-primary">Back to dashboard</Link>
            <h1 className="mt-3 text-3xl font-extrabold">Staff and users</h1>

            <form onSubmit={create} className="mt-6 rounded-2xl border border-line bg-white p-6">
                <h2 className="font-bold">Add staff</h2>
                <p className="mt-1 text-sm text-muted">Use fake details only. This is a demo project.</p>
                {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
                {notice && <p className="mt-4 text-sm text-green-700">{notice}</p>}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-bold">
                        Full name
                        <input className={input} value={form.name} onChange={set("name")} required />
                    </label>
                    <label className="block text-sm font-bold">
                        Role
                        <select className={input} value={form.role} onChange={set("role")}>
                            <option value="doctor">Doctor</option>
                            <option value="receptionist">Receptionist</option>
                        </select>
                    </label>
                    <label className="block text-sm font-bold">
                        Email
                        <input className={input} type="email" value={form.email} onChange={set("email")} required />
                    </label>
                    <label className="block text-sm font-bold">
                        Temporary password
                        <input className={input} type="password" value={form.password} onChange={set("password")} minLength={8} required />
                    </label>
                </div>
                <button
                    disabled={busy}
                    className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
                >
                    {busy ? "Creating..." : "Create account"}
                </button>
            </form>

            <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
                {users.map((u) => (
                    <li key={u.id} className="flex justify-between gap-4 p-4 text-sm">
                        <span>
                            <b>{u.name}</b>
                            <br />
                            <span className="text-muted">{u.email}</span>
                        </span>
                        <span className="font-bold text-primary-dark">{u.role}</span>
                    </li>
                ))}
            </ul>
        </main>
    );
}