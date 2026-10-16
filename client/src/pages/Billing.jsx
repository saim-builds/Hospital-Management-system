import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { money } from "../ui";

const CHIP = { unpaid: "bg-amber-100 text-amber-800", paid: "bg-green-100 text-green-800", void: "bg-gray-200 text-gray-700" };
const FILTERS = [["", "All"], ["unpaid", "Unpaid"], ["paid", "Paid"], ["void", "Void"]];
const niceDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function Billing() {
    const { user } = useAuth();
    const isStaff = user.role !== "patient";
    const [status, setStatus] = useState("");
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await api.get("/billing", { params: status ? { status } : {} });
            setData(res.data);
            setError("");
        } catch {
            setError("Could not load invoices.");
        }
    }, [status]);
    useEffect(() => {
        load();
    }, [load]);

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
            <h1 className="text-3xl font-extrabold">Billing</h1>
            {isStaff && (
                <p className="mt-2 text-sm text-muted">
                    To create an invoice, open a completed visit on the <Link to="/appointments" className="font-bold text-primary">Appointments</Link> page and choose Invoice.
                </p>
            )}
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

            {data && (
                <div className="mt-6 inline-block rounded-2xl border border-line bg-white px-6 py-4">
                    <div className="text-sm text-muted">{isStaff ? "Outstanding across all patients" : "You owe"}</div>
                    <div className="text-3xl font-extrabold">{money(data.outstanding, data.currency)}</div>
                </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                {FILTERS.map(([value, label]) => (
                    <button
                        key={label}
                        aria-pressed={status === value}
                        onClick={() => setStatus(value)}
                        className={`rounded-full border px-4 py-2 text-sm font-bold ${status === value ? "border-primary bg-primary text-white" : "border-[#C5D6DD] bg-white"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
                {data && data.invoices.length === 0 && <li className="p-4 text-sm text-muted">No invoices to show.</li>}
                {data?.invoices.map((inv) => (
                    <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                        <div>
                            <Link to={`/billing/${inv.id}`} className="font-extrabold text-primary underline">{inv.number}</Link>
                            <div className="text-muted">
                                {isStaff && <>{inv.patient.name}, </>}{niceDate(inv.issuedOn)}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <b>{money(inv.total, inv.currency)}</b>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${CHIP[inv.status]}`}>{inv.status}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </main>
    );
}