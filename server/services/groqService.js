import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const LANGUAGE_LABELS = {
  c: 'C', cpp: 'C++', java: 'Java', python: 'Python',
  javascript: 'JavaScript', typescript: 'TypeScript', php: 'PHP', go: 'Go',
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
  "correctedCode": "<complete corrected and optimized version of the code, properly formatted with standard indentation, spaces, and explicit newlines (escaped as \\n)>",
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
  "summary": "<2-3 sentence summary of what the code does and what was fixed>",
  "cyclomaticComplexity": <integer — number of independent paths through the code, e.g. 1 for simple linear code, 5-10 for moderate, 20+ for complex>,
  "maintainabilityIndex": <integer 0-100 — 85+ is highly maintainable, 65-84 moderate, below 65 difficult to maintain>,
  "severityScore": <float 0-10 — weighted severity of all errors: 10=all critical, 0=no errors>
}

Rules:
- If the code has no errors, set errors to [] and correctedCode to the optimized version
- qualityScore: 90-100 = excellent, 70-89 = good, 50-69 = fair, below 50 = poor
- Be specific with line numbers when possible
- The correctedCode must be complete, runnable, and beautifully formatted ${langLabel} code
- The "correctedCode" must preserve standard code indentation, spacing, and clean newlines (using escaped \\n in the JSON string). NEVER compress, minify, or collapse the corrected code onto a single line.
- explanations should use simple, beginner-friendly language
- cyclomaticComplexity: count decision points (if, for, while, case, catch, &&, ||) + 1
- severityScore formula: (critical×10 + high×7 + medium×4 + low×1) / max(totalErrors,1), capped at 10

CODE TO ANALYZE (${langLabel}):
\`\`\`${language}
${code}
\`\`\``;
};

export const analyzeCodeWithGroq = async (code, language) => {
  const prompt = buildPrompt(code, language);

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert AI code analyzer. You must always respond with valid, raw JSON exactly matching the requested format. Do not use markdown code blocks like ```json.',
      },
      { role: 'user', content: prompt },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const text    = completion.choices[0]?.message?.content || '{}';
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    else throw new Error('Groq returned non-JSON response. Please try again.');
  }

  return {
    errors:               Array.isArray(parsed.errors) ? parsed.errors : [],
    correctedCode:        parsed.correctedCode || code,
    optimizations:        Array.isArray(parsed.optimizations) ? parsed.optimizations : [],
    explanations:         Array.isArray(parsed.explanations) ? parsed.explanations : [],
    timeComplexity:       parsed.timeComplexity || 'N/A',
    spaceComplexity:      parsed.spaceComplexity || 'N/A',
    qualityScore:         typeof parsed.qualityScore === 'number' ? Math.min(100, Math.max(0, parsed.qualityScore)) : 50,
    summary:              parsed.summary || '',
    cyclomaticComplexity: typeof parsed.cyclomaticComplexity === 'number' ? Math.max(1, parsed.cyclomaticComplexity) : 1,
    maintainabilityIndex: typeof parsed.maintainabilityIndex === 'number' ? Math.min(100, Math.max(0, parsed.maintainabilityIndex)) : 70,
    severityScore:        typeof parsed.severityScore === 'number' ? Math.min(10, Math.max(0, parsed.severityScore)) : 0,
    tokenUsage:           completion.usage?.total_tokens || 0,
  };
};

// ── Streaming version (SSE) ───────────────────────────────────────────────────
export const analyzeCodeWithGroqStream = async (code, language, onChunk) => {
  const prompt = buildPrompt(code, language);

  const stream = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert AI code analyzer. Respond with valid raw JSON. Do not use markdown.',
      },
      { role: 'user', content: prompt },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    stream: true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    fullText += delta;
    if (delta) onChunk(delta);
  }

  const cleaned = fullText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    else throw new Error('Groq stream returned non-JSON response.');
  }

  return {
    errors:               Array.isArray(parsed.errors) ? parsed.errors : [],
    correctedCode:        parsed.correctedCode || code,
    optimizations:        Array.isArray(parsed.optimizations) ? parsed.optimizations : [],
    explanations:         Array.isArray(parsed.explanations) ? parsed.explanations : [],
    timeComplexity:       parsed.timeComplexity || 'N/A',
    spaceComplexity:      parsed.spaceComplexity || 'N/A',
    qualityScore:         typeof parsed.qualityScore === 'number' ? Math.min(100, Math.max(0, parsed.qualityScore)) : 50,
    summary:              parsed.summary || '',
    cyclomaticComplexity: typeof parsed.cyclomaticComplexity === 'number' ? Math.max(1, parsed.cyclomaticComplexity) : 1,
    maintainabilityIndex: typeof parsed.maintainabilityIndex === 'number' ? Math.min(100, Math.max(0, parsed.maintainabilityIndex)) : 70,
    severityScore:        typeof parsed.severityScore === 'number' ? Math.min(10, Math.max(0, parsed.severityScore)) : 0,
    tokenUsage:           0,
  };
};
