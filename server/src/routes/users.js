import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { protect, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(protect, requireRole("admin"));

const createSchema = z.object({
    name: z.string().trim().min(2, "Enter a name").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    role: z.enum(["doctor", "receptionist"]),
});

router.get("/", async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 }).limit(200);
    res.json({ users: users.map((u) => u.toSafeJSON()) });
});

router.post("/", validate(createSchema), async (req, res) => {
    const { name, email, password, role } = req.body;
    if (await User.exists({ email })) {
        return res.status(409).json({ message: "An account with this email already exists" });
    }
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role });
    res.status(201).json({ user: user.toSafeJSON() });
});

export default router;