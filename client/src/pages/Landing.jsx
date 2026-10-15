import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { SITE } from "../site";

const PATHS = {
    cross: "M12 5v14M5 12h14",
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "M6 6l12 12M18 6L6 18",
    check: "M5 13l4 4L19 7",
    calendar: "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
    file: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
    pill: "M10.5 20.5l10-10a4.2 4.2 0 00-6-6l-10 10a4.2 4.2 0 006 6zM8.5 8.5l7 7",
    receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
    doctor: "M12 12a4 4 0 100-8 4 4 0 000 8zM5 21v-1a5 5 0 015-5h4a5 5 0 015 5v1",
    shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
    phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
};

function Icon({ name, size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={PATHS[name]} />
        </svg>
    );
}

const SERVICES = [
    ["calendar", "bg-tint text-primary-dark", "Online appointments", "Choose a doctor and a free time slot in a few clicks."],
    ["doctor", "bg-green-100 text-green-800", "Specialist doctors", "See each doctor's department, specialty, and working hours."],
    ["file", "bg-amber-100 text-amber-800", "Your health record", "Visits, vitals, and diagnoses kept in one private place."],
    ["pill", "bg-tint text-primary-dark", "Prescriptions online", "Find your latest prescriptions whenever you need them."],
    ["receipt", "bg-red-100 text-red-800", "Clear billing", "See what you owe and print your invoices."],
    ["shield", "bg-green-100 text-green-800", "Private by design", "Patients and staff only see what their role allows."],
];

const STEPS = [
    ["Choose a doctor", "Browse by department and find a specialist."],
    ["Pick a free time", "Only open slots can be selected, so no double bookings."],
    ["Get your care", "Your visit, prescriptions, and invoice all appear in your account."],
];

