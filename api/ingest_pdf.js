// /api/ingest_pdf.js
import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ PDF form parse error:", err);
      return res.status(500).json({ error: "PDF form parse error" });
    }

    const pdfFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!pdfFile?.filepath) {
      return res.status(400).json({ error: "Missing PDF file" });
    }

    try {
      const buffer = fs.readFileSync(pdfFile.filepath);
      const data = await pdfParse(buffer);
      const raw = (data.text || "").replace(/\u0000/g, " ").trim();

      // 可做轻量清洗/压缩，避免 token 暴涨
      const text = raw.replace(/\n{3,}/g, "\n\n");

      return res.status(200).json({ text, pages: data.numpages || null });
    } catch (e) {
      console.error("❌ PDF parse failed:", e);
      return res.status(500).json({ error: "PDF parse failed" });
    } finally {
      try { fs.unlinkSync(pdfFile.filepath); } catch {}
    }
  });
}