import { StructuraError } from "./errors.js"
import type { ErrorCode, Result } from "./types.js"

export function ok<T, E = StructuraError>(value: T): Result<T, E> {
  return { ok: true, value }
}

export function err<T, E = StructuraError>(error: E): Result<T, E> {
  return { ok: false, error }
}

export function createError(code: ErrorCode, message: string, details?: string): StructuraError {
  return new StructuraError(code, message, details)
}
