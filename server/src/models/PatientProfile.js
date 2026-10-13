import mongoose from "mongoose";

const patientProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    patientId: { type: String, required: true, unique: true }, // like P-10001
    dateOfBirth: { type: String, required: true }, // YYYY-MM-DD
    gender: { type: String, enum: ["female", "male", "other"], required: true },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""], default: "" },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    allergies: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("PatientProfile", patientProfileSchema);