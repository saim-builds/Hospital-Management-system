import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
        specialty: { type: String, required: true, trim: true, maxlength: 80 },
        workingDays: { type: [Number], required: true }, // 0 = Sunday ... 6 = Saturday
        startTime: { type: String, required: true }, // "HH:MM", hospital local time
        endTime: { type: String, required: true },
        slotMinutes: { type: Number, required: true, enum: [15, 20, 30, 45, 60] },
        consultationFee: { type: Number, default: 0, min: 0 },
        photo: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("DoctorProfile", doctorProfileSchema);