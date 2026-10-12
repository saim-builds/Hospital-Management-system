import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <h1 className="text-3xl font-extrabold">Welcome, {user.name}</h1>
            <p className="mt-2 text-muted">
                You are signed in as <span className="rounded-full bg-tint px-3 py-1 text-sm font-bold text-primary-dark">{user.role}</span>
            </p>
            <div className="mt-8 flex gap-3">
                {user.role === "admin" && (
                    <Link to="/admin" className="rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold">Staff and users</Link>
                )}
                <button onClick={logout} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">
                    Log out
                </button>
            </div>
        </main>
    );
}