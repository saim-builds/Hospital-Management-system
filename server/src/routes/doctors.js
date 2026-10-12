import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.js";
import Department from "../models/department.js";
import DoctorProfile from "../models/DoctorProfile.js";
import { protect, requireRole } from "../middleware/auth.js";
import { validate, validId } from "../middleware/validate.js";

const router = Router();
router.use(protect);

const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use the HH:MM time format");
const objectId = (msg) => z.string().refine((v) => mongoose.isValidObjectId(v), msg);

const base = z.object({
  department: objectId("Choose a department"),
  specialty: z.string().trim().min(2, "Enter a specialty").max(80),
  workingDays: z.array(z.number().int().min(0).max(6)).min(1, "Choose at least one working day").max(7),
  startTime: time,
  endTime: time,
  slotMinutes: z.number().refine((v) => [15, 20, 30, 45, 60].includes(v), "Choose a slot length"),
  consultationFee: z.number().min(0, "Fee cannot be negative").max(1000000),
});
const scheduleRule = [
  (d) => toMinutes(d.endTime) - toMinutes(d.startTime) >= d.slotMinutes,
  { message: "Working hours must fit at least one slot", path: ["endTime"] },
];
const createSchema = base.extend({ user: objectId("Choose a doctor") }).refine(...scheduleRule);
const updateSchema = base.refine(...scheduleRule);

const populate = [
  { path: "user", select: "name email isActive" },
  { path: "department", select: "name isActive" },
];

const shape = (p, isAdmin) => ({
  id: p._id,
  userId: p.user?._id,
  name: p.user?.name,
  ...(isAdmin ? { email: p.user?.email } : {}),
  department: p.department ? { id: p.department._id, name: p.department.name } : null,
  specialty: p.specialty,
  workingDays: p.workingDays,
  startTime: p.startTime,
  endTime: p.endTime,
  slotMinutes: p.slotMinutes,
  consultationFee: p.consultationFee,
  isActive: p.isActive,
});

const cleanDays = (days) => [...new Set(days)].sort((a, b) => a - b);

router.get("/", async (req, res) => {
  const isAdmin = req.user.role === "admin";
  let profiles = await DoctorProfile.find(isAdmin ? {} : { isActive: true })
    .populate(populate)
    .sort({ createdAt: -1 });
  if (!isAdmin) profiles = profiles.filter((p) => p.user?.isActive && p.department?.isActive);
  res.json({ doctors: profiles.map((p) => shape(p, isAdmin)) });
});

// Doctor accounts that do not have a profile yet (must stay above "/:id")
router.get("/available-users", requireRole("admin"), async (req, res) => {
  const taken = await DoctorProfile.distinct("user");
  const users = await User.find({ role: "doctor", isActive: true, _id: { $nin: taken } }).sort({ name: 1 });
  res.json({ users: users.map((u) => ({ id: u._id, name: u.name, email: u.email })) });
});

router.post("/", requireRole("admin"), validate(createSchema), async (req, res) => {
  const { user: userId, department: departmentId, workingDays, ...rest } = req.body;

  const user = await User.findById(userId);
  if (!user || user.role !== "doctor" || !user.isActive) {
    return res.status(400).json({ message: "Choose a valid doctor account" });
  }
  const department = await Department.findById(departmentId);
  if (!department || !department.isActive) {
    return res.status(400).json({ message: "Choose an active department" });
  }
  if (await DoctorProfile.exists({ user: userId })) {
    return res.status(409).json({ message: "This doctor already has a profile" });
  }

  const profile = await DoctorProfile.create({
    ...rest,
    user: userId,
    department: departmentId,
    workingDays: cleanDays(workingDays),
  });
  await profile.populate(populate);
  res.status(201).json({ doctor: shape(profile, true) });
});

router.patch("/:id", requireRole("admin"), validId, validate(updateSchema), async (req, res) => {
  const profile = await DoctorProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ message: "Doctor profile not found" });

  const { department: departmentId, workingDays, ...rest } = req.body;
  const department = await Department.findById(departmentId);
  if (!department || !department.isActive) {
    return res.status(400).json({ message: "Choose an active department" });
  }

  Object.assign(profile, rest, { department: departmentId, workingDays: cleanDays(workingDays) });
  await profile.save();
  await profile.populate(populate);
  res.json({ doctor: shape(profile, true) });
});

export default router;