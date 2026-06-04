export type DriftType = "unexpected" | "missing" | "disallowed"

export interface DriftFinding {
  type: DriftType
  sourceDomainId: string
  targetDomainId: string

  sourceFile?: string
  line?: number
  importSymbol?: string

  message: string
  severity: "error" | "warning" | "info"
  suggestedFix?: string
}

export interface DriftReport {
  findings: DriftFinding[]
  summary: {
    total: number
    unexpected: number
    missing: number
    disallowed: number
    errors: number
    warnings: number
  }
}
