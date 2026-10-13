import { useEffect, useState } from "react";
import api from "../api";

const niceDate = (d) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function vitalsText(v) {
    const parts = [];
    if (v.systolic !== undefined && v.diastolic !== undefined) parts.push(`BP ${v.systolic}/${v.diastolic}`);
    if (v.pulse !== undefined) parts.push(`Pulse ${v.pulse}`);
    if (v.temperature !== undefined) parts.push(`Temp ${v.temperature} °C`);
    if (v.oxygen !== undefined) parts.push(`Oxygen ${v.oxygen}%`);
    return parts.join(", ");
}

export default function VisitHistory({ patientId }) {
    const [state, setState] = useState({ loading: true, visits: [], restricted: false, error: "" });

    useEffect(() => {
        api
            .get(`/visits/patient/${patientId}`)
            .then((res) => setState({ loading: false, visits: res.data.visits, restricted: res.data.restricted, error: "" }))
            .catch(() => setState({ loading: false, visits: [], restricted: false, error: "Could not load visits." }));
    }, [patientId]);

    const { loading, visits, restricted, error } = state;
    const latest = visits[0];

    return (
        <section className="mt-6 space-y-6">
            {restricted && (
                <div className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
                    Clinical notes are visible only to the patient and their treating doctor.
                </div>
            )}
            {error && <p className="text-sm text-red-700">{error}</p>}
            {loading && <p className="text-sm text-muted">Loading visits...</p>}

            {!restricted && !loading && !error && (
                <>
                    {latest && latest.prescriptions.length > 0 && (
                        <div className="rounded-2xl border border-line bg-white p-6">
                            <h2 className="font-bold">Current prescriptions</h2>
                            <p className="text-sm text-muted">From the visit on {niceDate(latest.date)}</p>
                            <ul className="mt-3 divide-y divide-line text-sm">
                                {latest.prescriptions.map((p, i) => (
                                    <li key={i} className="py-3">
                                        <b>{p.medicine}</b> {p.dose}
                                        <div className="text-muted">{[p.frequency, p.duration, p.instructions].filter(Boolean).join(", ")}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="rounded-2xl border border-line bg-white p-6">
                        <h2 className="font-bold">Visit history</h2>
                        {visits.length === 0 && <p className="mt-3 text-sm text-muted">No consultations recorded yet.</p>}
                        <ul className="mt-3 divide-y divide-line">
                            {visits.map((v) => (
                                <li key={v.id} className="py-4 text-sm leading-relaxed">
                                    <div className="font-bold">{niceDate(v.date)}, Dr. {v.doctor} ({v.specialty})</div>
                                    {v.complaint && <div><span className="text-muted">Complaint:</span> {v.complaint}</div>}
                                    <div><span className="text-muted">Diagnosis:</span> {v.diagnosis}</div>
                                    {vitalsText(v.vitals) && <div><span className="text-muted">Vitals:</span> {vitalsText(v.vitals)}</div>}
                                    {v.notes && <div><span className="text-muted">Notes:</span> {v.notes}</div>}
                                    {v.prescriptions.length > 0 && (
                                        <div>
                                            <span className="text-muted">Prescribed:</span>{" "}
                                            {v.prescriptions.map((p) => `${p.medicine} ${p.dose}`.trim()).join("; ")}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </section>
    );
}