import express from 'express';
import cors from 'cors';
import process from 'node:process';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();
loadEnv({ path: '.env.local', override: true });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';
const PORT = Number(process.env.AI_PROXY_PORT ?? 3001);

if (!GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY environment variable.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

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
  ].filter(Boolean).join('\n');

  return `Improve the CV entry below. Return ONLY valid JSON matching {"description": string, "highlights": string[]}.\n\nGoals:\n- Polish the description into 2-3 crisp sentences.\n- Suggest 2-4 action-oriented bullet achievements tailored to the role.\n- Do not invent technologies the candidate never used.\n\n${contextLines}`;
}

async function callGroq(prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
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

app.post('/api/ai/rewrite', async (req, res) => {
  const parsed = rewriteRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const prompt = buildPrompt(parsed.data);

  try {
    const suggestion = await callGroq(prompt);
    res.json(suggestion);
  } catch (error) {
    console.error('AI rewrite failed:', error);
    const status = error.status && Number.isInteger(error.status) ? error.status : 500;
    const message = status === 503
      ? 'Model is warming up. Please try again in a moment.'
      : (error.message ?? 'Failed to generate rewrite.');
    res.status(status).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy listening on http://localhost:${PORT}`);
});
