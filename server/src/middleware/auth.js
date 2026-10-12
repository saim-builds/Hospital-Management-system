import User from "../models/User.js";
import { COOKIE, verifyToken } from "../utils/token.js";

export async function protect(req, res, next) {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ message: "Please log in" });
    try {
        const payload = verifyToken(token);
        const user = await User.findById(payload.sub);
        if (!user || !user.isActive) return res.status(401).json({ message: "Please log in" });
        req.user = user;
        next();
    } catch {
        res.status(401).json({ message: "Please log in" });
    }
}

export const requireRole = (...roles) => (req, res, next) =>
    roles.includes(req.user.role)
        ? next()
        : res.status(403).json({ message: "You do not have access to this" });