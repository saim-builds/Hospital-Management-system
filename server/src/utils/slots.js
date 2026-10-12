const TZ = process.env.HOSPITAL_TZ || "Asia/Karachi";

export const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// Current date and time of day at the hospital
export function hospitalNow() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    return {
        date: `${get("year")}-${get("month")}-${get("day")}`,
        minutes: Number(get("hour")) * 60 + Number(get("minute")),
    };
}

export function isValidDate(s) {
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export const weekday = (s) => new Date(`${s}T00:00:00Z`).getUTCDay();

export function addDays(s, n) {
    const d = new Date(`${s}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

// Returns an error message, or null if the date can be booked
export function checkDate(s) {
    const today = hospitalNow().date;
    if (s < today) return "That date has already passed";
    if (s > addDays(today, 60)) return "Appointments can be booked up to 60 days ahead";
    return null;
}

export function slotTimes(profile) {
    const out = [];
    for (let m = toMinutes(profile.startTime); m + profile.slotMinutes <= toMinutes(profile.endTime); m += profile.slotMinutes) {
        out.push(fmt(m));
    }
    return out;
}