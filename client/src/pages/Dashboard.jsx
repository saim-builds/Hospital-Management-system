import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { primaryBtn, ghostBtn } from "../ui";

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <h1 className="text-3xl font-extrabold">Welcome, {user.name}</h1>
            <p className="mt-2 text-muted">
                You are signed in as <span className="rounded-full bg-tint px-3 py-1 text-sm font-bold text-primary-dark">{user.role}</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/doctors" className={ghostBtn}>Doctors</Link>
                {user.role === "admin" && (
                    <>
                        <Link to="/departments" className={ghostBtn}>Departments</Link>
                        <Link to="/admin" className={ghostBtn}>Staff and users</Link>
                    </>
                )}
                <button onClick={logout} className={primaryBtn}>Log out</button>
            </div>
        </main>
    );
}