import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import DoctorProfile from "../models/DoctorProfile.js";
import { protect, requireRole } from "../middleware/auth.js";
import { validId } from "../middleware/validate.js";

// server/uploads (this file lives in server/src/routes)
export const UPLOAD_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
const DOCTOR_DIR = path.join(UPLOAD_ROOT, "doctors");

const router = Router();
router.use(protect, requireRole("admin"));

// Decide the file type from the first bytes. The browser's mimetype and filename are never trusted.
function detectType(buf) {
    if (buf.length < 12) return null;
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
    if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
    return null;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } }).single("photo");

function receive(req, res, next) {
    upload(req, res, (err) => {
        if (!err) return next();
        const message = err.code === "LIMIT_FILE_SIZE" ? "The photo must be under 2 MB" : "Could not read the photo";
        res.status(400).json({ message });
    });
}

const urlFor = (file) => (file ? `/uploads/doctors/${file}` : "");

async function removeFile(file) {
    if (!file) return;
    // basename() keeps this inside the doctors folder even if the stored value were ever odd
    await fs.rm(path.join(DOCTOR_DIR, path.basename(file)), { force: true });
}

router.get("/:id", validId, async (req, res) => {
    const profile = await DoctorProfile.findById(req.params.id).select("photo");
    if (!profile) return res.status(404).json({ message: "Doctor not found" });
    res.json({ photo: urlFor(profile.photo) });
});

router.put("/:id", validId, receive, async (req, res) => {
    const profile = await DoctorProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: "Doctor not found" });
    if (!req.file) return res.status(400).json({ message: "Choose a photo to upload" });

    const type = detectType(req.file.buffer);
    if (!type) return res.status(400).json({ message: "Use a JPG, PNG or WebP photo" });

    await fs.mkdir(DOCTOR_DIR, { recursive: true });
    const file = `${crypto.randomBytes(12).toString("hex")}.${type}`;
    await fs.writeFile(path.join(DOCTOR_DIR, file), req.file.buffer);

    const old = profile.photo;
    profile.photo = file;
    await profile.save();
    await removeFile(old);
    res.json({ photo: urlFor(file) });
});

router.delete("/:id", validId, async (req, res) => {
    const profile = await DoctorProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: "Doctor not found" });
    const old = profile.photo;
    profile.photo = "";
    await profile.save();
    await removeFile(old);
    res.json({ photo: "" });
});

export default router;