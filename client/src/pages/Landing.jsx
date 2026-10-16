import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { SITE } from "../site";

const PATHS = {
    cross: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    check: "M5 13l4 4L19 7",
    calendar: "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
    phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
    mail: "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 7l9 6 9-6",
    pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "M6 6l12 12M18 6L6 18",
    chat: "M21 11.5a8.4 8.4 0 01-12.4 7.4L3 20.5l1.7-5.4A8.5 8.5 0 1121 11.5z",
    heart: "M12 21s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.6-7 10-7 10z",
    pulse: "M3 12h4l2-6 4 12 2-6h6",
    shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
    steth: "M6 3v6a4 4 0 008 0V3M10 13v3a4 4 0 008 0v-2",
    up: "M7 17L17 7M8 7h9v9",
};

function Icon({ name, size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={PATHS[name]} />
        </svg>
    );
}

const digits = (s) => (s || "").replace(/[^\d+]/g, "");
const callable = (s) => digits(s).replace("+", "").length >= 5;

function PhoneText({ value, className = "" }) {
    return callable(value) ? (
        <a href={`tel:${digits(value)}`} className={className}>{value}</a>
    ) : (
        <span className={className}>{value}</span>
    );
}

const NAV = [
    ["#about", "About"],
    ["#doctors", "Doctors"],
    ["#how", "How it works"],
    ["#faq", "FAQ"],
    ["#contact", "Contact"],
];

const STEPS = [
    ["Choose a doctor", "Browse by department and find the right specialist."],
    ["Pick a free time", "Only open slots can be selected, so nobody is double booked."],
    ["Get your care", "Visit notes, prescriptions and invoices appear in your account."],
];

// Sample text for the demo. Replace with real feedback if the project ever goes live.
const REVIEWS = [
    ["Anna P.", "Teacher", "Booking was quick and simple. I picked a time that suited me and the doctor already had my history ready."],
    ["James L.", "Engineer", "The clinic feels organised. Costs were clear on my invoice and I could print it straight from my account."],
    ["Elena M.", "Accountant", "I could see my prescriptions online after the visit, so I did not have to call the clinic to ask."],
];

const FAQS = [
    ["How do I book an appointment online?", "Create a patient account, choose a doctor, pick a free time slot and confirm. You will see the booking in your account straight away."],
    ["Can I see my medical records online?", "Yes. After you sign in, your visit notes, prescriptions and invoices are in your patient account. Only you and your treating doctor can open them."],
    ["Can I cancel or reschedule?", "Yes. Open your appointments, cancel the booking and choose a new free slot."],
    ["How is my data protected?", "Each role only sees what it needs. Patients see their own data, doctors see only their own patients, and reception staff never see clinical notes."],
];

const AVATAR_BG = ["bg-primary", "bg-[#8B6CF0]", "bg-primary-dark", "bg-[#A78BFA]", "bg-[#5B3BD6]"];
const initials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark";
const ghost = "inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold hover:border-primary";
const pill = "inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-white";

