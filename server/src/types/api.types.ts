export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: {
    message: string;
    details?: ValidationIssue[];
  };
}
