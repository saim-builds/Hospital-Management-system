import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { inputCls, primaryBtn, ghostBtn } from "../ui";

const VITALS = [
    ["systolic", "Systolic (mmHg)"],
    ["diastolic", "Diastolic (mmHg)"],
    ["pulse", "Pulse (bpm)"],
    ["temperature", "Temperature (°C)"],
    ["oxygen", "Oxygen (%)"],
];
const BLANK_RX = { medicine: "", dose: "", frequency: "", duration: "", instructions: "" };

const toForm = (v) => ({
    vitals: Object.fromEntries(VITALS.map(([k]) => [k, v?.vitals?.[k] ?? ""])),
    complaint: v?.complaint ?? "",
    diagnosis: v?.diagnosis ?? "",
    notes: v?.notes ?? "",
    prescriptions: v?.prescriptions?.length ? v.prescriptions.map((p) => ({ ...BLANK_RX, ...p })) : [{ ...BLANK_RX }],
});

export default function Consultation() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [info, setInfo] = useState(null);
    const [form, setForm] = useState(toForm(null));
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api
            .get(`/visits/consultation/${appointmentId}`)
            .then((res) => {
                setInfo(res.data);
                setForm(toForm(res.data.visit));
            })
            .catch((err) =>
                setError(err.response?.status === 404 ? "Appointment not found." : "Could not load the consultation.")
            );
    }, [appointmentId]);

    const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    const setVital = (key) => (e) => setForm({ ...form, vitals: { ...form.vitals, [key]: e.target.value } });
    const setRx = (i, key) => (e) =>
        setForm({ ...form, prescriptions: form.prescriptions.map((p, n) => (n === i ? { ...p, [key]: e.target.value } : p)) });
    const addRx = () => setForm({ ...form, prescriptions: [...form.prescriptions, { ...BLANK_RX }] });
    const removeRx = (i) => setForm({ ...form, prescriptions: form.prescriptions.filter((_, n) => n !== i) });

    async function save(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        const vitals = {};
        for (const [k, v] of Object.entries(form.vitals)) if (String(v).trim() !== "") vitals[k] = Number(v);
        const prescriptions = form.prescriptions.filter((p) => Object.values(p).some((v) => String(v).trim() !== ""));
        const body = { vitals, complaint: form.complaint, diagnosis: form.diagnosis, notes: form.notes, prescriptions };
        try {
            if (info.visit) await api.put(`/visits/${info.visit.id}`, body);
            else await api.post("/visits", { ...body, appointment: appointmentId });
            navigate("/appointments", { state: { notice: "Consultation saved." } });
        } catch (err) {
            setError(err.response?.data?.message || "Could not save the consultation.");
        } finally {
            setBusy(false);
        }
    }

    if (!info) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-12">
                <Link to="/appointments" className="text-sm font-bold text-primary">Back to appointments</Link>
                <p className={`mt-6 text-sm ${error ? "text-red-700" : "text-muted"}`}>{error || "Loading..."}</p>
            </main>
        );
    }

    const { appointment, patient, profile, today } = info;
    const blocked =
        appointment.status === "cancelled" ? "This appointment was cancelled." :
            appointment.date > today ? "This appointment is in the future, so it cannot be recorded yet." : "";

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <Link to="/appointments" className="text-sm font-bold text-primary">Back to appointments</Link>
            <h1 className="mt-3 text-3xl font-extrabold">Consultation</h1>
            <p className="mt-1 text-sm text-muted">
                <Link to={`/patients/${patient.id}`} className="font-bold text-primary underline">{patient.name}</Link>
                {profile && `, ${profile.patientId}`}, {appointment.date} at {appointment.time}
                {appointment.reason && `, reason: ${appointment.reason}`}
            </p>

            {profile?.allergies?.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
                    Allergies on file: {profile.allergies.join(", ")}
                </div>
            ) : (
                <p className="mt-4 text-sm text-muted">No allergy information on file for this patient.</p>
            )}

            {blocked && <p className="mt-4 text-sm text-red-700">{blocked}</p>}
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

            <form onSubmit={save} className="mt-6 space-y-6">
                <fieldset disabled={!!blocked} className="space-y-6">
                    <section className="rounded-2xl border border-line bg-white p-6">
                        <h2 className="font-bold">Vitals</h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            {VITALS.map(([key, label]) => (
                                <label key={key} className="block text-sm font-bold">
                                    {label}
                                    <input className={inputCls} type="number" step="any" value={form.vitals[key]} onChange={setVital(key)} />
                                </label>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-line bg-white p-6">
                        <h2 className="font-bold">Findings</h2>
                        <label className="mt-4 block text-sm font-bold">
                            Complaint
                            <textarea className={inputCls} rows={2} maxLength={500} value={form.complaint} onChange={setField("complaint")} />
                        </label>
                        <label className="mt-4 block text-sm font-bold">
                            Diagnosis
                            <input className={inputCls} maxLength={500} value={form.diagnosis} onChange={setField("diagnosis")} required />
                        </label>
                        <label className="mt-4 block text-sm font-bold">
                            Notes
                            <textarea className={inputCls} rows={4} maxLength={2000} value={form.notes} onChange={setField("notes")} />
                        </label>
                    </section>

                    <section className="rounded-2xl border border-line bg-white p-6">
                        <h2 className="font-bold">Prescriptions</h2>
                        <p className="mt-1 text-sm text-muted">Demo only. Medicines are not checked against allergies automatically.</p>
                        {form.prescriptions.map((p, i) => (
                            <div key={i} className="mt-4 rounded-xl border border-line p-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="block text-sm font-bold">
                                        Medicine
                                        <input className={inputCls} maxLength={80} value={p.medicine} onChange={setRx(i, "medicine")} />
                                    </label>
                                    <label className="block text-sm font-bold">
                                        Dose
                                        <input className={inputCls} maxLength={60} value={p.dose} onChange={setRx(i, "dose")} placeholder="for example: 500 mg" />
                                    </label>
                                    <label className="block text-sm font-bold">
                                        Frequency
                                        <input className={inputCls} maxLength={60} value={p.frequency} onChange={setRx(i, "frequency")} placeholder="for example: twice daily" />
                                    </label>
                                    <label className="block text-sm font-bold">
                                        Duration
                                        <input className={inputCls} maxLength={60} value={p.duration} onChange={setRx(i, "duration")} placeholder="for example: 5 days" />
                                    </label>
                                </div>
                                <label className="mt-3 block text-sm font-bold">
                                    Instructions
                                    <input className={inputCls} maxLength={200} value={p.instructions} onChange={setRx(i, "instructions")} />
                                </label>
                                {form.prescriptions.length > 1 && (
                                    <button type="button" onClick={() => removeRx(i)} className="mt-3 text-sm font-bold text-red-700">Remove medicine</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addRx} className={`mt-4 ${ghostBtn}`}>Add another medicine</button>
                    </section>
                </fieldset>

                <button disabled={busy || !!blocked} className={primaryBtn}>
                    {busy ? "Saving..." : info.visit ? "Save changes" : "Save consultation"}
                </button>
            </form>
        </main>
    );
}