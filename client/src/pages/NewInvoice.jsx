import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { inputCls, primaryBtn, ghostBtn, money } from "../ui";

export default function NewInvoice() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [draft, setDraft] = useState(null);
    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api
            .get(`/billing/draft/${appointmentId}`)
            .then((res) => {
                setDraft(res.data);
                setItems(res.data.suggestedItems.map((i) => ({ description: i.description, quantity: String(i.quantity), unitPrice: String(i.unitPrice) })));
            })
            .catch((err) => setError(err.response?.data?.message || "Could not load the appointment."));
    }, [appointmentId]);

    const setItem = (i, key) => (e) => setItems(items.map((it, n) => (n === i ? { ...it, [key]: e.target.value } : it)));
    const total = items.reduce((sum, it) => sum + Math.round((Number(it.unitPrice) || 0) * 100) * (Number(it.quantity) || 0), 0);

    async function create(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const res = await api.post("/billing", {
                appointment: appointmentId,
                items: items.map((it) => ({ description: it.description, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
                notes,
            });
            navigate(`/billing/${res.data.id}`, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Could not create the invoice.");
        } finally {
            setBusy(false);
        }
    }

    if (draft?.existingInvoiceId) return <Navigate to={`/billing/${draft.existingInvoiceId}`} replace />;

    if (!draft) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-10">
                <Link to="/appointments" className="text-sm font-bold text-primary">Back to appointments</Link>
                <p className={`mt-6 text-sm ${error ? "text-red-700" : "text-muted"}`}>{error || "Loading..."}</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-3xl px-6 py-10">
            <Link to="/appointments" className="text-sm font-bold text-primary">Back to appointments</Link>
            <h1 className="mt-3 text-3xl font-extrabold">New invoice</h1>
            <p className="mt-1 text-sm text-muted">
                {draft.patient.name}, visit with Dr. {draft.doctor.name} on {draft.appointment.date} at {draft.appointment.time}
            </p>
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

            <form onSubmit={create} className="mt-6 rounded-2xl border border-line bg-white p-6">
                <h2 className="font-bold">Charges ({draft.currency})</h2>
                {items.map((it, i) => (
                    <div key={i} className="mt-4 grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-6">
                        <label className="block text-sm font-bold sm:col-span-3">
                            Description
                            <input className={inputCls} maxLength={120} value={it.description} onChange={setItem(i, "description")} required />
                        </label>
                        <label className="block text-sm font-bold">
                            Quantity
                            <input className={inputCls} type="number" min="1" max="100" step="1" value={it.quantity} onChange={setItem(i, "quantity")} required />
                        </label>
                        <label className="block text-sm font-bold sm:col-span-2">
                            Unit price
                            <input className={inputCls} type="number" min="0" step="0.01" value={it.unitPrice} onChange={setItem(i, "unitPrice")} required />
                        </label>
                        {items.length > 1 && (
                            <button type="button" onClick={() => setItems(items.filter((_, n) => n !== i))} className="text-left text-sm font-bold text-red-700 sm:col-span-6">
                                Remove line
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={() => setItems([...items, { description: "", quantity: "1", unitPrice: "0" }])} className={`mt-4 ${ghostBtn}`}>
                    Add a line
                </button>

                <label className="mt-6 block text-sm font-bold">
                    Notes (optional)
                    <input className={inputCls} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-lg font-extrabold">Total: {money(total, draft.currency)}</div>
                    <button disabled={busy} className={primaryBtn}>{busy ? "Creating..." : "Create invoice"}</button>
                </div>
            </form>
        </main>
    );
}