import { useEffect, useRef, useState } from "react";
import api from "../api";
import { ghostBtn } from "../ui";

// Admin-only control: shows the doctor's current photo and lets the admin replace or remove it.
export default function DoctorPhoto({ doctorId, name }) {
    const [photo, setPhoto] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const input = useRef(null);

    useEffect(() => {
        api.get(`/doctor-photos/${doctorId}`).then((res) => setPhoto(res.data.photo)).catch(() => { });
    }, [doctorId]);

    async function pick(e) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setError("");
        if (file.size > 2 * 1024 * 1024) return setError("The photo must be under 2 MB.");
        const body = new FormData();
        body.append("photo", file);
        setBusy(true);
        try {
            const res = await api.put(`/doctor-photos/${doctorId}`, body);
            setPhoto(res.data.photo);
        } catch (err) {
            setError(err.response?.data?.message || "Could not upload the photo.");
        } finally {
            setBusy(false);
        }
    }

    async function remove() {
        setError("");
        setBusy(true);
        try {
            await api.delete(`/doctor-photos/${doctorId}`);
            setPhoto("");
        } catch (err) {
            setError(err.response?.data?.message || "Could not remove the photo.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            {photo ? (
                <img src={photo} alt={name} className="h-14 w-14 rounded-full object-cover object-top" />
            ) : (
                <span className="grid h-14 w-14 place-items-center rounded-full bg-tint text-xs font-bold text-muted">No photo</span>
            )}
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="hidden" aria-label={`Photo for ${name}`} />
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className={ghostBtn}>
                {busy ? "Working..." : photo ? "Change photo" : "Upload photo"}
            </button>
            {photo && <button type="button" disabled={busy} onClick={remove} className={ghostBtn}>Remove</button>}
            {error && <p className="w-full text-sm text-red-700">{error}</p>}
        </div>
    );
}