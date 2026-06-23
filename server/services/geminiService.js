import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

let genAI;
let groq;

const getGenAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY || 'placeholder_gemini_key';
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
};

const getGroq = () => {
  if (!groq) {
    const key = process.env.GROQ_API_KEY || 'placeholder_groq_key';
    groq = new Groq({ apiKey: key });
  }
  return groq;
};

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
  const model = getGenAI().getGenerativeModel({
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

export const generateAiHintForCode = async (code, language, challenge, level) => {
  const levelDescriptions = {
    1: 'Level 1: Nudge. A subtle hint about where the logical bug, edge case, or syntactic issue might be. Do NOT give away the algorithm or solution, and do NOT write any code.',
    2: 'Level 2: Approach. A conceptual explanation of the correct algorithm, pattern, logic, or data structure the user should use to solve the problem. Do NOT write code.',
    3: 'Level 3: Near-Solution. A detailed explanation of the fix along with a short 2-4 line code snippet showing the critical part of the logic that is missing or incorrect.'
  };

  const levelDesc = levelDescriptions[level] || levelDescriptions[1];

  const prompt = `You are an expert coding coach. Help a user debug their code for the programming challenge: "${challenge.title}".

Problem Description:
${challenge.description}

User's current code (${language}):
\`\`\`${language}
${code}
\`\`\`

Request Type:
${levelDesc}

Return a STRICT JSON object (no markdown code blocks, just raw JSON) with exactly this structure:
{
  "hint": "<the detailed explanation or nudge text>",
  "codeSnippet": "<2-4 lines of code/pseudo-code, ONLY if requested for Level 3, otherwise null>"
}

Rules:
- Be encouraging.
- Never write the full solution.
- For Level 1 and 2, codeSnippet MUST be null.
- Keep the hint text concise (2-4 sentences).`;

  try {
    const model = getGenAI().getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Gemini returned non-JSON response for hint generation.');
      }
    }

    return {
      hint: parsed.hint || 'Keep going! Check your boundary conditions.',
      codeSnippet: parsed.codeSnippet || null
    };
  } catch (geminiError) {
    console.warn('Gemini hint generation failed. Falling back to Groq...', geminiError.message);
    try {
      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: 'You are an expert AI coding coach. You must respond with valid raw JSON matching the requested structure.' },
          { role: 'user', content: prompt }
        ]
      });

      const text = completion.choices[0]?.message?.content?.trim() || '{}';
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Groq returned non-JSON response for hint generation.');
        }
      }

      return {
        hint: parsed.hint || 'Keep going! Check your boundary conditions.',
        codeSnippet: parsed.codeSnippet || null
      };
    } catch (groqError) {
      console.error('Groq fallback hint generation failed:', groqError.message);
      throw new Error('Failed to generate AI hints using both Gemini and Groq.');
    }
  }
};

