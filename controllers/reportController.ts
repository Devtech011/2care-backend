import express, { Request, Response } from "express";
import { extractTextFromFile, getAISummary } from "../services/aiService";
import Report from "../models/reportModel";
import { AppError } from "../middleware/errorHandler";
import { encrypt, decrypt } from "../services/encryptionService";

export const uploadReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.files?.file;
    if (!file || Array.isArray(file)) {
      throw new AppError("Invalid file upload", 400);
    }

    const text = await extractTextFromFile(file.tempFilePath, file.mimetype);
    const summary = await getAISummary(text, '');
    const encryptedSummary = encrypt(summary);

    const report = new Report({
      summary: encryptedSummary,
      userId: req.user._id,
      userEmail: req.user.email
    });
    await report.save();

    res.status(201).json({ reportId: report._id, summary });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Upload failed", error: error?.message || String(error) });
    }
  }
};

export const getReportSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      throw new AppError("Report not found", 404);
    }

    const decryptedSummary = decrypt(report.summary);
    const reportResponse = {
      ...report.toObject(),
      summary: decryptedSummary
    };

    res.status(200).json(reportResponse);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error retrieving report", error: error?.message || String(error) });
    }
  }
};
