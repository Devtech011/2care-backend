import dotenv from "dotenv";
dotenv.config();

import fetch from 'node-fetch';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { recognize } from 'tesseract.js';
import { AppError } from '../middleware/errorHandler';

interface OpenAIChatResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface ErrorResponse {
  error?: {
    message: string;
  };
  message?: string;
}

export const getAISummary = async (text: string, apiKey: string): Promise<string> => {
  const prompt = `
    You are an expert medical assistant.

    Your task is to determine whether the following document is a valid medical report. A valid medical report typically includes information like patient history, diagnosis, medications, test results, doctor notes, or treatment plans.

    If the document appears to be a random file, unrelated to medical information, respond exactly with:
    <p><b>Provided document is not a valid medical report.</b></p>

    If the document is a valid medical report, then analyze it and return a patient-friendly summary using only HTML formatting. 
    ⚠️ IMPORTANT: Format the output using only HTML tags. Follow these formatting rules strictly:
    - Use <p> for each paragraph.
    - Use <b> to bold headings or important terms (e.g., diagnosis names, dates, key phrases).
    - Use <ul> and <li> to format bullet points when listing findings or symptoms.
    - Ensure each section has proper spacing by wrapping blocks of related information in separate <p> tags.
    - Do NOT use markdown, headings (like <h1>), or any custom styles or inline CSS.
    - start report with heading Medical Report:

    ${text}
    `;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemma-3-12b-it:free',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null) as ErrorResponse | null;
    const errorMessage = errorData?.error?.message || errorData?.message || await response.text();
    throw new AppError(`OpenRouter API failed: ${errorMessage}`, response.status);
  }

  const raw = await response.text();

  let data: OpenAIChatResponse;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("JSON parse error", e);
    throw new AppError("Failed to parse response from OpenRouter", 500);
  }

  if (!data.choices?.[0]?.message?.content) {
    throw new AppError("No summary was generated from the AI service", 500);
  }

  return data.choices[0].message.content.trim();
};

export const extractTextFromFile = async (filePath: string, mimetype: string): Promise<string> => {
  if (mimetype === 'application/pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.trim();
  } else if (mimetype.startsWith('image/')) {
    const { data } = await recognize(filePath, 'eng');
    return data.text;
  } else {
    throw new AppError('Only image and PDF files are supported for OCR.', 400);
  }
};
