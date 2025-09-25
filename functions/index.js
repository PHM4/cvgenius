import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { defineSecret, defineString } from 'firebase-functions/params';
import { z } from 'zod';

const groqApiKeySecret = defineSecret('GROQ_API_KEY');
const groqModelParam = defineString('GROQ_MODEL', {
  default: 'llama-3.1-8b-instant',
});

const rewriteRequestSchema = z.object({
  company: z.string().optional(),
  position: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  highlights: z.array(z.string()).optional(),
});

const rewriteResponseSchema = z.object({
  description: z.string().min(1),
  highlights: z.array(z.string()).catch([]),
});

function buildPrompt({ company, position, description, highlights }) {
  const trimmedHighlights = (highlights ?? []).filter(Boolean);
  const contextLines = [
    company ? `Company: ${company}` : null,
    position ? `Role: ${position}` : null,
    `Current Description: ${description}`,
    trimmedHighlights.length ? `Existing Highlights:\n- ${trimmedHighlights.join('\n- ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `Improve the CV entry below. Return ONLY valid JSON matching {"description": string, "highlights": string[]}.\n\nGoals:\n- Polish the description into 2-3 crisp sentences.\n- Suggest 2-4 action-oriented bullet achievements tailored to the role.\n- Do not invent technologies the candidate never used.\n\n${contextLines}`;
}

async function callGroq({ prompt, apiKey, model }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume editor who always responds with strict JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    const error = new Error(`Groq request failed (${response.status}): ${errorPayload}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content;

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from Groq');
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return rewriteResponseSchema.parse(parsed);
}

export const aiRewrite = onRequest({
  region: 'us-central1',
  cors: true,
  secrets: [groqApiKeySecret],
}, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const parsed = rewriteRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const apiKey = groqApiKeySecret.value() || process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.error('Missing GROQ_API_KEY. Configure a secret or environment variable.');
    res.status(500).json({ error: 'AI service is not configured.' });
    return;
  }

  try {
    const suggestion = await callGroq({
      prompt: buildPrompt(parsed.data),
      apiKey,
      model: groqModelParam.value() || process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    });
    res.json(suggestion);
  } catch (error) {
    logger.error('AI rewrite failed', error);
    const status = error.status && Number.isInteger(error.status) ? error.status : 500;
    const message = status === 503
      ? 'Model is warming up. Please try again in a moment.'
      : error.message ?? 'Failed to generate rewrite.';
    res.status(status).json({ error: message });
  }
});
