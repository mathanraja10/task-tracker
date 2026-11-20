import { z, type ZodType } from 'zod';

import { env } from '@/config/env';
import type { ApiErrorBody, ApiSuccess, ValidationIssue } from '@/types/api';

const validationIssueSchema = z.object({ field: z.string(), message: z.string() });

const errorBodySchema = z.object({
  error: z.object({
    message: z.string(),
    details: z.array(validationIssueSchema).optional(),
  }),
}) satisfies ZodType<ApiErrorBody>;

const successEnvelopeSchema = z.object({
  data: z.unknown(),
  message: z.string().optional(),
});

/** Normalized error for every failed API call. `status` is 0 for network failures. */
export class ApiError extends Error {
  readonly status: number;
  readonly details: readonly ValidationIssue[];

  constructor(message: string, status: number, details: readonly ValidationIssue[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type QueryParams = Record<string, string | undefined>;

interface RequestOptions<T> {
  method?: HttpMethod;
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
  /** Runtime contract for `data`; the response is rejected if it doesn't match. */
  schema: ZodType<T>;
}

function buildUrl(path: string, query: QueryParams = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') search.set(key, value);
  }
  const queryString = search.toString();
  return `${env.apiBaseUrl}${path}${queryString ? `?${queryString}` : ''}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, query, signal, schema }: RequestOptions<T>,
): Promise<ApiSuccess<T>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      signal: signal ?? null,
      body: body === undefined ? null : JSON.stringify(body),
    });
  } catch (error) {
    // Let TanStack Query see cancellations as-is.
    if (isAbortError(error)) throw error;
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0);
  }

  const json = await readJson(response);

  if (!response.ok) {
    const parsedError = errorBodySchema.safeParse(json);
    if (parsedError.success) {
      const { message, details = [] } = parsedError.data.error;
      throw new ApiError(message, response.status, details);
    }
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  const envelope = successEnvelopeSchema.safeParse(json);
  if (!envelope.success) {
    throw new ApiError('Received an unexpected response from the server.', response.status);
  }
  const data = schema.safeParse(envelope.data.data);
  if (!data.success) {
    throw new ApiError('Received an unexpected response from the server.', response.status);
  }

  const { message } = envelope.data;
  return message === undefined ? { data: data.data } : { data: data.data, message };
}

type MethodOptions<T> = Omit<RequestOptions<T>, 'method'>;

export const apiClient = {
  get: <T>(path: string, options: Omit<MethodOptions<T>, 'body'>) =>
    apiRequest(path, { ...options, method: 'GET' }),
  post: <T>(path: string, options: MethodOptions<T>) =>
    apiRequest(path, { ...options, method: 'POST' }),
  patch: <T>(path: string, options: MethodOptions<T>) =>
    apiRequest(path, { ...options, method: 'PATCH' }),
  delete: <T>(path: string, options: Omit<MethodOptions<T>, 'body'>) =>
    apiRequest(path, { ...options, method: 'DELETE' }),
};

/** Human-readable message for any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
