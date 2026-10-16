import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { inputCls, primaryBtn, ghostBtn, money } from "../ui";

const CHIP = { unpaid: "bg-amber-100 text-amber-800", paid: "bg-green-100 text-green-800", void: "bg-gray-200 text-gray-700" };
const niceDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function Invoice() {
    const { id } = useParams();
    const { user } = useAuth();
    const isStaff = user.role !== "patient";
    const [invoice, setInvoice] = useState(null);
    const [method, setMethod] = useState("cash");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await api.get(`/billing/${id}`);
            setInvoice(res.data.invoice);
            setError("");
        } catch (err) {
            setError(err.response?.status === 404 ? "Invoice not found." : "Could not load the invoice.");
        }
    }, [id]);
    useEffect(() => {
        load();
    }, [load]);

    async function act(kind, body) {
        if (kind === "void" && !window.confirm("Void this invoice? This cannot be undone.")) return;
        setError("");
        setBusy(true);
        try {
            await api.patch(`/billing/${id}/${kind}`, body);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "That did not work.");
        } finally {
            setBusy(false);
        }
    }

    if (!invoice) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-10">
                <Link to="/billing" className="text-sm font-bold text-primary">Back to billing</Link>
                <p className={`mt-6 text-sm ${error ? "text-red-700" : "text-muted"}`}>{error || "Loading..."}</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-3xl px-6 py-10">
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
                <Link to="/billing" className="text-sm font-bold text-primary">Back to billing</Link>
                <button onClick={() => window.print()} className={ghostBtn}>Print</button>
            </div>
            {error && <p className="no-print mt-4 text-sm text-red-700">{error}</p>}

            <article className="mt-4 rounded-2xl border border-line bg-white p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="text-2xl font-extrabold">Medora</div>
                        <div className="text-sm text-muted">Demo hospital invoice</div>
                    </div>
                    <div className="text-right text-sm">
                        <div className="text-xl font-extrabold">{invoice.number}</div>
                        <div className="text-muted">Issued {niceDate(invoice.issuedOn)}</div>
                        <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${CHIP[invoice.status]}`}>{invoice.status}</span>
                    </div>
                </div>

                <div className="mt-6 text-sm leading-relaxed">
                    <div><span className="text-muted">Patient:</span> <b>{invoice.patient.name}</b></div>
                    {invoice.visit && (
                        <div>
                            <span className="text-muted">Visit:</span> {niceDate(invoice.visit.date)}, Dr. {invoice.visit.doctor} ({invoice.visit.department})
                        </div>
                    )}
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-left text-sm">
                        <thead className="border-b border-line text-muted">
                            <tr>
                                <th className="py-2 font-normal">Description</th>
                                <th className="py-2 text-right font-normal">Qty</th>
                                <th className="py-2 text-right font-normal">Unit price</th>
                                <th className="py-2 text-right font-normal">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((it, i) => (
                                <tr key={i} className="border-b border-line">
                                    <td className="py-3">{it.description}</td>
                                    <td className="py-3 text-right">{it.quantity}</td>
                                    <td className="py-3 text-right">{money(it.unitPrice, invoice.currency)}</td>
                                    <td className="py-3 text-right">{money(it.lineTotal, invoice.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="pt-4 text-right font-extrabold">Total</td>
                                <td className="pt-4 text-right text-lg font-extrabold">{money(invoice.total, invoice.currency)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {invoice.notes && <p className="mt-4 text-sm text-muted">Notes: {invoice.notes}</p>}
                {invoice.status === "paid" && (
                    <p className="mt-4 text-sm text-green-800">
                        Paid by {invoice.paymentMethod} on {new Date(invoice.paidAt).toLocaleDateString("en-GB")}.
                    </p>
                )}
            </article>

            {isStaff && invoice.status === "unpaid" && (
                <section className="no-print mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-white p-6">
                    <label className="block text-sm font-bold">
                        Payment method
                        <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="online">Online</option>
                        </select>
                    </label>
                    <button disabled={busy} onClick={() => act("pay", { method })} className={primaryBtn}>Mark as paid</button>
                    <button disabled={busy} onClick={() => act("void")} className="rounded-xl border border-red-300 px-5 py-3 text-sm font-bold text-red-700">
                        Void invoice
                    </button>
                </section>
            )}
        </main>
    );
}