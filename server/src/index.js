import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 5000;

try {
    await connectDB();
    app.listen(port, () => console.log(`API running on http://localhost:${port}`));
} catch (err) {
    console.error("Could not start the server:", err.message);
    process.exit(1);
}