import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const prescriptionSchema = new mongoose.Schema(
    {
        medicine: { type: String, required: true, trim: true, maxlength: 80 },
        dose: { type: String, trim: true, maxlength: 60, default: "" },
        frequency: { type: String, trim: true, maxlength: 60, default: "" },
        duration: { type: String, trim: true, maxlength: 60, default: "" },
        instructions: { type: String, trim: true, maxlength: 200, default: "" },
    },
    { _id: false }
);

const visitSchema = new mongoose.Schema(
    {
        appointment: { type: ObjectId, ref: "Appointment", required: true, unique: true },
        patient: { type: ObjectId, ref: "User", required: true, index: true },
        doctor: { type: ObjectId, ref: "DoctorProfile", required: true },
        date: { type: String, required: true }, // copied from the appointment
        vitals: {
            systolic: Number,
            diastolic: Number,
            pulse: Number,
            temperature: Number,
            oxygen: Number,
        },
        complaint: { type: String, trim: true, maxlength: 500, default: "" },
        diagnosis: { type: String, required: true, trim: true, maxlength: 500 },
        notes: { type: String, trim: true, maxlength: 2000, default: "" },
        prescriptions: { type: [prescriptionSchema], default: [] },
    },
    { timestamps: true }
);

export default mongoose.model("Visit", visitSchema);