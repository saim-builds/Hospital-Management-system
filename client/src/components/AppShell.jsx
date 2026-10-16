import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ICONS = {
    home: "M3 12l9-8 9 8M5 10v10h14V10",
    calendar: "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
    plus: "M12 5v14M5 12h14",
    users: "M16 20v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM20 20v-1a4 4 0 00-3-3.8",
    doctor: "M12 12a4 4 0 100-8 4 4 0 000 8zM5 21v-1a5 5 0 015-5h4a5 5 0 015 5v1",
    building: "M4 21V5l8-3 8 3v16M9 21v-5h6v5M9 9h.01M15 9h.01M9 13h.01M15 13h.01",
    shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
    file: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "M6 6l12 12M18 6L6 18",
    receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
};

function Icon({ name, size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONS[name]} />
        </svg>
    );
}

function navFor(user) {
    const items = [{ to: "/dashboard", label: "Dashboard", icon: "home", end: true }];
    items.push({ to: "/appointments", label: "Appointments", icon: "calendar", end: true });
    if (user.role === "patient" || user.role === "receptionist") {
        items.push({ to: "/appointments/new", label: "Book appointment", icon: "plus" });
    }
    if (user.role === "receptionist" || user.role === "admin") {
        items.push({ to: "/patients", label: "Patients", icon: "users" });
    }
    if (user.role === "patient") {
        items.push({ to: `/patients/${user.id}`, label: "My record", icon: "file" });
    }
    if (user.role !== "doctor")
        items.push({ to: "/billing", label: "Billing", icon: "receipt" });
    items.push({ to: "/doctors", label: "Doctors", icon: "doctor" });
    if (user.role === "admin") {
        items.push({ to: "/departments", label: "Departments", icon: "building" });
        items.push({ to: "/admin", label: "Staff and users", icon: "shield" });
    }
    return items;
}

const linkClass = ({ isActive }) =>
    `flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-3 text-sm ${isActive ? "bg-tint font-bold text-primary-dark" : "font-medium text-muted hover:bg-surface"
    }`;

export default function AppShell() {
    const { user, logout } = useAuth();
    const location = useLocation();
    // The mobile menu is open only for the page it was opened on, so it closes after navigating
    const [openFor, setOpenFor] = useState(null);
    const open = openFor === location.pathname;
    const items = navFor(user);
    const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

    const logo = (
        <span className="flex items-center gap-2.5 text-xl font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"><Icon name="plus" size={20} /></span>
            Medora
        </span>
    );

    return (
        <div className="flex min-h-screen bg-surface">
            <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-line bg-white p-4 md:flex">
                <div className="px-2 pb-6 pt-2">{logo}</div>
                <nav className="flex flex-col gap-1" aria-label="Main">
                    {items.map((i) => (
                        <NavLink key={i.to} to={i.to} end={i.end} className={linkClass}>
                            <Icon name={i.icon} /> {i.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="no-print flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
                    <button
                        onClick={() => setOpenFor(open ? null : location.pathname)}
                        aria-label={open ? "Close menu" : "Open menu"}
                        aria-expanded={open}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-line md:hidden"
                    >
                        <Icon name={open ? "close" : "menu"} size={20} />
                    </button>
                    <div className="md:hidden">{logo}</div>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="hidden text-right text-sm leading-tight sm:block">
                            <b>{user.name}</b>
                            <br />
                            <span className="text-muted">{user.role}</span>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tint text-sm font-extrabold text-primary-dark">{initials}</div>
                        <button onClick={logout} className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold">Log out</button>
                    </div>
                </header>

                {open && (
                    <nav className="no-print border-b border-line bg-white p-3 md:hidden" aria-label="Mobile">
                        {items.map((i) => (
                            <NavLink key={i.to} to={i.to} end={i.end} className={linkClass}>
                                <Icon name={i.icon} /> {i.label}
                            </NavLink>
                        ))}
                    </nav>
                )}

                <div className="min-w-0 flex-1">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}