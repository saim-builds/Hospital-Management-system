import { Router } from "express";
import rateLimit from "express-rate-limit";
import Department from "../models/Department.js";
import DoctorProfile from "../models/DoctorProfile.js";

const router = Router();

router.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again in a minute." },
  })
);

// Public, so it returns only what a hospital website would show anyway
router.get("/overview", async (req, res) => {
  const [departments, profiles] = await Promise.all([
    Department.find({ isActive: true }).sort({ name: 1 }).limit(20),
    DoctorProfile.find({ isActive: true })
      .populate("user", "name isActive")
      .populate("department", "name isActive")
      .sort({ createdAt: -1 })
      .limit(12),
  ]);

  res.set("Cache-Control", "public, max-age=60");
  res.json({
    departments: departments.map((d) => ({ id: d._id, name: d.name, description: d.description })),
    doctors: profiles
      .filter((p) => p.user?.isActive && p.department?.isActive)
      .map((p) => ({ id: p._id, name: p.user.name, specialty: p.specialty, department: p.department.name })),
  });
});

export default router;