import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password || password.length < 10) {
    console.error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 10 characters in server/.env");
    process.exit(1);
}

await connectDB();
if (await User.exists({ email })) {
    console.log("An admin with this email already exists");
} else {
    await User.create({
        name: "Hospital Admin",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "admin",
    });
    console.log("Admin created:", email);
}
await mongoose.disconnect();