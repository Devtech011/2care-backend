import dotenv from "dotenv";
import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import reportRoutes from "./routes/reportRoutes";
import authRoutes from "./routes/authRoutes";
import { errorHandler } from "./middleware/errorHandler";
import connectDB from "./config/db";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));

app.get("/", (req, res) => {
  res.send("AI Chatbot Backend is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

app.use(errorHandler as ErrorRequestHandler);

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
