import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { inputCls, primaryBtn, ghostBtn } from "../ui";

const niceDate = (d) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const CHIP = {
    booked: "bg-tint text-primary-dark",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};

export default function Appointments() {
    const { user } = useAuth();
    const location = useLocation();
    const [data, setData] = useState({ today: "", appointments: [] });
    const [dateFilter, setDateFilter] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState(location.state?.notice || "");

    const load = useCallback(async () => {
        try {
            const res = await api.get("/appointments", { params: dateFilter ? { date: dateFilter } : {} });
            setData(res.data);
        } catch {
            setError("Could not load appointments.");
        }
    }, [dateFilter]);
    useEffect(() => {
        load();
    }, [load]);

    async function act(id, kind) {
        if (kind === "cancel" && !window.confirm("Cancel this appointment?")) return;
        setError("");
        setNotice("");
        try {
            await api.patch(`/appointments/${id}/${kind}`);
            setNotice(kind === "cancel" ? "Appointment cancelled." : "Appointment marked as completed.");
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "That did not work.");
        }
    }

    const { today, appointments } = data;
    const upcoming = appointments.filter((a) => a.status === "booked" && a.date >= today);
    const rest = appointments.filter((a) => !(a.status === "booked" && a.date >= today)).reverse();
    const canBook = user.role === "patient" || user.role === "receptionist";
    const canCancel = ["patient", "receptionist", "admin"].includes(user.role);

    const Row = ({ a }) => (
        <li className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
            <div>
                <div className="font-bold">{niceDate(a.date)}, {a.time}</div>
                <div className="mt-1">
                    {user.role !== "doctor" && <>Dr. {a.doctor?.name}, {a.doctor?.specialty} ({a.doctor?.department})<br /></>}
                    {user.role !== "patient" && <>Patient: {a.patient?.name}<br /></>}
                    {a.reason && <span className="text-muted">Reason: {a.reason}</span>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${CHIP[a.status]}`}>{a.status}</span>
                {a.status === "booked" && canCancel && a.date >= today && (
                    <button onClick={() => act(a.id, "cancel")} className="font-bold text-red-700">Cancel</button>
                )}
                {a.status === "booked" && user.role === "doctor" && a.date <= today && (
                    <button onClick={() => act(a.id, "complete")} className="font-bold text-primary">Mark completed</button>
                )}
            </div>
        </li>
    );

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <Link to="/dashboard" className="text-sm font-bold text-primary">Back to dashboard</Link>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-extrabold">Appointments</h1>
                {canBook && <Link to="/appointments/new" className={primaryBtn}>Book appointment</Link>}
            </div>
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
            {notice && <p className="mt-4 text-sm text-green-700">{notice}</p>}

            {user.role !== "patient" && (
                <div className="mt-4 flex items-end gap-3">
                    <label className="block text-sm font-bold">
                        Show a single day
                        <input className={inputCls} type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                    </label>
                    {dateFilter && <button onClick={() => setDateFilter("")} className={ghostBtn}>Clear</button>}
                </div>
            )}

            <h2 className="mt-8 text-lg font-extrabold">Upcoming</h2>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
                {upcoming.length === 0 && <li className="p-4 text-sm text-muted">No upcoming appointments.</li>}
                {upcoming.map((a) => <Row key={a.id} a={a} />)}
            </ul>

            <h2 className="mt-8 text-lg font-extrabold">Past and cancelled</h2>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
                {rest.length === 0 && <li className="p-4 text-sm text-muted">Nothing here yet.</li>}
                {rest.map((a) => <Row key={a.id} a={a} />)}
            </ul>
        </main>
    );
}