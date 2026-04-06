// services/ingest.ts

import { PDFParse } from "pdf-parse";

export async function parseFile(buffer: Buffer, mimetype: string) {
  if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }

  if (mimetype === "application/pdf") {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error("Unsupported file type");
}
