import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const LANGUAGE_LABELS = {
  c: 'C',
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  php: 'PHP',
  go: 'Go',
};

const buildPrompt = (code, language) => {
  const langLabel = LANGUAGE_LABELS[language] || language;
  return `You are an expert ${langLabel} code reviewer and debugger. Analyze the following ${langLabel} code thoroughly.

Return a STRICT JSON object (no markdown, no code blocks, just raw JSON) with exactly this structure:
{
  "errors": [
    {
      "line": <number or null>,
      "type": "<syntax|logical|runtime|warning|style>",
      "severity": "<low|medium|high|critical>",
      "message": "<clear error description>",
      "fix": "<exact code fix>",
      "explanation": "<simple explanation why this is wrong and what the fix does>"
    }
  ],
  "correctedCode": "<complete corrected and optimized version of the code>",
  "optimizations": [
    {
      "category": "<variable_naming|performance|memory|readability|complexity>",
      "suggestion": "<specific improvement suggestion>"
    }
  ],
  "explanations": ["<plain language explanation of each major fix made>"],
  "timeComplexity": "<e.g. O(n), O(n log n), O(1)>",
  "spaceComplexity": "<e.g. O(n), O(1)>",
  "qualityScore": <integer 0-100 representing overall code quality AFTER corrections>,
  "summary": "<2-3 sentence summary of what the code does and what was fixed>"
}

Rules:
- If the code has no errors, set errors to [] and correctedCode to the optimized version
- qualityScore: 90-100 = excellent, 70-89 = good, 50-69 = fair, below 50 = poor
- Be specific with line numbers when possible
- The correctedCode must be complete, runnable ${langLabel} code
- explanations should use simple, beginner-friendly language

CODE TO ANALYZE (${langLabel}):
\`\`\`${language}
${code}
\`\`\``;
};

export const analyzeCodeWithGemini = async (code, language) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 8192,
    },
  });

  const prompt = buildPrompt(code, language);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Strip markdown code blocks if present
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try extracting JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Gemini returned non-JSON response. Please try again.');
    }
  }

  // Validate and normalize response structure
  return {
    errors: Array.isArray(parsed.errors) ? parsed.errors : [],
    correctedCode: parsed.correctedCode || code,
    optimizations: Array.isArray(parsed.optimizations) ? parsed.optimizations : [],
    explanations: Array.isArray(parsed.explanations) ? parsed.explanations : [],
    timeComplexity: parsed.timeComplexity || 'N/A',
    spaceComplexity: parsed.spaceComplexity || 'N/A',
    qualityScore: typeof parsed.qualityScore === 'number' ? Math.min(100, Math.max(0, parsed.qualityScore)) : 50,
    summary: parsed.summary || '',
    tokenUsage: response.usageMetadata?.totalTokenCount || 0,
  };
};
