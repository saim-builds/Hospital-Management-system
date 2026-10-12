import mongoose from "mongoose";

export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: result.error.issues[0].message });
    }
    req.body = result.data;
    next();
};

export const validId = (req, res, next) =>
    mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ message: "Invalid id" });