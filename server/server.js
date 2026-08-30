import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import process from "node:process";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/api/generate", async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || notes.trim().length < 30) {
      return res.status(400).json({
        error: "Please provide at least 30 characters of study notes.",
      });
    }

    const prompt = `
You are an educational study assistant.

Transform the following student notes into a concise study guide.

Return ONLY valid JSON.

Use exactly this JSON structure:

{
  "summary": "A clear concise summary",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "terms": [
    {
      "term": "Important term",
      "definition": "Simple definition"
    }
  ],
  "questions": [
    "Practice question 1",
    "Practice question 2",
    "Practice question 3"
  ]
}

Rules:
- Do not include markdown.
- Do not include triple backticks.
- Keep the summary concise.
- Include 3 to 6 key points.
- Include important terms only if relevant.
- Include 3 to 5 practice questions.
- Base the answer only on the notes provided.
- Do not invent facts.

Student notes:

${notes}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();

      console.error("Gemini API error:", errorData);

      return res.status(500).json({
        error: "The AI service is currently unavailable. Please try again.",
      });
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "The AI returned an empty response.",
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "The AI returned an invalid response. Please try again.",
      });
    }

    if (
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.keyPoints) ||
      !Array.isArray(parsed.terms) ||
      !Array.isArray(parsed.questions)
    ) {
      return res.status(500).json({
        error: "The AI response was missing required fields.",
      });
    }

    return res.json(parsed);
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Something went wrong while generating the study guide.",
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});