import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().min(1).default('/api'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(`Invalid client environment: ${parsed.error.message}`);
}

export const env = Object.freeze({
  /** API base URL without a trailing slash, e.g. "/api". */
  apiBaseUrl: parsed.data.VITE_API_BASE_URL.replace(/\/+$/, ''),
});
