import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { setAuthCookie, clearAuthCookie } from "../utils/token.js";

const router = Router();

// Compared against when the email is unknown, so timing does not reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

const limiter = (windowMs, limit, message) =>
    rateLimit({ windowMs, limit, standardHeaders: "draft-7", legacyHeaders: false, message: { message } });
const loginLimiter = limiter(15 * 60 * 1000, 10, "Too many attempts. Try again in a few minutes.");
const registerLimiter = limiter(60 * 60 * 1000, 20, "Too many sign-ups from this address. Try again later.");
const staffLoginLimiter = limiter(15 * 60 * 1000, 10, "Too many attempts. Try again in a few minutes.");
const STAFF_ROLES = ["admin", "receptionist"];
const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long");

const registerSchema = z.object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email,
    password,
});
const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password").max(72) });

router.post("/register", registerLimiter, validate(registerSchema), async (req, res) => {
    const { name, email, password } = req.body;
    if (await User.exists({ email })) {
        return res.status(409).json({ message: "An account with this email already exists" });
    }
    // Public sign-up can only ever create a patient
    const user = await User.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "patient",
    });
    setAuthCookie(res, user._id);
    res.status(201).json({ user: user.toSafeJSON() });
});

router.post("/login", loginLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");
    const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    // Admins and receptionists can only sign in through the staff form
    if (!user || !user.isActive || !ok || STAFF_ROLES.includes(user.role)) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    setAuthCookie(res, user._id);
    res.json({ user: user.toSafeJSON() });
});

router.post("/staff-login", staffLoginLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");
    const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !user.isActive || !ok || !STAFF_ROLES.includes(user.role)) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    setAuthCookie(res, user._id);
    res.json({ user: user.toSafeJSON() });
});

router.post("/logout", (req, res) => {
    clearAuthCookie(res);
    res.json({ message: "Logged out" });
});

router.get("/me", protect, (req, res) => {
    res.json({ user: req.user.toSafeJSON() });
});

export default router;