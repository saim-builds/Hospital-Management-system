import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
        credentials: true,
    })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
});

app.use((req, res) => res.status(404).json({ message: "Not found" }));

// Error handler: never leak internal details to the client
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status && err.status < 500 ? err.status : 500;
    res.status(status).json({ message: status < 500 ? err.message : "Something went wrong" });
});

export default app;