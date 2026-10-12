import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { inputCls, primaryBtn, ghostBtn } from "../ui";

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [form, setForm] = useState({ name: "", description: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await api.get("/departments");
            setDepartments(res.data.departments);
        } catch {
            setError("Could not load departments.");
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    async function add(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            await api.post("/departments", form);
            setForm({ name: "", description: "" });
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Could not add the department.");
        } finally {
            setBusy(false);
        }
    }

    async function toggle(d) {
        setError("");
        try {
            await api.patch(`/departments/${d.id}`, { isActive: !d.isActive });
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Could not update the department.");
        }
    }

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <Link to="/dashboard" className="text-sm font-bold text-primary">Back to dashboard</Link>
            <h1 className="mt-3 text-3xl font-extrabold">Departments</h1>

            <form onSubmit={add} className="mt-6 rounded-2xl border border-line bg-white p-6">
                <h2 className="font-bold">Add a department</h2>
                {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-bold">
                        Name
                        <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </label>
                    <label className="block text-sm font-bold">
                        Description (optional)
                        <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </label>
                </div>
                <button disabled={busy} className={`mt-5 ${primaryBtn}`}>{busy ? "Adding..." : "Add department"}</button>
            </form>

            <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
                {departments.length === 0 && <li className="p-4 text-sm text-muted">No departments yet.</li>}
                {departments.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                        <span>
                            <b>{d.name}</b> {!d.isActive && <span className="ml-2 text-muted">(inactive)</span>}
                            <br />
                            <span className="text-muted">{d.description}</span>
                        </span>
                        <button onClick={() => toggle(d)} className={ghostBtn}>{d.isActive ? "Deactivate" : "Activate"}</button>
                    </li>
                ))}
            </ul>
        </main>
    );
}