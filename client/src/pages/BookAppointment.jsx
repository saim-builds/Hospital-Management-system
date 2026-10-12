import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { inputCls, primaryBtn, ghostBtn } from "../ui";

const localDate = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
};

export default function BookAppointment() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isReceptionist = user.role === "receptionist";

    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [deptId, setDeptId] = useState("");
    const [doctorId, setDoctorId] = useState("");
    const [date, setDate] = useState(localDate());
    const [slots, setSlots] = useState(null);
    const [note, setNote] = useState("");
    const [selected, setSelected] = useState("");
    const [reason, setReason] = useState("");
    const [refresh, setRefresh] = useState(0);
    const [patientQuery, setPatientQuery] = useState("");
    const [patientResults, setPatientResults] = useState([]);
    const [patient, setPatient] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        Promise.all([api.get("/doctors"), api.get("/departments")])
            .then(([d, dep]) => {
                setDoctors(d.data.doctors);
                setDepartments(dep.data.departments);
            })
            .catch(() => setError("Could not load doctors."));
    }, []);

    useEffect(() => {
        if (!doctorId || !date) return;
        let cancelled = false;
        api
            .get("/appointments/slots", { params: { doctor: doctorId, date } })
            .then((res) => {
                if (cancelled) return;
                setSlots(res.data.slots);
                setNote(res.data.note || "");
                setSelected("");
            })
            .catch((err) => {
                if (cancelled) return;
                setSlots([]);
                setError(err.response?.data?.message || "Could not load slots.");
            });
        return () => {
            cancelled = true;
        };
    }, [doctorId, date, refresh]);

    const shownDoctors = doctors.filter((d) => !deptId || d.department?.id === deptId);
    const doctor = doctors.find((d) => d.id === doctorId);

    function changeDoctor(id) {
        setDoctorId(id);
        setSlots(null);
        setNote("");
        setSelected("");
        setError("");
    }
    function changeDate(value) {
        setDate(value);
        setSlots(null);
        setSelected("");
        setError("");
    }

    async function searchPatients(e) {
        e.preventDefault();
        try {
            const res = await api.get("/patients", { params: { q: patientQuery } });
            setPatientResults(res.data.patients);
        } catch {
            setError("Could not search patients.");
        }
    }

    async function confirm() {
        setError("");
        setBusy(true);
        try {
            await api.post("/appointments", {
                doctor: doctorId,
                date,
                time: selected,
                reason,
                ...(isReceptionist ? { patient: patient.id } : {}),
            });
            navigate("/appointments", { state: { notice: "Appointment booked." } });
        } catch (err) {
            setError(err.response?.data?.message || "Could not book the appointment.");
            setRefresh((n) => n + 1); // reload slots so a taken slot shows as booked
        } finally {
            setBusy(false);
        }
    }

    const ready = doctorId && date && selected && (!isReceptionist || patient);

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <Link to="/dashboard" className="text-sm font-bold text-primary">Back to dashboard</Link>
            <h1 className="mt-3 text-3xl font-extrabold">Book an appointment</h1>
            <p className="mt-1 text-sm text-muted">Pick a doctor and a free slot. Booked slots cannot be selected.</p>
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

            {isReceptionist && (
                <section className="mt-6 rounded-2xl border border-line bg-white p-6">
                    <h2 className="font-bold">Patient</h2>
                    {patient ? (
                        <p className="mt-3 text-sm">
                            <b>{patient.name}</b> ({patient.email}){" "}
                            <button onClick={() => setPatient(null)} className="ml-2 font-bold text-primary">Change</button>
                        </p>
                    ) : (
                        <>
                            <form onSubmit={searchPatients} className="mt-3 flex gap-3">
                                <input className={inputCls + " mt-0"} placeholder="Search by name or email" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
                                <button className={ghostBtn}>Search</button>
                            </form>
                            <ul className="mt-3 divide-y divide-line text-sm">
                                {patientResults.map((p) => (
                                    <li key={p.id} className="flex items-center justify-between py-2">
                                        <span><b>{p.name}</b> <span className="text-muted">{p.email}</span></span>
                                        <button onClick={() => setPatient(p)} className="font-bold text-primary">Select</button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </section>
            )}

            <section className="mt-6 rounded-2xl border border-line bg-white p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-bold">
                        Department
                        <select className={inputCls} value={deptId} onChange={(e) => { setDeptId(e.target.value); changeDoctor(""); }}>
                            <option value="">All departments</option>
                            {departments.filter((d) => d.isActive).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm font-bold">
                        Doctor
                        <select className={inputCls} value={doctorId} onChange={(e) => changeDoctor(e.target.value)}>
                            <option value="">Choose a doctor</option>
                            {shownDoctors.map((d) => <option key={d.id} value={d.id}>{d.name}, {d.specialty}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm font-bold">
                        Date
                        <input className={inputCls} type="date" min={localDate()} max={localDate(60)} value={date} onChange={(e) => changeDate(e.target.value)} />
                    </label>
                    <label className="block text-sm font-bold">
                        Reason for visit (optional)
                        <input className={inputCls} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
                    </label>
                </div>
            </section>

            {doctor && (
                <section className="mt-6 rounded-2xl border border-line bg-white p-6">
                    <h2 className="font-bold">Available slots</h2>
                    <p className="mt-1 text-sm text-muted">{doctor.name}, {date}</p>
                    {slots === null && <p className="mt-4 text-sm text-muted">Loading slots...</p>}
                    {note && <p className="mt-4 text-sm text-muted">{note}</p>}
                    {slots && slots.length > 0 && (
                        <>
                            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                                {slots.map((s) => (
                                    <button
                                        key={s.time}
                                        disabled={!s.available}
                                        aria-pressed={selected === s.time}
                                        onClick={() => setSelected(s.time)}
                                        className={`min-h-11 rounded-xl border px-2 py-3 text-sm font-bold ${!s.available
                                                ? "cursor-not-allowed border-line bg-[#F1F5F7] text-[#8CA0AA] line-through"
                                                : selected === s.time
                                                    ? "border-primary bg-primary text-white"
                                                    : "border-[#C5D6DD] bg-white hover:border-primary"
                                            }`}
                                    >
                                        {s.time}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-muted">Crossed-out times are booked or already past.</p>
                        </>
                    )}
                    <div className="mt-6 flex items-center justify-between gap-4">
                        <span className="text-sm">{selected ? `Selected: ${selected}` : "Select a time to continue"}</span>
                        <button disabled={!ready || busy} onClick={confirm} className={primaryBtn}>
                            {busy ? "Booking..." : "Confirm booking"}
                        </button>
                    </div>
                </section>
            )}
        </main>
    );
}