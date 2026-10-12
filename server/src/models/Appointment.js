import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const appointmentSchema = new mongoose.Schema(
    {
        patient: { type: ObjectId, ref: "User", required: true },
        doctor: { type: ObjectId, ref: "DoctorProfile", required: true },
        date: { type: String, required: true }, // YYYY-MM-DD, hospital local date
        slotStart: { type: String, required: true }, // HH:MM
        reason: { type: String, trim: true, maxlength: 200, default: "" },
        status: { type: String, enum: ["booked", "completed", "cancelled"], default: "booked" },
        bookedBy: { type: ObjectId, ref: "User", required: true },
        cancelledBy: { type: ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Only one BOOKED appointment per doctor, date, and time. Cancelled ones free the slot.
appointmentSchema.index(
    { doctor: 1, date: 1, slotStart: 1 },
    { unique: true, partialFilterExpression: { status: "booked" } }
);
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ date: 1, slotStart: 1 });

export default mongoose.model("Appointment", appointmentSchema);