import { Router } from "express";
import User from "../models/User.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, requireRole("receptionist", "admin"), async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 50) : "";
    const filter = { role: "patient", isActive: true };
    if (q) {
        const safe = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: safe }, { email: safe }];
    }
    const users = await User.find(filter).sort({ name: 1 }).limit(20);
    res.json({ patients: users.map((u) => ({ id: u._id, name: u.name, email: u.email })) });
});

export default router;