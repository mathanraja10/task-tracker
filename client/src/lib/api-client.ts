import { z, type ZodType } from 'zod';

import { env } from '@/config/env';
import type { ApiErrorBody, ApiPage, ApiSuccess, PageMeta, ValidationIssue } from '@/types/api';

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
  meta: z.unknown().optional(),
});

const pageMetaSchema = z.object({
  nextCursor: z.string().nullable(),
}) satisfies ZodType<PageMeta>;

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

const UNEXPECTED_RESPONSE = 'Received an unexpected response from the server.';

type SuccessEnvelope = z.infer<typeof successEnvelopeSchema>;

interface RawSuccess {
  status: number;
  /** `data` and `meta` are not yet checked against the endpoint's contract. */
  envelope: SuccessEnvelope;
}

async function send(
  path: string,
  { method = 'GET', body, query, signal }: Omit<RequestOptions<unknown>, 'schema'>,
): Promise<RawSuccess> {
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
  if (!envelope.success) throw new ApiError(UNEXPECTED_RESPONSE, response.status);
  return { status: response.status, envelope: envelope.data };
}

/** Parses `value` against the response contract, failing like any other API error. */
function parseContract<T>(schema: ZodType<T>, value: unknown, status: number): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ApiError(UNEXPECTED_RESPONSE, status);
  return parsed.data;
}

export async function apiRequest<T>(
  path: string,
  { schema, ...options }: RequestOptions<T>,
): Promise<ApiSuccess<T>> {
  const { status, envelope } = await send(path, options);
  const data = parseContract(schema, envelope.data, status);
  return envelope.message === undefined ? { data } : { data, message: envelope.message };
}

/** GET a cursor-paginated list. `schema` validates a single item. */
export async function apiGetPage<T>(
  path: string,
  { schema, ...options }: Omit<RequestOptions<T>, 'method' | 'body'>,
): Promise<ApiPage<T>> {
  const { status, envelope } = await send(path, { ...options, method: 'GET' });
  return {
    data: parseContract(z.array(schema), envelope.data, status),
    meta: parseContract(pageMetaSchema, envelope.meta, status),
  };
}

type MethodOptions<T> = Omit<RequestOptions<T>, 'method'>;

export const apiClient = {
  get: <T>(path: string, options: Omit<MethodOptions<T>, 'body'>) =>
    apiRequest(path, { ...options, method: 'GET' }),
  getPage: apiGetPage,
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
