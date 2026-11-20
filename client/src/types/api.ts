/** Mirrors the server's response contracts. */

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface PageMeta {
  /** Opaque token for the next page, or `null` on the last page. */
  nextCursor: string | null;
}

export interface ApiPage<T> {
  data: T[];
  meta: PageMeta;
}

export interface ApiErrorBody {
  error: {
    message: string;
    details?: ValidationIssue[];
  };
}
