import express from "express";
import cors from "cors";
import { analyzeCode } from "./analyzeCode.js";

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ---------- ROUTES ---------- */
app.post("/analyze", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      error: "Both code and language are required"
    });
  }

  try {
    const result = await analyzeCode(code, language);
    res.json(result);
  } catch (err) {
    console.error("Analysis failed:", err.message);
    res.status(500).json({
      score: 0,
      summary: { errors: 1, suggestions: 0 },
      issues: [
        {
          category: "System",
          priority: "high",
          message: "Internal analysis error"
        }
      ],
      correctedCode: code,
      complexity: { time: "Unknown", space: "Unknown" },
      language
    });
  }
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
