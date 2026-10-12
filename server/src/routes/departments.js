import { Router } from "express";
import { z } from "zod";
import Department from "../models/department.js";
import { protect, requireRole } from "../middleware/auth.js";
import { validate, validId } from "../middleware/validate.js";

const router = Router();
router.use(protect);

const shape = (d) => ({ id: d._id, name: d.name, description: d.description, isActive: d.isActive });

const createSchema = z.object({
    name: z.string().trim().min(2, "Enter a department name").max(60),
    description: z.string().trim().max(200).optional().default(""),
});
const updateSchema = z.object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(200).optional(),
    isActive: z.boolean().optional(),
});

router.get("/", async (req, res) => {
    const filter = req.user.role === "admin" ? {} : { isActive: true };
    const departments = await Department.find(filter).sort({ name: 1 });
    res.json({ departments: departments.map(shape) });
});

router.post("/", requireRole("admin"), validate(createSchema), async (req, res) => {
    const department = await Department.create(req.body);
    res.status(201).json({ department: shape(department) });
});

router.patch("/:id", requireRole("admin"), validId, validate(updateSchema), async (req, res) => {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });
    Object.assign(department, req.body);
    await department.save();
    res.json({ department: shape(department) });
});

export default router;