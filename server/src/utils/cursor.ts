import { z } from 'zod';

import { objectIdSchema } from '../validations/common.validation.js';

/**
 * Position of the last item on a page in the `createdAt DESC, _id DESC` order.
 * Both fields are needed: `createdAt` alone is not unique.
 */
export interface TaskCursor {
  createdAt: Date;
  id: string;
}

const cursorPayloadSchema = z.strictObject({
  createdAt: z.iso.datetime(),
  id: objectIdSchema,
});

/** Encodes a cursor as an opaque, URL-safe token. Clients must not parse it. */
export function encodeCursor({ createdAt, id }: TaskCursor): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString(
    'base64url',
  );
}

/** Returns `null` for any token that was not produced by `encodeCursor`. */
export function decodeCursor(token: string): TaskCursor | null {
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const parsed = cursorPayloadSchema.safeParse(payload);
  if (!parsed.success) return null;
  return { createdAt: new Date(parsed.data.createdAt), id: parsed.data.id };
}
