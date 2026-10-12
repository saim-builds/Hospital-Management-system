import User from "../models/User.js";
import { COOKIE, verifyToken } from "../utils/token.js";

export async function protect(req, res, next) {
    const where = `${req.method} ${req.originalUrl}`;
    const token = req.cookies?.[COOKIE];
    if (!token) {
        console.warn("protect: no login cookie on", where);
        return res.status(401).json({ message: "Please log in" });
    }
    try {
        const payload = verifyToken(token);
        const user = await User.findById(payload.sub);
        if (!user || !user.isActive) {
            console.warn("protect: account missing or inactive on", where);
            return res.status(401).json({ message: "Please log in" });
        }
        req.user = user;
        next();
    } catch (err) {
        console.warn("protect: login cookie rejected on", where, "-", err.name);
        res.status(401).json({ message: "Please log in" });
    }
}

export const requireRole = (...roles) => (req, res, next) =>
    roles.includes(req.user.role)
        ? next()
        : res.status(403).json({ message: "You do not have access to this" });