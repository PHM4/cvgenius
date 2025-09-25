import { z } from 'zod';

const apiResponseSchema = z.object({
  description: z.string().min(1),
  highlights: z.array(z.string()).default([]),
});

export type AIRewriteSuggestion = z.infer<typeof apiResponseSchema>;

export interface RewriteExperienceInput {
  company?: string;
  position?: string;
  description: string;
  highlights?: string[];
}

const customEndpoint = (import.meta.env.VITE_AI_API_BASE_URL ?? '').replace(/\/$/, '');
const endpoint = customEndpoint || '/api/ai/rewrite';

export async function rewriteWorkExperience(input: RewriteExperienceInput) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = typeof errorBody.error === 'string'
      ? errorBody.error
      : `Rewrite request failed (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  return apiResponseSchema.parse(data);
}
