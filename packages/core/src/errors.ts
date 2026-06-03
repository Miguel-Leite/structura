import type { ErrorCode } from "./types.js"

export class StructuraError extends Error {
  readonly code: ErrorCode
  readonly details?: string

  constructor(code: ErrorCode, message: string, details?: string) {
    super(message)
    this.name = "StructuraError"
    this.code = code
    this.details = details
  }
}
