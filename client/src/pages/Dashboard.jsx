import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { primaryBtn, ghostBtn } from "../ui";

const CHIP = {
    booked: "bg-tint text-primary-dark",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};
const TONES = ["bg-tint text-primary-dark", "bg-green-100 text-green-800", "bg-amber-100 text-amber-800", "bg-red-100 text-red-800"];

const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
const niceDate = (d) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const shortDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api
            .get("/dashboard")
            .then((res) => setData(res.data))
            .catch(() => setError("Could not load the dashboard."));
    }, []);

    const firstName = user.name.split(" ")[0];
    const isPatient = user.role === "patient";
    const isDoctor = user.role === "doctor";

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold">{greeting()}, {isDoctor ? `Dr. ${firstName}` : firstName}</h1>
                    {data && <p className="mt-1 text-sm text-muted">{niceDate(data.today)}</p>}
                </div>
                <div className="flex flex-wrap gap-3">
                    {(isPatient || user.role === "receptionist") && (
                        <Link to="/appointments/new" className={primaryBtn}>Book appointment</Link>
                    )}
                    {(user.role === "receptionist" || user.role === "admin") && (
                        <Link to="/patients" className={ghostBtn}>Find a patient</Link>
                    )}
                </div>
            </div>

            {error && <p className="mt-6 text-sm text-red-700">{error}</p>}
            {!data && !error && <p className="mt-6 text-sm text-muted">Loading...</p>}
            {data?.note && <p className="mt-6 rounded-2xl border border-line bg-white p-4 text-sm text-muted">{data.note}</p>}

            {data && data.stats.length > 0 && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {data.stats.map((s, i) => (
                        <div key={s.label} className="rounded-2xl border border-line bg-white p-5">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${TONES[i % TONES.length]}`}>{s.label}</span>
                            <div className="mt-3 text-4xl font-extrabold">{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {isDoctor && data?.next && (
                <section className="mt-8 rounded-2xl border border-primary/30 bg-tint p-6">
                    <div className="text-xs font-bold uppercase tracking-wide text-primary-dark">Next patient</div>
                    <div className="mt-1 text-xl font-extrabold">{data.next.patient?.name}, {data.next.time}</div>
                    {data.next.reason && <p className="mt-1 text-sm text-muted">Reason: {data.next.reason}</p>}
                    <Link to={`/consultations/${data.next.id}`} className={`mt-4 inline-block ${primaryBtn}`}>Open consultation</Link>
                </section>
            )}

            {data && (
                <section className="mt-8 grid gap-6 lg:grid-cols-5">
                    <div className={isPatient ? "lg:col-span-3" : "lg:col-span-5"}>
                        <h2 className="text-lg font-extrabold">{isPatient ? "Upcoming appointments" : "Today's schedule"}</h2>
                        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
                            {data.appointments.length === 0 && (
                                <li className="p-4 text-sm text-muted">{isPatient ? "You have no upcoming appointments." : "Nothing scheduled for today."}</li>
                            )}
                            {data.appointments.map((a) => (
                                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                                    <div>
                                        <div className="font-bold">{isPatient ? `${shortDate(a.date)}, ${a.time}` : a.time}</div>
                                        <div className="text-muted">
                                            {isPatient
                                                ? `Dr. ${a.doctor?.name}, ${a.doctor?.specialty}`
                                                : <>
                                                    <Link to={`/patients/${a.patient?.id}`} className="font-bold text-primary underline">{a.patient?.name}</Link>
                                                    {!isDoctor && <> with Dr. {a.doctor?.name}</>}
                                                </>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${CHIP[a.status]}`}>{a.status}</span>
                                        {isDoctor && a.status !== "cancelled" && (
                                            <Link to={`/consultations/${a.id}`} className="font-bold text-primary">
                                                {a.status === "completed" ? "View or edit" : "Open"}
                                            </Link>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Link to="/appointments" className="mt-3 inline-block text-sm font-bold text-primary">All appointments</Link>
                    </div>

                    {isPatient && (
                        <div className="lg:col-span-2">
                            <h2 className="text-lg font-extrabold">Latest prescriptions</h2>
                            <div className="mt-3 rounded-2xl border border-line bg-white p-4 text-sm">
                                {!data.prescriptions || data.prescriptions.items.length === 0 ? (
                                    <p className="text-muted">No prescriptions yet.</p>
                                ) : (
                                    <>
                                        <p className="text-muted">From your visit on {shortDate(data.prescriptions.date)}</p>
                                        <ul className="mt-2 divide-y divide-line">
                                            {data.prescriptions.items.map((p, i) => (
                                                <li key={i} className="py-2">
                                                    <b>{p.medicine}</b> {p.dose}
                                                    <div className="text-muted">{[p.frequency, p.duration].filter(Boolean).join(", ")}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                                <Link to={`/patients/${user.id}`} className="mt-3 inline-block font-bold text-primary">Open my record</Link>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}