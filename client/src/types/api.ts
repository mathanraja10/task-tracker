/** Mirrors the server's response contracts. */

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  error: {
    message: string;
    details?: ValidationIssue[];
  };
}
