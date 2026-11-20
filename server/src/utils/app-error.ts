import type { ValidationIssue } from '../types/api.types.js';

/** Operational error with an HTTP status; safe to expose to clients. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details: ValidationIssue[] | undefined;

  constructor(statusCode: number, message: string, details?: ValidationIssue[]) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: ValidationIssue[]) {
    super(400, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}
