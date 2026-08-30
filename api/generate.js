import process from "node:process";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  try {
    const { notes } = req.body;

    if (!notes || notes.trim().length < 30) {
      return res.status(400).json({
        error: "Please provide at least 30 characters of study notes.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured.",
      });
    }

    const prompt = `
You are an educational study assistant.

Transform the following student notes into a concise study guide.

Return ONLY valid JSON using exactly this structure:

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
- Base the answer only on the provided notes.
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
      console.error("Gemini API error:", await response.text());

      return res.status(500).json({
        error: "The AI service is currently unavailable. Please try again.",
      });
    }

    const data = await response.json();

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

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

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Something went wrong while generating the study guide.",
    });
  }
}