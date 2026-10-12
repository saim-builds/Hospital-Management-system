import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Appointment from "../models/Appointment.js";
import { protect, requireRole } from "../middleware/auth.js";
import { validate, validId } from "../middleware/validate.js";
import { hospitalNow, isValidDate, weekday, checkDate, slotTimes, toMinutes } from "../utils/slots.js";

const router = Router();
router.use(protect);

const populateDoctor = [
    { path: "user", select: "name isActive" },
    { path: "department", select: "name isActive" },
];
const bookable = (p) => p && p.isActive && p.user?.isActive && p.department?.isActive;
const isId = (v) => typeof v === "string" && mongoose.isValidObjectId(v);

const shape = (a) => ({
    id: a._id,
    date: a.date,
    time: a.slotStart,
    status: a.status,
    reason: a.reason,
    patient: a.patient ? { id: a.patient._id, name: a.patient.name } : null,
    doctor: a.doctor
        ? {
            id: a.doctor._id,
            name: a.doctor.user?.name,
            specialty: a.doctor.specialty,
            department: a.doctor.department?.name,
        }
        : null,
});

const bookSchema = z.object({
    doctor: z.string().refine((v) => mongoose.isValidObjectId(v), "Choose a doctor"),
    date: z.string().refine(isValidDate, "Choose a valid date"),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time slot"),
    reason: z.string().trim().max(200, "Keep the reason under 200 characters").optional().default(""),
    patient: z.string().refine((v) => mongoose.isValidObjectId(v), "Choose a patient").optional(),
});

// Free and booked slots for one doctor on one date
router.get("/slots", async (req, res) => {
    const { doctor, date } = req.query;
    if (!isId(doctor) || !isValidDate(date)) {
        return res.status(400).json({ message: "Choose a doctor and a date" });
    }
    const dateError = checkDate(date);
    if (dateError) return res.status(400).json({ message: dateError });

    const profile = await DoctorProfile.findById(doctor).populate(populateDoctor);
    if (!bookable(profile)) return res.status(404).json({ message: "Doctor not found" });
    if (!profile.workingDays.includes(weekday(date))) {
        return res.json({ slots: [], note: "This doctor does not work on the chosen day." });
    }

    const booked = await Appointment.find({ doctor: profile._id, date, status: "booked" }).select("slotStart");
    const taken = new Set(booked.map((a) => a.slotStart));
    const now = hospitalNow();
    const slots = slotTimes(profile).map((time) => ({
        time,
        available: !taken.has(time) && !(date === now.date && toMinutes(time) <= now.minutes),
    }));
    res.json({ slots });
});

router.post("/", requireRole("patient", "receptionist"), validate(bookSchema), async (req, res) => {
    const { doctor, date, time, reason, patient } = req.body;

    const dateError = checkDate(date);
    if (dateError) return res.status(400).json({ message: dateError });

    // Patients can only book for themselves. Receptionists choose the patient.
    let patientId = req.user._id;
    if (req.user.role === "receptionist") {
        if (!patient) return res.status(400).json({ message: "Choose a patient" });
        const found = await User.findOne({ _id: patient, role: "patient", isActive: true });
        if (!found) return res.status(400).json({ message: "Choose a valid patient" });
        patientId = found._id;
    }

    const profile = await DoctorProfile.findById(doctor).populate(populateDoctor);
    if (!bookable(profile)) return res.status(404).json({ message: "Doctor not found" });
    if (!profile.workingDays.includes(weekday(date))) {
        return res.status(400).json({ message: "This doctor does not work on the chosen day" });
    }
    if (!slotTimes(profile).includes(time)) {
        return res.status(400).json({ message: "That time is not one of the doctor's slots" });
    }
    const now = hospitalNow();
    if (date === now.date && toMinutes(time) <= now.minutes) {
        return res.status(400).json({ message: "That time has already passed" });
    }

    try {
        const appointment = await Appointment.create({
            patient: patientId,
            doctor: profile._id,
            date,
            slotStart: time,
            reason,
            bookedBy: req.user._id,
        });
        res.status(201).json({ id: appointment._id });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "That slot was just taken. Please choose another." });
        }
        throw err;
    }
});

router.get("/", async (req, res) => {
    const filter = {};
    if (req.user.role === "patient") {
        filter.patient = req.user._id;
    } else if (req.user.role === "doctor") {
        const profile = await DoctorProfile.findOne({ user: req.user._id });
        if (!profile) return res.json({ today: hospitalNow().date, appointments: [] });
        filter.doctor = profile._id;
    }
    if (isValidDate(req.query.date)) filter.date = req.query.date;
    if (["booked", "completed", "cancelled"].includes(req.query.status)) filter.status = req.query.status;

    const appointments = await Appointment.find(filter)
        .populate("patient", "name")
        .populate({ path: "doctor", populate: populateDoctor })
        .sort({ date: 1, slotStart: 1 })
        .limit(200);
    res.json({ today: hospitalNow().date, appointments: appointments.map(shape) });
});

router.patch("/:id/cancel", requireRole("patient", "receptionist", "admin"), validId, async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    // Patients get "not found" for other people's appointments, so ids cannot be probed
    if (!appointment || (req.user.role === "patient" && String(appointment.patient) !== String(req.user._id))) {
        return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.status !== "booked") {
        return res.status(409).json({ message: "Only booked appointments can be cancelled" });
    }
    appointment.status = "cancelled";
    appointment.cancelledBy = req.user._id;
    await appointment.save();
    res.json({ ok: true });
});

router.patch("/:id/complete", requireRole("doctor"), validId, async (req, res) => {
    const profile = await DoctorProfile.findOne({ user: req.user._id });
    const appointment = profile && (await Appointment.findOne({ _id: req.params.id, doctor: profile._id }));
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.status !== "booked") {
        return res.status(409).json({ message: "Only booked appointments can be completed" });
    }
    if (appointment.date > hospitalNow().date) {
        return res.status(400).json({ message: "This appointment is in the future" });
    }
    appointment.status = "completed";
    await appointment.save();
    res.json({ ok: true });
});

export default router;