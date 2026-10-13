import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Appointment from "../models/Appointment.js";
import PatientProfile from "../models/PatientProfile.js";
import Counter from "../models/counter.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { hospitalNow, isValidDate } from "../utils/slots.js";

const router = Router();
router.use(protect);

const profileSchema = z.object({
    dateOfBirth: z
        .string()
        .refine(isValidDate, "Enter a valid date of birth")
        .refine((d) => d >= "1900-01-01" && d <= hospitalNow().date, "Date of birth is out of range"),
    gender: z.enum(["female", "male", "other"], { message: "Choose a gender" }),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""]).optional().default(""),
    phone: z.string().trim().regex(/^[0-9+\-\s()]{0,20}$/, "Enter a valid phone number").optional().default(""),
    allergies: z.array(z.string().trim().min(1).max(60)).max(10, "At most 10 allergies").optional().default([]),
});

const shapeProfile = (p) =>
    p
        ? {
            patientId: p.patientId,
            dateOfBirth: p.dateOfBirth,
            gender: p.gender,
            bloodGroup: p.bloodGroup,
            phone: p.phone,
            allergies: p.allergies,
        }
        : null;

// Who may open this patient's record: the patient, staff, or a doctor who has an appointment with them
async function canView(user, patientId) {
    if (user.role === "admin" || user.role === "receptionist") return true;
    if (user.role === "patient") return String(user._id) === patientId;
    if (user.role === "doctor") {
        const profile = await DoctorProfile.findOne({ user: user._id });
        return !!profile && !!(await Appointment.exists({ doctor: profile._id, patient: patientId }));
    }
    return false;
}

// Who may change the demographic details: the patient themselves and front-desk staff
const canEdit = (user, patientId) =>
    user.role === "admin" || user.role === "receptionist" || (user.role === "patient" && String(user._id) === patientId);

router.get("/patients/:userId", async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: "Invalid id" });

    // "Not found" for anything the caller may not see, so ids cannot be probed
    if (!(await canView(req.user, userId))) return res.status(404).json({ message: "Patient not found" });
    const patient = await User.findOne({ _id: userId, role: "patient" });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const profile = await PatientProfile.findOne({ user: userId });
    res.json({
        patient: {
            id: patient._id,
            name: patient.name,
            ...(req.user.role === "doctor" ? {} : { email: patient.email }),
        },
        profile: shapeProfile(profile),
        canEdit: canEdit(req.user, userId),
    });
});

const guardEdit = (req, res, next) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: "Invalid id" });
    if (!canEdit(req.user, userId)) return res.status(403).json({ message: "You do not have access to this" });
    next();
};

router.put("/patients/:userId/profile", guardEdit, validate(profileSchema), async (req, res) => {
    const { userId } = req.params;
    const patient = await User.findOne({ _id: userId, role: "patient" });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    let profile = await PatientProfile.findOne({ user: userId });
    if (!profile) {
        // The counter increases atomically, so two patients never get the same number
        const counter = await Counter.findOneAndUpdate(
            { _id: "patient" },
            { $inc: { seq: 1 } },
            { upsert: true, new: true }
        );
        profile = new PatientProfile({ user: userId, patientId: `P-${10000 + counter.seq}` });
    }
    profile.set(req.body);
    await profile.save();
    res.json({ profile: shapeProfile(profile) });
});

export default router;