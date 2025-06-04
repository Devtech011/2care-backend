import express from "express";
import { uploadReport, getReportSummary } from "../controllers/reportController";
import { auth } from "../middleware/auth";

const router = express.Router();

router.use(auth);

router.post("/upload", uploadReport);
router.get("/:id", getReportSummary);

export default router;
