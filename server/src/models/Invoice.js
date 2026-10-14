import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const itemSchema = new mongoose.Schema(
    {
        description: { type: String, required: true, trim: true, maxlength: 120 },
        quantity: { type: Number, required: true, min: 1, max: 100 },
        unitPrice: { type: Number, required: true, min: 0 }, // smallest currency unit, for example paisa
    },
    { _id: false }
);

const invoiceSchema = new mongoose.Schema(
    {
        number: { type: String, required: true, unique: true },
        patient: { type: ObjectId, ref: "User", required: true, index: true },
        appointment: { type: ObjectId, ref: "Appointment", required: true },
        items: {
            type: [itemSchema],
            validate: { validator: (v) => v.length >= 1, message: "An invoice needs at least one line" },
        },
        total: { type: Number, required: true, min: 0 }, // smallest currency unit
        currency: { type: String, required: true },
        status: { type: String, enum: ["unpaid", "paid", "void"], default: "unpaid" },
        current: { type: Boolean, default: true }, // becomes false when voided, so a new invoice can replace it
        issuedOn: { type: String, required: true }, // YYYY-MM-DD, hospital local date
        notes: { type: String, trim: true, maxlength: 300, default: "" },
        paidAt: Date,
        paymentMethod: { type: String, enum: ["cash", "card", "online"] },
        createdBy: { type: ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

// Only one live (not voided) invoice per appointment
invoiceSchema.index({ appointment: 1 }, { unique: true, partialFilterExpression: { current: true } });

export default mongoose.model("Invoice", invoiceSchema);