import jwt from "jsonwebtoken";

export const COOKIE = "token";
const cookieOptions = () => ({
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
});

export function setAuthCookie(res, userId) {
    const token = jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: 24 * 60 * 60 * 1000 });
}

export function clearAuthCookie(res) {
    res.clearCookie(COOKIE, cookieOptions());
}

export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}