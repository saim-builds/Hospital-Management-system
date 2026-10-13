import { Router } from "express";
import User from "../models/User.js";
import Department from "../models/Department.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Appointment from "../models/Appointment.js";
import Visit from "../models/Visit.js";
import { protect } from "../middleware/auth.js";
import { hospitalNow, toMinutes } from "../utils/slots.js";

const router = Router();
router.use(protect);

const populateDoctor = {
    path: "doctor",
    populate: [
        { path: "user", select: "name" },
        { path: "department", select: "name" },
    ],
};

const row = (a) => ({
    id: a._id,
    date: a.date,
    time: a.slotStart,
    status: a.status,
    reason: a.reason,
    patient: a.patient ? { id: a.patient._id, name: a.patient.name } : null,
    doctor: a.doctor
        ? { name: a.doctor.user?.name, specialty: a.doctor.specialty, department: a.doctor.department?.name }
        : null,
});

const find = (filter) =>
    Appointment.find(filter).populate("patient", "name").populate(populateDoctor).sort({ date: 1, slotStart: 1 });

router.get("/", async (req, res) => {
    const now = hospitalNow();
    const today = now.date;
    const role = req.user.role;

    if (role === "patient") {
        const [upcoming, completed, latestVisit] = await Promise.all([
            find({ patient: req.user._id, status: "booked", date: { $gte: today } }).limit(5),
            Appointment.countDocuments({ patient: req.user._id, status: "completed" }),
            Visit.findOne({ patient: req.user._id }).sort({ date: -1, createdAt: -1 }),
        ]);
        return res.json({
            role,
            today,
            stats: [
                { label: "Upcoming appointments", value: upcoming.length },
                { label: "Completed visits", value: completed },
            ],
            appointments: upcoming.map(row),
            prescriptions: latestVisit
                ? {
                    date: latestVisit.date,
                    items: latestVisit.prescriptions.map((p) => ({
                        medicine: p.medicine,
                        dose: p.dose,
                        frequency: p.frequency,
                        duration: p.duration,
                    })),
                }
                : null,
        });
    }

    if (role === "doctor") {
        const profile = await DoctorProfile.findOne({ user: req.user._id });
        if (!profile) {
            return res.json({
                role,
                today,
                stats: [],
                appointments: [],
                note: "Your doctor profile has not been set up yet. Ask the admin to create it.",
            });
        }
        const todays = await find({ doctor: profile._id, date: today });
        const booked = todays.filter((a) => a.status === "booked");
        const next = booked.find((a) => toMinutes(a.slotStart) >= now.minutes) || null;
        return res.json({
            role,
            today,
            stats: [
                { label: "Today's appointments", value: todays.length },
                { label: "Waiting", value: booked.length },
                { label: "Completed today", value: todays.filter((a) => a.status === "completed").length },
            ],
            next: next ? row(next) : null,
            appointments: todays.map(row),
        });
    }

    // Receptionist and admin: everything happening today
    const todays = await find({ date: today }).limit(100);
    const stats = [
        { label: "Today's appointments", value: todays.length },
        { label: "Booked", value: todays.filter((a) => a.status === "booked").length },
        { label: "Completed", value: todays.filter((a) => a.status === "completed").length },
        { label: "Cancelled", value: todays.filter((a) => a.status === "cancelled").length },
    ];
    if (role === "admin") {
        const [patients, doctors, departments, staff] = await Promise.all([
            User.countDocuments({ role: "patient", isActive: true }),
            DoctorProfile.countDocuments({ isActive: true }),
            Department.countDocuments({ isActive: true }),
            User.countDocuments({ role: { $in: ["doctor", "receptionist"] }, isActive: true }),
        ]);
        stats.push(
            { label: "Patients", value: patients },
            { label: "Doctors with profiles", value: doctors },
            { label: "Departments", value: departments },
            { label: "Staff accounts", value: staff }
        );
    }
    res.json({ role, today, stats, appointments: todays.map(row) });
});

export default router;