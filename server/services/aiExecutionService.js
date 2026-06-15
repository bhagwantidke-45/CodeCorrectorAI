import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXECUTION_SYSTEM_PROMPT = `You are a code execution sandbox. When given code and test cases:
1. Mentally trace the execution of the code.
2. Determine if it produces the correct output for each test case.
3. Identify bugs, edge cases, and performance issues.
4. Respond ONLY with valid JSON. No markdown, no extra text.

Response format:
{
  "passed": true/false,
  "passedCount": number,
  "totalCount": number,
  "testResults": [
    {
      "testCase": 1,
      "input": "...",
      "expectedOutput": "...",
      "actualOutput": "...",
      "passed": true/false,
      "error": null or "error message"
    }
  ],
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "feedback": "Brief explanation of what's correct or wrong",
  "suggestedFix": "If wrong, a 2-3 line hint (not full solution)"
}`;

const AI_PROBLEM_PROMPT = (difficulty, topic, count = 1) => `Generate ${count} unique coding challenge(s).
Difficulty: ${difficulty}
Topic: ${topic}

Respond ONLY with a valid JSON array. No markdown, no extra text.
[
  {
    "title": "Two Sum",
    "description": "Given an array of integers...",
    "difficulty": "${difficulty}",
    "category": "${topic}",
    "tags": ["array", "hash-map"],
    "companies": ["Amazon", "Google"],
    "examples": [
      { "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] == 9" }
    ],
    "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
    "hints": ["Think about using a hash map", "One pass is possible"],
    "testCases": [
      { "input": "2 7 11 15\\n9", "expectedOutput": "0 1", "isHidden": false },
      { "input": "3 2 4\\n6",    "expectedOutput": "1 2", "isHidden": false },
      { "input": "3 3\\n6",      "expectedOutput": "0 1", "isHidden": true }
    ],
    "starterCode": {
      "javascript": "/**\\n * @param {number[]} nums\\n * @param {number} target\\n * @return {number[]}\\n */\\nfunction twoSum(nums, target) {\\n    // Write your solution here\\n}\\n",
      "python": "def two_sum(nums, target):\\n    # Write your solution here\\n    pass\\n"
    },
    "points": 10,
    "timeLimit": 2000,
    "memoryLimit": 256
  }
]`;

// ── Execute code against test cases (AI-powered)
export async function executeCode(code, language, testCases) {
  const testCaseStr = testCases
    .slice(0, 5)
    .map((tc, i) => `Test ${i + 1}: Input: ${tc.input} | Expected: ${tc.expectedOutput}`)
    .join('\n');

  const userPrompt = `Language: ${language}\n\nCode:\n${code}\n\nTest Cases:\n${testCaseStr}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: EXECUTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('AI Execution error:', err.message);
    return {
      passed: false,
      passedCount: 0,
      totalCount: testCases.length,
      testResults: testCases.map((tc, i) => ({
        testCase: i + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: 'Execution failed',
        passed: false,
        error: err.message,
      })),
      feedback: 'Could not evaluate code. Check syntax and try again.',
      suggestedFix: null,
    };
  }
}

// ── Generate AI problems
export async function generateAiProblems(difficulty = 'medium', topic = 'arrays', count = 1) {
  const prompt = AI_PROBLEM_PROMPT(difficulty, topic, count);

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: 'You are an expert competitive programming problem setter. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '[]';
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const problems = JSON.parse(jsonStr);
    return Array.isArray(problems) ? problems : [problems];
  } catch (err) {
    console.error('AI Problem generation error:', err.message);
    throw new Error('Failed to generate AI problem: ' + err.message);
  }
}

// ── AI code review for a specific challenge
export async function reviewChallengeCode(code, language, problemTitle, problemDescription) {
  const prompt = `You are reviewing a student's solution to: "${problemTitle}"

Problem: ${problemDescription.slice(0, 500)}

Student's ${language} code:
\`\`\`${language}
${code}
\`\`\`

Provide a structured review as valid JSON only:
{
  "correctness": "correct|partial|incorrect",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "score": 85,
  "strengths": ["Good variable naming", "Handles edge cases"],
  "improvements": ["Consider using a hash map for O(n) time", "Add null check"],
  "correctedCode": "// Only if incorrect, provide the corrected version with proper indentation",
  "explanation": "Brief explanation of the optimal approach"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: 'You are a senior software engineer reviewing code. Respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('AI Review error:', err.message);
    throw new Error('AI review failed: ' + err.message);
  }
}
