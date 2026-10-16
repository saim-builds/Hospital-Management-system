import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { inputCls, primaryBtn, ghostBtn } from "../ui";
import DoctorPhoto from "../components/DoctorPhoto";

const DAYS = [["Mon", 1], ["Tue", 2], ["Wed", 3], ["Thu", 4], ["Fri", 5], ["Sat", 6], ["Sun", 0]];
const EMPTY = {
    user: "", department: "", specialty: "", workingDays: [1, 2, 3, 4, 5],
    startTime: "09:00", endTime: "14:00", slotMinutes: 30, consultationFee: 0,
};
const dayText = (days) => DAYS.filter(([, n]) => days.includes(n)).map(([l]) => l).join(", ");

export default function Doctors() {
    const { user } = useAuth();
    const isAdmin = user.role === "admin";
    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [freeUsers, setFreeUsers] = useState([]);
    const [filter, setFilter] = useState("");
    const [form, setForm] = useState(EMPTY);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const calls = [api.get("/doctors"), api.get("/departments")];
            if (isAdmin) calls.push(api.get("/doctors/available-users"));
            const [d, dep, free] = await Promise.all(calls);
            setDoctors(d.data.doctors);
            setDepartments(dep.data.departments);
            if (free) setFreeUsers(free.data.users);
        } catch {
            setError("Could not load data.");
        }
    }, [isAdmin]);
    useEffect(() => {
        load();
    }, [load]);

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    const toggleDay = (n) =>
        setForm({
            ...form,
            workingDays: form.workingDays.includes(n) ? form.workingDays.filter((x) => x !== n) : [...form.workingDays, n],
        });

    function startEdit(d) {
        setEditingId(d.id);
        setForm({
            user: d.userId, department: d.department?.id || "", specialty: d.specialty,
            workingDays: d.workingDays, startTime: d.startTime, endTime: d.endTime,
            slotMinutes: d.slotMinutes, consultationFee: d.consultationFee,
        });
        setNotice("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function cancelEdit() {
        setEditingId(null);
        setForm(EMPTY);
    }

    async function save(e) {
        e.preventDefault();
        setError("");
        setNotice("");
        setBusy(true);
        const body = { ...form, slotMinutes: Number(form.slotMinutes), consultationFee: Number(form.consultationFee) };
        try {
            if (editingId) {
                const { user: _user, ...rest } = body;
                await api.patch(`/doctors/${editingId}`, rest);
                setNotice("Doctor updated.");
            } else {
                await api.post("/doctors", body);
                setNotice("Doctor profile created.");
            }
            cancelEdit();
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save.");
        } finally {
            setBusy(false);
        }
    }

    const shown = filter ? doctors.filter((d) => d.department?.id === filter) : doctors;
    const activeDepartments = departments.filter((d) => d.isActive);

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <Link to="/dashboard" className="text-sm font-bold text-primary">Back to dashboard</Link>
            <h1 className="mt-3 text-3xl font-extrabold">Doctors</h1>

            {isAdmin && (
                <form onSubmit={save} className="mt-6 rounded-2xl border border-line bg-white p-6">
                    <h2 className="font-bold">{editingId ? "Edit doctor" : "Add a doctor profile"}</h2>
                    {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
                    {notice && <p className="mt-3 text-sm text-green-700">{notice}</p>}
                    {activeDepartments.length === 0 && (
                        <p className="mt-3 text-sm text-muted">
                            Add a department first on the <Link to="/departments" className="font-bold text-primary">Departments</Link> page.
                        </p>
                    )}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-bold">
                            Doctor account
                            <select className={inputCls} value={form.user} onChange={set("user")} disabled={!!editingId} required>
                                {editingId ? (
                                    <option value={form.user}>{doctors.find((d) => d.id === editingId)?.name}</option>
                                ) : (
                                    <>
                                        <option value="">Choose a doctor</option>
                                        {freeUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                                    </>
                                )}
                            </select>
                        </label>
                        <label className="block text-sm font-bold">
                            Department
                            <select className={inputCls} value={form.department} onChange={set("department")} required>
                                <option value="">Choose a department</option>
                                {activeDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </label>
                        <label className="block text-sm font-bold">
                            Specialty
                            <input className={inputCls} value={form.specialty} onChange={set("specialty")} required />
                        </label>
                        <label className="block text-sm font-bold">
                            Consultation fee
                            <input className={inputCls} type="number" min="0" value={form.consultationFee} onChange={set("consultationFee")} />
                        </label>
                        <label className="block text-sm font-bold">
                            Starts at
                            <input className={inputCls} type="time" value={form.startTime} onChange={set("startTime")} required />
                        </label>
                        <label className="block text-sm font-bold">
                            Ends at
                            <input className={inputCls} type="time" value={form.endTime} onChange={set("endTime")} required />
                        </label>
                        <label className="block text-sm font-bold">
                            Slot length
                            <select className={inputCls} value={form.slotMinutes} onChange={set("slotMinutes")}>
                                {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
                            </select>
                        </label>
                    </div>
                    <fieldset className="mt-4">
                        <legend className="text-sm font-bold">Working days</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {DAYS.map(([label, n]) => (
                                <button
                                    type="button"
                                    key={n}
                                    aria-pressed={form.workingDays.includes(n)}
                                    onClick={() => toggleDay(n)}
                                    className={`rounded-full border px-4 py-2 text-sm font-bold ${form.workingDays.includes(n) ? "border-primary bg-primary text-white" : "border-[#C5D6DD] bg-white"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </fieldset>
                    <div className="mt-5 flex gap-3">
                        <button disabled={busy} className={primaryBtn}>{busy ? "Saving..." : editingId ? "Save changes" : "Create profile"}</button>
                        {editingId && <button type="button" onClick={cancelEdit} className={ghostBtn}>Cancel</button>}
                    </div>
                </form>
            )}

            {!isAdmin && error && <p className="mt-4 text-sm text-red-700">{error}</p>}

            <label className="mt-8 block text-sm font-bold">
                Filter by department
                <select className={inputCls} value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="">All departments</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </label>

            <ul className="mt-4 space-y-3">
                {shown.length === 0 && <li className="text-sm text-muted">No doctors to show yet.</li>}
                {shown.map((d) => (
                    <li key={d.id} className="rounded-2xl border border-line bg-white p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="text-lg font-extrabold">{d.name}</div>
                                <div className="text-sm text-muted">{d.specialty}, {d.department?.name}</div>
                                {isAdmin && <div className="text-sm text-muted">{d.email}</div>}
                            </div>
                            {isAdmin && <button onClick={() => startEdit(d)} className={ghostBtn}>Edit</button>}
                        </div>
                        <div className="mt-3 text-sm">
                            {dayText(d.workingDays)}, {d.startTime} to {d.endTime}, {d.slotMinutes}-minute slots, fee {d.consultationFee}
                        </div>
                        {isAdmin && <DoctorPhoto doctorId={d.id} name={d.name} />}
                    </li>
                ))}
            </ul>
        </main>
    );
}