
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 60 },
        description: { type: String, trim: true, maxlength: 200, default: "" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Names are unique regardless of upper or lower case
departmentSchema.index(
    { name: 1 },
    { unique: true, collation: { locale: "en", strength: 2 } }
);

const Department =
    mongoose.models.Department ||
    mongoose.model("Department", departmentSchema);

export default Department;
