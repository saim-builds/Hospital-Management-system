import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { inputCls, ghostBtn } from "../ui";

export default function Patients() {
    const [query, setQuery] = useState("");
    const [patients, setPatients] = useState([]);
    const [error, setError] = useState("");

    const search = useCallback(async (q) => {
        try {
            const res = await api.get("/patients", { params: { q } });
            setPatients(res.data.patients);
            setError("");
        } catch {
            setError("Could not load patients.");
        }
    }, []);
    useEffect(() => {
        search("");
    }, [search]);

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <Link to="/dashboard" className="text-sm font-bold text-primary">Back to dashboard</Link>
            <h1 className="mt-3 text-3xl font-extrabold">Patients</h1>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    search(query);
                }}
                className="mt-6 flex gap-3"
            >
                <input className={inputCls + " mt-0"} placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
                <button className={ghostBtn}>Search</button>
            </form>
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
            <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
                {patients.length === 0 && <li className="p-4 text-sm text-muted">No patients found.</li>}
                {patients.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                        <span>
                            <b>{p.name}</b> {p.patientId && <span className="ml-2 rounded-full bg-tint px-2 py-0.5 text-xs font-bold text-primary-dark">{p.patientId}</span>}
                            <br />
                            <span className="text-muted">{p.email}</span>
                        </span>
                        <Link to={`/patients/${p.id}`} className="font-bold text-primary">Open record</Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}