export type ErrorCode =
  | "CONFIG_NOT_FOUND"
  | "CONFIG_PARSE_ERROR"
  | "SCHEMA_VALIDATION_ERROR"
  | "IR_GENERATION_ERROR"
  | "AST_PARSE_ERROR"
  | "RULE_EXECUTION_ERROR"
  | "DRIFT_DETECTION_ERROR"
  | "INTERNAL_ERROR"

export type Severity = "error" | "warning" | "info"

import type { StructuraError } from "./errors.js"

export type Result<T, E = StructuraError> = { ok: true; value: T } | { ok: false; error: E }