function Avatars({ names, extra }) {
    return (
        <div className="flex">
            {names.map((n, i) => (
                <span key={n + i} className={`-ml-2 grid h-9 w-9 place-items-center rounded-full border-2 border-white text-[11px] font-bold text-white first:ml-0 ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                    {initials(n)}
                </span>
            ))}
            {extra && <span className="-ml-2 grid h-9 min-w-9 place-items-center rounded-full border-2 border-white bg-[#EC4899] px-1.5 text-[11px] font-bold text-white">{extra}</span>}
        </div>
    );
}

// Shows a photo from /public if it exists; otherwise a soft purple block.
function Photo({ src, alt, className = "" }) {
    const [failed, setFailed] = useState(false);
    if (failed) return <div className={`bg-gradient-to-br from-tint to-[#D4C8F8] ${className}`} role="img" aria-label={alt} />;
    return <img src={src} alt={alt} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}

export default function Landing() {
    const { user } = useAuth();
    const [overview, setOverview] = useState(null);
    const [dept, setDept] = useState("");
    const [menu, setMenu] = useState(false);
    const [open, setOpen] = useState(1);

    useEffect(() => {
        api
            .get("/public/overview")
            .then((res) => setOverview(res.data))
            .catch(() => setOverview({ counts: null, departments: [], doctors: [] }));
    }, []);

    const counts = overview?.counts;
    const stats = [
        ["Doctors", counts?.doctors],
        ["Departments", counts?.departments],
        ["Registered patients", counts?.patients],
        ["Completed visits", counts?.visits],
    ];
    const allDoctors = overview?.doctors ?? [];
    const doctors = allDoctors.filter((d) => !dept || d.department === dept);
    const wa = digits(SITE.whatsapp).replace("+", "");

    return (
        <div className="bg-[#E9E3FB] text-ink">
            <div className="mx-auto max-w-[1180px] p-3 sm:p-6" id="top">
                <div className="rounded-[28px] bg-white px-4 pb-6 pt-4 shadow-[0_20px_60px_rgba(26,18,64,.12)] sm:px-6">
                    {/* Navbar */}
                    <header className="relative">
                        <div className="flex items-center justify-between px-1 py-2">
                            <a href="#top" className="flex items-center gap-2.5 text-lg font-extrabold">
                                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white"><Icon name="cross" size={18} /></span>
                                {SITE.name}
                            </a>
                            <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex" aria-label="Main">
                                {NAV.map(([href, label]) => <a key={href} href={href} className="hover:text-primary">{label}</a>)}
                            </nav>
                            <div className="flex items-center gap-2">
                                {user ? (
                                    <Link to="/dashboard" className={primary}>Go to dashboard</Link>
                                ) : (
                                    <>
                                        <Link to="/login" className={`${ghost} hidden sm:inline-flex`}>Patient portal</Link>
                                        <Link to="/appointments/new" className={primary}>Book appointment</Link>
                                    </>
                                )}
                                <button type="button" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu} className="grid h-11 w-11 place-items-center rounded-xl border border-line lg:hidden">
                                    <Icon name={menu ? "close" : "menu"} />
                                </button>
                            </div>
                        </div>
                        {menu && (
                            <div className="absolute inset-x-0 top-full z-20 rounded-2xl border border-line bg-white p-4 shadow-lg lg:hidden">
                                {NAV.map(([href, label]) => (
                                    <a key={href} href={href} onClick={() => setMenu(false)} className="block min-h-11 py-3 text-base font-semibold">{label}</a>
                                ))}
                                {!user && <Link to="/login" className="block min-h-11 py-3 text-base font-semibold text-primary">Patient portal</Link>}
                            </div>
                        )}
                    </header>

                    {/* Hero */}
                    <section className="relative mt-3 overflow-hidden rounded-[22px] border border-line bg-gradient-to-b from-tint to-white px-5 pb-8 pt-14 text-center sm:px-10 md:pt-20">
                        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(700px_320px_at_50%_0%,rgba(109,74,232,.2),transparent_70%)]" />
                        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[18%] hidden border-l border-dashed border-line md:block" />
                        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-[18%] hidden border-r border-dashed border-line md:block" />
                        {[["heart", "left-[calc(18%-19px)] top-10"], ["pulse", "right-[calc(18%-19px)] top-10"]].map(([n, pos]) => (
                            <span key={n} aria-hidden="true" className={`absolute ${pos} hidden h-10 w-10 place-items-center rounded-xl border border-line bg-white text-primary shadow-sm md:grid`}><Icon name={n} size={18} /></span>
                        ))}

                        <h1 className="relative mx-auto max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight text-deep sm:text-5xl md:text-6xl">
                            Expert care, booked in minutes
                        </h1>
                        <p className="relative mx-auto mt-5 max-w-xl leading-relaxed text-muted">
                            Find a doctor, pick a free time, and keep your records, prescriptions and invoices in one secure place.
                        </p>
                        <div className="relative mt-7 flex flex-wrap justify-center gap-3">
                            <Link to="/appointments/new" className={primary}>Book appointment</Link>
                            <a href="#doctors" className={ghost}>Find your doctor</a>
                        </div>

                        <div className="relative mt-12 grid gap-4 text-left md:grid-cols-3 md:items-end">
                            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_10px_30px_rgba(26,18,64,.07)]">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-base font-bold">Our doctors</h2>
                                    <a href="#doctors" aria-label="See doctors" className="grid h-7 w-7 place-items-center rounded-lg border border-line"><Icon name="up" size={14} /></a>
                                </div>
                                <div className="mt-6">
                                    <Avatars names={allDoctors.slice(0, 5).map((d) => d.name)} />
                                </div>
                                <p className="mt-3 text-xs text-muted">
                                    {counts ? `${counts.doctors} doctors across ${counts.departments} departments` : "Doctors across all departments"}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5 shadow-[0_10px_30px_rgba(26,18,64,.07)]">
                                <div>
                                    <h2 className="text-base font-bold">Patients registered</h2>
                                    <p className="text-xs text-muted">Growing every day</p>
                                </div>
                                <div className="text-3xl font-medium tracking-tight text-primary">{counts?.patients ?? "-"}</div>
                            </div>

                            <div className="flex gap-4 rounded-2xl border border-line bg-white p-3 shadow-[0_10px_30px_rgba(26,18,64,.07)]">
                                <Photo src="/emergency.jpg" alt="Emergency care" className="h-36 w-32 shrink-0 rounded-xl" />
                                <div className="flex min-w-0 flex-col justify-between py-1">
                                    <h2 className="text-base font-bold">24-hour emergency</h2>
                                    <div>
                                        <PhoneText value={SITE.emergencyPhone} className="block break-words text-sm font-bold text-[#B42318]" />
                                        <p className="mt-1 text-xs text-muted">{SITE.hours}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <main>
                        {/* Departments strip */}
                        {overview?.departments?.length > 0 && (
                            <section className="mt-12 text-center">
                                <p className="text-sm text-muted">Departments at {SITE.name}</p>
                                <div className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3 font-semibold text-muted">
                                    {overview.departments.slice(0, 8).map((d) => (
                                        <span key={d.name ?? d} className="inline-flex items-center gap-2">
                                            <span className="h-5 w-5 rounded-md border border-line bg-tint" />
                                            {d.name ?? d}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* About */}
                        <section id="about" className="mt-20 scroll-mt-6 text-center">
                            <span className={pill}>About</span>
                            <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">Caring for you, backed by expertise</h2>
                            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted">{SITE.about}</p>
                            <Photo src="/about.jpg" alt="A doctor checking a patient's blood pressure" className="mt-8 h-64 w-full rounded-[20px] sm:h-96" />
                            <div className="mt-6 grid grid-cols-2 rounded-[22px] bg-primary py-8 text-white md:grid-cols-4">
                                {stats.map(([label, value], i) => (
                                    <div key={label} className={`px-4 py-3 text-center ${i % 2 === 1 ? "border-l border-white/20" : ""} md:border-l ${i === 0 ? "md:border-l-0" : ""} md:border-white/20`}>
                                        <div className="text-4xl font-medium tracking-tight md:text-5xl">{value ?? "-"}</div>
                                        <div className="mt-1 text-sm text-white/80">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Doctors */}
                        <section id="doctors" className="-mx-4 mt-20 scroll-mt-6 bg-tint px-4 pb-12 pt-14 text-center sm:-mx-6 sm:px-6">
                            <span className={pill}>Specialists</span>
                            <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">Meet our doctors</h2>
                            <p className="mx-auto mt-3 max-w-xl text-muted">Choose a department, pick a doctor and book a free time slot.</p>

                            {overview?.departments?.length > 0 && (
                                <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter doctors by department">
                                    {[{ name: "" }, ...overview.departments].map((d) => {
                                        const name = d.name ?? d;
                                        const on = dept === name;
                                        return (
                                            <button
                                                key={name || "all"}
                                                type="button"
                                                onClick={() => setDept(name)}
                                                aria-pressed={on}
                                                className={`min-h-9 rounded-full border px-4 text-sm font-semibold ${on ? "border-primary bg-primary text-white" : "border-line bg-white hover:border-primary"}`}
                                            >
                                                {name || "All"}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
                                {!overview && <p className="text-sm text-muted">Loading doctors...</p>}
                                {overview && doctors.length === 0 && (
                                    <p className="text-sm text-muted sm:col-span-2 lg:col-span-4">No doctors to show yet.</p>
                                )}
                                {doctors.map((d, i) => (
                                    <article key={d.name + i} className="rounded-2xl border border-line bg-white p-3">
                                        <div className={`grid h-44 place-items-center rounded-xl text-4xl font-bold text-white ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                                            {initials(d.name)}
                                        </div>
                                        <h3 className="mt-3 font-bold">{d.name}</h3>
                                        <p className="text-sm text-muted">{d.specialty}{d.department ? `, ${d.department}` : ""}</p>
                                        <Link to="/appointments/new" className={`mt-3 w-full text-primary ${ghost}`}>Book with this doctor</Link>
                                    </article>
                                ))}
                            </div>
                        </section>

                        {/* How it works */}
                        <section id="how" className="mt-20 scroll-mt-6 text-center">
                            <span className={pill}>How it works</span>
                            <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">Three steps to your visit</h2>
                            <ol className="mt-8 grid gap-4 text-left md:grid-cols-3">
                                {STEPS.map(([title, text], i) => (
                                    <li key={title} className="rounded-2xl bg-tint p-6">
                                        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary font-bold text-white">{i + 1}</span>
                                        <h3 className="mt-4 text-lg font-bold">{title}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        {/* Feedback (sample) */}
                        <section className="mt-20 text-center">
                            <span className={pill}>Feedback</span>
                            <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">What our patients say</h2>
                            <p className="mt-3 text-sm text-muted">Sample feedback shown for this demo project.</p>
                            <div className="mt-8 grid gap-4 text-left md:grid-cols-3">
                                {REVIEWS.map(([name, job, text], i) => (
                                    <figure key={name} className="flex flex-col justify-between gap-8 rounded-2xl bg-tint p-5">
                                        <blockquote className="text-sm leading-relaxed text-muted">{text}</blockquote>
                                        <figcaption className="flex items-center gap-3 text-sm font-bold">
                                            <span className={`grid h-9 w-9 place-items-center rounded-full text-xs text-white ${AVATAR_BG[i % AVATAR_BG.length]}`}>{initials(name)}</span>
                                            <span>{name}<span className="block text-xs font-normal text-muted">{job}</span></span>
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </section>

                        {/* FAQ */}
                        <section id="faq" className="mt-20 scroll-mt-6 text-center">
                            <span className={pill}>FAQs</span>
                            <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">Frequently asked questions</h2>
                            <p className="mx-auto mt-3 max-w-xl text-muted">Quick answers about booking, records and your data.</p>
                            <div className="mx-auto mt-8 max-w-3xl text-left">
                                {FAQS.map(([q, a], i) => {
                                    const isOpen = open === i;
                                    return (
                                        <div key={q} className="border-b border-line">
                                            <button
                                                type="button"
                                                onClick={() => setOpen(isOpen ? -1 : i)}
                                                aria-expanded={isOpen}
                                                className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-semibold"
                                            >
                                                {q}
                                                <Icon name={isOpen ? "minus" : "cross"} size={18} />
                                            </button>
                                            {isOpen && <p className="pb-5 pr-8 text-sm leading-relaxed text-muted">{a}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* CTA */}
                        <section className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[22px] bg-gradient-to-r from-deep to-primary px-6 py-10 text-white sm:flex-row sm:items-center sm:px-12">
                            <div>
                                <h2 className="text-3xl font-medium tracking-tight">Book your appointment today</h2>
                                <p className="mt-2 text-white/85">It takes about a minute.</p>
                            </div>
                            <Link to={user ? "/appointments/new" : "/register"} className="inline-flex min-h-11 items-center rounded-xl bg-white px-6 py-3.5 font-extrabold text-primary-dark">
                                {user ? "Book appointment" : "Create an account"}
                            </Link>
                        </section>
                    </main>

                    {/* Footer */}
                    <footer id="contact" className="mt-4 scroll-mt-6 rounded-[20px] bg-deep px-6 py-8 text-sm leading-loose text-white/70 sm:px-8">
                        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1.2fr]">
                            <div>
                                <div className="flex items-center gap-2.5 text-lg font-extrabold text-white">
                                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-deep"><Icon name="cross" size={16} /></span>
                                    {SITE.name}
                                </div>
                                <p className="mt-3 max-w-xs leading-relaxed">{SITE.about}</p>
                            </div>
                            <div>
                                <h3 className="mb-1 font-bold text-white">Quick links</h3>
                                <a href="#about" className="block hover:text-white">About us</a>
                                <a href="#doctors" className="block hover:text-white">Doctors</a>
                                <a href="#how" className="block hover:text-white">How it works</a>
                                <Link to="/login" className="block hover:text-white">Patient portal</Link>
                                <Link to="/register" className="block hover:text-white">Create an account</Link>
                            </div>
                            <div>
                                <h3 className="mb-1 font-bold text-white">Contact</h3>
                                <div className="flex items-start gap-2"><Icon name="pin" size={16} /> {SITE.address}</div>
                                <div className="flex items-center gap-2"><Icon name="phone" size={16} /> <PhoneText value={SITE.phone} /></div>
                                <div className="flex items-center gap-2"><Icon name="mail" size={16} /> {SITE.email}</div>
                                <div>Open hours: {SITE.hours}</div>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-white/15 pt-4 text-xs">
                            <span>Demo project, not a real hospital. All data shown is sample data.</span>
                            <span>&copy; {new Date().getFullYear()} {SITE.name}</span>
                        </div>
                    </footer>
                </div>
            </div>

            {wa.length >= 5 && (
                <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="fixed bottom-5 right-5 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1FA855] px-5 text-sm font-bold text-white shadow-lg"
                >
                    <Icon name="chat" size={18} /> WhatsApp us
                </a>
            )}
        </div>
    );
}