import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { inputCls, primaryBtn, ghostBtn } from "../ui";
import VisitHistory from "../components/VisitHistory";

const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const EMPTY = { dateOfBirth: "", gender: "", bloodGroup: "", phone: "", allergies: "" };

function age(dob) {
    const b = new Date(`${dob}T00:00:00`);
    const n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    const m = n.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--;
    return a;
}
const initials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default function PatientRecord() {
    const { id } = useParams();
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await api.get(`/records/patients/${id}`);
            setData(res.data);
            setError("");
        } catch (err) {
            setError(
                err.response?.status === 404
                    ? "Patient not found, or you do not have access to this record."
                    : "Could not load the record."
            );
        }
    }, [id]);
    useEffect(() => {
        load();
    }, [load]);

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    function startEdit() {
        const p = data.profile;
        setForm(p ? { dateOfBirth: p.dateOfBirth, gender: p.gender, bloodGroup: p.bloodGroup, phone: p.phone, allergies: p.allergies.join(", ") } : EMPTY);
        setNotice("");
        setEditing(true);
    }

    async function save(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            await api.put(`/records/patients/${id}/profile`, {
                ...form,
                allergies: form.allergies.split(",").map((s) => s.trim()).filter(Boolean),
            });
            setEditing(false);
            setNotice("Profile saved.");
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Could not save the profile.");
        } finally {
            setBusy(false);
        }
    }

    const back =
        user.role === "patient" ? ["/dashboard", "Back to dashboard"]
            : user.role === "doctor" ? ["/appointments", "Back to appointments"]
                : ["/patients", "Back to patients"];

    if (!data) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-12">
                <Link to={back[0]} className="text-sm font-bold text-primary">{back[1]}</Link>
                <p className={`mt-6 text-sm ${error ? "text-red-700" : "text-muted"}`}>{error || "Loading..."}</p>
            </main>
        );
    }

    const { patient, profile, canEdit } = data;
    const showForm = canEdit && (editing || !profile);

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <Link to={back[0]} className="text-sm font-bold text-primary">{back[1]}</Link>

            <section className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tint text-xl font-extrabold text-primary-dark">
                    {initials(patient.name)}
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-extrabold">{patient.name}</h1>
                    {profile ? (
                        <p className="mt-1 text-sm text-muted">
                            {profile.patientId}, {age(profile.dateOfBirth)} years, {profile.gender}
                            {profile.bloodGroup && `, blood group ${profile.bloodGroup}`}
                            {profile.phone && `, ${profile.phone}`}
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-muted">No profile yet.</p>
                    )}
                    {profile && profile.allergies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {profile.allergies.map((a) => (
                                <span key={a} className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Allergy: {a}</span>
                            ))}
                        </div>
                    )}
                </div>
                {canEdit && profile && !editing && <button onClick={startEdit} className={ghostBtn}>Edit profile</button>}
            </section>

            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
            {notice && <p className="mt-4 text-sm text-green-700">{notice}</p>}

            {showForm && (
                <form onSubmit={save} className="mt-6 rounded-2xl border border-line bg-white p-6">
                    <h2 className="font-bold">{profile ? "Edit profile" : "Create the patient profile"}</h2>
                    <p className="mt-1 text-sm text-muted">Use fake details only. This is a demo project.</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-bold">
                            Date of birth
                            <input className={inputCls} type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
                        </label>
                        <label className="block text-sm font-bold">
                            Gender
                            <select className={inputCls} value={form.gender} onChange={set("gender")} required>
                                <option value="">Choose</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="other">Other</option>
                            </select>
                        </label>
                        <label className="block text-sm font-bold">
                            Blood group
                            <select className={inputCls} value={form.bloodGroup} onChange={set("bloodGroup")}>
                                <option value="">Not known</option>
                                {BLOOD.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </label>
                        <label className="block text-sm font-bold">
                            Phone
                            <input className={inputCls} value={form.phone} onChange={set("phone")} maxLength={20} />
                        </label>
                    </div>
                    <label className="mt-4 block text-sm font-bold">
                        Allergies (separate with commas)
                        <input className={inputCls} value={form.allergies} onChange={set("allergies")} placeholder="for example: penicillin, peanuts" />
                    </label>
                    <div className="mt-5 flex gap-3">
                        <button disabled={busy} className={primaryBtn}>{busy ? "Saving..." : "Save profile"}</button>
                        {editing && <button type="button" onClick={() => setEditing(false)} className={ghostBtn}>Cancel</button>}
                    </div>
                </form>
            )}

            {!showForm && !profile && (
                <p className="mt-6 text-sm text-muted">This patient has not completed their profile yet.</p>
            )}

            <VisitHistory patientId={id} />
        </main>
    );
}