const initials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default function Landing() {
    const { user } = useAuth();
    const [overview, setOverview] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        api
            .get("/public/overview")
            .then((res) => setOverview(res.data))
            .catch(() => setOverview({ departments: [], doctors: [] }));
    }, []);

    const primary = "inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark";
    const ghost = "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#C5D6DD] bg-white px-5 py-3 text-sm font-bold";

    return (
        <div className="bg-white text-ink">
            <div className="bg-[#B42318] text-sm text-white">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 py-2.5">
                    <span className="inline-flex items-center gap-2 font-bold"><Icon name="phone" size={16} /> Emergency: {SITE.emergencyPhone}</span>
                    <span>Open hours: {SITE.hours}</span>
                </div>
            </div>

            <header className="border-b border-line">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <a href="#top" className="flex items-center gap-2.5 text-xl font-extrabold">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"><Icon name="cross" size={20} /></span>
                        {SITE.name}
                    </a>
                    <nav className="hidden gap-7 text-sm font-semibold md:flex" aria-label="Sections">
                        <a href="#services" className="hover:text-primary">Services</a>
                        <a href="#doctors" className="hover:text-primary">Doctors</a>
                        <a href="#how" className="hover:text-primary">How it works</a>
                        <a href="#contact" className="hover:text-primary">Contact</a>
                    </nav>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-line md:hidden"
                    >
                        <Icon name={menuOpen ? "close" : "menu"} size={21} />
                    </button>
                    <div className="hidden gap-3 md:flex">
                        {user ? (
                            <Link to="/dashboard" className={primary}>Go to dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" className={ghost}>Patient portal</Link>
                                <Link to="/appointments/new" className={primary}>Book appointment</Link>
                            </>
                        )}
                    </div>
                </div>
                {menuOpen && (
                    <div className="border-t border-line bg-white px-6 py-4 md:hidden">
                        <nav className="flex flex-col gap-1 text-sm font-semibold" aria-label="Mobile sections">
                            <a href="#services" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-surface">Services</a>
                            <a href="#doctors" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-surface">Doctors</a>
                            <a href="#how" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-surface">How it works</a>
                            <a href="#contact" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-surface">Contact</a>
                        </nav>
                        <div className="mt-3 flex flex-col gap-3 border-t border-line pt-4">
                            {user ? (
                                <Link to="/dashboard" className={primary}>Go to dashboard</Link>
                            ) : (
                                <>
                                    <Link to="/login" className={ghost}>Patient portal</Link>
                                    <Link to="/appointments/new" className={primary}>Book appointment</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <main id="top">
                <section className="bg-gradient-to-b from-tint to-white">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-6 py-16 md:py-20">
                        <div className="min-w-0 flex-1 basis-96">
                            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">Your health, in caring hands</h1>
                            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
                                Book a doctor online, keep your records and prescriptions in one place, and skip the waiting on the phone.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link to="/appointments/new" className={primary}>Book appointment</Link>
                                <a href="#doctors" className={ghost}>Find a doctor</a>
                            </div>
                            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
                                {["Online booking", "Digital records", "Printable invoices"].map((t) => (
                                    <li key={t} className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-800"><Icon name="check" size={14} /></span>
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="relative hidden h-[400px] w-full max-w-md flex-1 basis-80 sm:block" aria-hidden="true">
                            <div className="absolute right-0 top-5 h-80 w-80 rounded-full bg-gradient-to-br from-[#BFE6F0] to-tint" />
                            <div className="absolute right-12 top-0 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white"><Icon name="cross" size={30} /></div>
                            <div className="absolute left-0 top-24 w-72 rounded-2xl border border-line bg-white p-5 shadow-xl">
                                <div className="text-xs font-bold text-muted">UPCOMING APPOINTMENT</div>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tint font-extrabold text-primary-dark">AR</div>
                                    <div className="text-sm leading-snug"><b>Dr. Ayesha Rahman</b><br /><span className="text-muted">Cardiology</span></div>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm">
                                    <span>Tue, 10:30</span>
                                    <span className="rounded-full bg-tint px-3 py-1 text-xs font-bold text-primary-dark">booked</span>
                                </div>
                            </div>
                            <div className="absolute bottom-5 right-0 flex w-60 items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-xl">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-800"><Icon name="check" /></span>
                                <div className="text-sm leading-snug"><b>Prescription ready</b><br /><span className="text-muted">See it in your record</span></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="services" className="mx-auto max-w-6xl scroll-mt-4 px-6 py-16">
                    <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Everything for your visit</h2>
                    <p className="mt-2 text-muted">Simple tools for patients, doctors, and the front desk.</p>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {SERVICES.map(([icon, tone, title, text]) => (
                            <div key={title} className="rounded-2xl border border-line bg-white p-7">
                                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}><Icon name={icon} size={22} /></span>
                                <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                                <p className="mt-2 leading-relaxed text-muted">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="doctors" className="scroll-mt-4 bg-surface">
                    <div className="mx-auto max-w-6xl px-6 py-16">
                        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Meet our doctors</h2>
                        {overview?.departments.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {overview.departments.map((d) => (
                                    <span key={d.id} className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold">{d.name}</span>
                                ))}
                            </div>
                        )}
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {!overview && <p className="text-sm text-muted">Loading doctors...</p>}
                            {overview?.doctors.length === 0 && (
                                <p className="text-sm text-muted">Doctors will appear here once their profiles are added.</p>
                            )}
                            {overview?.doctors.map((d) => (
                                <div key={d.id} className="rounded-2xl border border-line bg-white p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tint text-lg font-extrabold text-primary-dark">{initials(d.name)}</div>
                                        <div className="min-w-0">
                                            <div className="font-extrabold">{d.name}</div>
                                            <div className="text-sm text-muted">{d.specialty}, {d.department}</div>
                                        </div>
                                    </div>
                                    <Link to="/appointments/new" className={`mt-5 ${ghost}`}>Book with this doctor</Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="how" className="mx-auto max-w-6xl scroll-mt-4 px-6 py-16">
                    <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">How booking works</h2>
                    <div className="mt-10 grid gap-10 md:grid-cols-3">
                        {STEPS.map(([title, text], i) => (
                            <div key={title}>
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-extrabold text-white">{i + 1}</div>
                                <h3 className="mt-4 text-xl font-extrabold">{title}</h3>
                                <p className="mt-1.5 leading-relaxed text-muted">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 pb-16">
                    <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-10 text-white md:p-14">
                        <div>
                            <div className="text-3xl font-extrabold tracking-tight">Book your visit today</div>
                            <div className="mt-2 opacity-90">It takes about a minute.</div>
                        </div>
                        <Link to={user ? "/appointments/new" : "/register"} className="inline-flex min-h-11 items-center rounded-xl bg-white px-6 py-3.5 font-extrabold text-primary-dark">
                            {user ? "Book appointment" : "Create an account"}
                        </Link>
                    </div>
                </section>
            </main>

            <footer id="contact" className="bg-ink text-sm leading-loose text-[#B9CDD6]">
                <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-8 px-6 py-12">
                    <div>
                        <div className="text-xl font-extrabold text-white">{SITE.name}</div>
                        {SITE.address}<br />{SITE.phone}<br />{SITE.email}
                    </div>
                    <div>
                        <Link to="/login" className="hover:text-white">Log in</Link><br />
                        <Link to="/register" className="hover:text-white">Create an account</Link><br />
                        <a href="#services" className="hover:text-white">Services</a>
                    </div>
                    <div className="max-w-xs">Demo project. This is not a real hospital and shows sample data only.</div>
                </div>
            </footer>
        </div>
    );
}