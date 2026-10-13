import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import DoctorProfile from "../models/DoctorProfile.js";
import Appointment from "../models/Appointment.js";
import PatientProfile from "../models/PatientProfile.js";
import Visit from "../models/Visit.js";
import { protect, requireRole } from "../middleware/auth.js";
import { validate, validId } from "../middleware/validate.js";
import { hospitalNow } from "../utils/slots.js";

const router = Router();
router.use(protect);

const num = (min, max) =>
    z.number().min(min, `Value must be at least ${min}`).max(max, `Value must be at most ${max}`).optional();
const text = (max) => z.string().trim().max(max, `Keep this under ${max} characters`).optional().default("");

const vitalsSchema = z
    .object({
        systolic: num(50, 260),
        diastolic: num(30, 160),
        pulse: num(20, 250),
        temperature: num(30, 45),
        oxygen: num(50, 100),
    })
    .refine(
        (v) => v.systolic === undefined || v.diastolic === undefined || v.systolic > v.diastolic,
        "Systolic pressure must be higher than diastolic"
    );

const clinical = z.object({
    vitals: vitalsSchema.optional().default({}),
    complaint: text(500),
    diagnosis: z.string().trim().min(2, "Enter a diagnosis").max(500),
    notes: text(2000),
    prescriptions: z
        .array(
            z.object({
                medicine: z.string().trim().min(1, "Enter the medicine name").max(80),
                dose: text(60),
                frequency: text(60),
                duration: text(60),
                instructions: text(200),
            })
        )
        .max(20, "At most 20 medicines")
        .optional()
        .default([]),
});
const createSchema = clinical.extend({
    appointment: z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid appointment"),
});

const myProfile = (req) => DoctorProfile.findOne({ user: req.user._id });

const shapeProfile = (p) =>
    p ? { patientId: p.patientId, dateOfBirth: p.dateOfBirth, gender: p.gender, allergies: p.allergies } : null;

const shapeVisit = (v) => ({
    id: v._id,
    appointmentId: v.appointment,
    date: v.date,
    doctor: v.doctor?.user?.name,
    specialty: v.doctor?.specialty,
    vitals: {
        systolic: v.vitals?.systolic,
        diastolic: v.vitals?.diastolic,
        pulse: v.vitals?.pulse,
        temperature: v.vitals?.temperature,
        oxygen: v.vitals?.oxygen,
    },
    complaint: v.complaint,
    diagnosis: v.diagnosis,
    notes: v.notes,
    prescriptions: v.prescriptions.map((p) => ({
        medicine: p.medicine,
        dose: p.dose,
        frequency: p.frequency,
        duration: p.duration,
        instructions: p.instructions,
    })),
});

// Everything the consultation form needs for one appointment
router.get("/consultation/:appointmentId", requireRole("doctor"), async (req, res) => {
    const { appointmentId } = req.params;
    if (!mongoose.isValidObjectId(appointmentId)) return res.status(400).json({ message: "Invalid id" });

    const profile = await myProfile(req);
    const appointment =
        profile && (await Appointment.findOne({ _id: appointmentId, doctor: profile._id }).populate("patient", "name"));
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const [patientProfile, visit] = await Promise.all([
        PatientProfile.findOne({ user: appointment.patient._id }),
        Visit.findOne({ appointment: appointment._id }),
    ]);
    res.json({
        today: hospitalNow().date,
        appointment: {
            id: appointment._id,
            date: appointment.date,
            time: appointment.slotStart,
            status: appointment.status,
            reason: appointment.reason,
        },
        patient: { id: appointment.patient._id, name: appointment.patient.name },
        profile: shapeProfile(patientProfile),
        visit: visit ? shapeVisit(visit) : null,
    });
});

router.post("/", requireRole("doctor"), validate(createSchema), async (req, res) => {
    const profile = await myProfile(req);
    if (!profile) return res.status(403).json({ message: "You do not have access to this" });

    const { appointment: appointmentId, ...data } = req.body;
    const appointment = await Appointment.findOne({ _id: appointmentId, doctor: profile._id });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.status === "cancelled") {
        return res.status(409).json({ message: "This appointment was cancelled" });
    }
    if (appointment.date > hospitalNow().date) {
        return res.status(400).json({ message: "This appointment is in the future" });
    }

    try {
        const visit = await Visit.create({
            ...data,
            appointment: appointment._id,
            patient: appointment.patient,
            doctor: profile._id,
            date: appointment.date,
        });
        if (appointment.status === "booked") {
            appointment.status = "completed";
            await appointment.save();
        }
        res.status(201).json({ id: visit._id });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "A consultation was already saved for this appointment" });
        }
        throw err;
    }
});

router.put("/:id", requireRole("doctor"), validId, validate(clinical), async (req, res) => {
    const profile = await myProfile(req);
    const visit = profile && (await Visit.findOne({ _id: req.params.id, doctor: profile._id }));
    if (!visit) return res.status(404).json({ message: "Consultation not found" });

    visit.vitals = req.body.vitals;
    visit.complaint = req.body.complaint;
    visit.diagnosis = req.body.diagnosis;
    visit.notes = req.body.notes;
    visit.prescriptions = req.body.prescriptions;
    await visit.save();
    res.json({ id: visit._id });
});

// Visit history for a patient record
router.get("/patient/:userId", async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: "Invalid id" });

    let filter;
    if (req.user.role === "patient") {
        if (String(req.user._id) !== userId) return res.status(404).json({ message: "Patient not found" });
        filter = { patient: userId };
    } else if (req.user.role === "doctor") {
        const profile = await myProfile(req);
        if (!profile) return res.json({ visits: [], restricted: false });
        filter = { patient: userId, doctor: profile._id }; // a doctor sees only their own consultations
    } else {
        return res.json({ visits: [], restricted: true }); // receptionist and admin: no clinical notes
    }

    const visits = await Visit.find(filter)
        .populate({ path: "doctor", populate: { path: "user", select: "name" } })
        .sort({ date: -1, createdAt: -1 })
        .limit(100);
    res.json({ visits: visits.map(shapeVisit), restricted: false });
});

export default router;