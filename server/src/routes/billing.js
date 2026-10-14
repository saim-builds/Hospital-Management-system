import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Appointment from "../models/Appointment.js";
import Invoice from "../models/Invoice.js";
import Counter from "../models/Counter.js";
import { protect, requireRole } from "../middleware/auth.js";
import { validate, validId } from "../middleware/validate.js";
import { hospitalNow } from "../utils/slots.js";

const CURRENCY = process.env.HOSPITAL_CURRENCY || "PKR";

const router = Router();
router.use(protect, requireRole("patient", "receptionist", "admin")); // doctors have no billing access
const staff = requireRole("receptionist", "admin");

const toMinor = (major) => Math.round(major * 100);
const isId = (v) => mongoose.isValidObjectId(v);

const createSchema = z.object({
    appointment: z.string().refine(isId, "Invalid appointment"),
    items: z
        .array(
            z.object({
                description: z.string().trim().min(1, "Enter a description for every line").max(120),
                quantity: z.number({ message: "Quantity must be a number" }).int("Quantity must be a whole number").min(1, "Quantity must be at least 1").max(100, "Quantity is too large"),
                unitPrice: z.number({ message: "Price must be a number" }).min(0, "Price cannot be negative").max(10000000, "Price is too large"),
            })
        )
        .min(1, "Add at least one line")
        .max(20, "At most 20 lines"),
    notes: z.string().trim().max(300).optional().default(""),
});
const paySchema = z.object({ method: z.enum(["cash", "card", "online"], { message: "Choose a payment method" }) });

const populate = [
    { path: "patient", select: "name" },
    {
        path: "appointment",
        select: "date slotStart doctor",
        populate: {
            path: "doctor",
            populate: [
                { path: "user", select: "name" },
                { path: "department", select: "name" },
            ],
        },
    },
];

const shape = (inv) => ({
    id: inv._id,
    number: inv.number,
    issuedOn: inv.issuedOn,
    status: inv.status,
    currency: inv.currency,
    total: inv.total,
    notes: inv.notes,
    paidAt: inv.paidAt,
    paymentMethod: inv.paymentMethod,
    items: inv.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.quantity * i.unitPrice,
    })),
    patient: { id: inv.patient?._id, name: inv.patient?.name },
    visit: inv.appointment
        ? {
            date: inv.appointment.date,
            time: inv.appointment.slotStart,
            doctor: inv.appointment.doctor?.user?.name,
            department: inv.appointment.doctor?.department?.name,
        }
        : null,
});

// Prefill for the "create invoice" form. Must stay above "/:id".
router.get("/draft/:appointmentId", staff, async (req, res) => {
    const { appointmentId } = req.params;
    if (!isId(appointmentId)) return res.status(400).json({ message: "Invalid id" });

    const appointment = await Appointment.findById(appointmentId)
        .populate("patient", "name")
        .populate({
            path: "doctor",
            populate: [
                { path: "user", select: "name" },
                { path: "department", select: "name" },
            ],
        });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.status !== "completed") {
        return res.status(409).json({ message: "Invoices can only be created for completed appointments" });
    }

    const existing = await Invoice.findOne({ appointment: appointment._id, current: true }).select("_id");
    res.json({
        existingInvoiceId: existing ? existing._id : null,
        currency: CURRENCY,
        appointment: { id: appointment._id, date: appointment.date, time: appointment.slotStart },
        patient: { id: appointment.patient._id, name: appointment.patient.name },
        doctor: { name: appointment.doctor?.user?.name, department: appointment.doctor?.department?.name },
        suggestedItems: [
            {
                description: `Consultation, Dr. ${appointment.doctor?.user?.name}`,
                quantity: 1,
                unitPrice: appointment.doctor?.consultationFee || 0, // in whole currency units
            },
        ],
    });
});

router.post("/", staff, validate(createSchema), async (req, res) => {
    const appointment = await Appointment.findById(req.body.appointment);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.status !== "completed") {
        return res.status(409).json({ message: "Invoices can only be created for completed appointments" });
    }

    // The server calculates every amount. The browser never sends a total.
    const items = req.body.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: toMinor(i.unitPrice),
    }));
    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const counter = await Counter.findOneAndUpdate({ _id: "invoice" }, { $inc: { seq: 1 } }, { upsert: true, new: true });
    try {
        const invoice = await Invoice.create({
            number: `INV-${1000 + counter.seq}`,
            patient: appointment.patient,
            appointment: appointment._id,
            items,
            total,
            currency: CURRENCY,
            issuedOn: hospitalNow().date,
            notes: req.body.notes,
            createdBy: req.user._id,
        });
        res.status(201).json({ id: invoice._id });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "An invoice already exists for this appointment" });
        }
        throw err;
    }
});

router.get("/", async (req, res) => {
    const filter = {};
    if (req.user.role === "patient") filter.patient = req.user._id;
    if (["unpaid", "paid", "void"].includes(req.query.status)) filter.status = req.query.status;

    const invoices = await Invoice.find(filter).populate(populate).sort({ createdAt: -1 }).limit(100);

    const base = req.user.role === "patient" ? { patient: req.user._id } : {};
    const [owed] = await Invoice.aggregate([
        { $match: { ...base, status: "unpaid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    res.json({ invoices: invoices.map(shape), outstanding: owed?.total || 0, currency: CURRENCY });
});

router.get("/:id", validId, async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    // Patients get "not found" for other people's invoices, so ids cannot be probed
    if (!invoice || (req.user.role === "patient" && String(invoice.patient) !== String(req.user._id))) {
        return res.status(404).json({ message: "Invoice not found" });
    }
    await invoice.populate(populate);
    res.json({ invoice: shape(invoice) });
});

router.patch("/:id/pay", staff, validId, validate(paySchema), async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status !== "unpaid") {
        return res.status(409).json({ message: "Only unpaid invoices can be marked as paid" });
    }
    invoice.status = "paid";
    invoice.paidAt = new Date();
    invoice.paymentMethod = req.body.method;
    await invoice.save();
    res.json({ ok: true });
});

router.patch("/:id/void", staff, validId, async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status !== "unpaid") {
        return res.status(409).json({ message: "Only unpaid invoices can be voided" });
    }
    invoice.status = "void";
    invoice.current = false;
    await invoice.save();
    res.json({ ok: true });
});

export default router;