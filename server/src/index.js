import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 5000;

try {
    await connectDB();
} catch (err) {
    console.error("Could not connect to the database:", err.message);
    process.exit(1);
}

const server = app.listen(port);
server.once("listening", () => console.log(`API running on http://localhost:${port}`));
server.once("error", (err) => {
    console.error(
        err.code === "EADDRINUSE"
            ? `Port ${port} is already in use. Stop the other server first.`
            : `Server error: ${err.message}`
    );
    process.exit(1);
});