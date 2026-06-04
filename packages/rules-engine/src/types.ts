import type { ArchitectureIR } from "@structura/ir"
import type { DependencyGraph } from "@structura/graph"

export interface RuleResult {
  ruleId: string
  passed: boolean
  file?: string
  line?: number
  column?: number
  message: string
  detail?: string
  severity: "error" | "warning" | "info"
  suggestedFix?: string
}

export type RuleCategory = "import" | "naming" | "structure" | "dependency" | "ai"

export interface ParsedSourceSummary {
  filePath: string
  lineCount: number
  domainId?: string
  imports: { source: string; targetDomainId?: string; line: number }[]
}

export interface ValidationContext {
  ir: ArchitectureIR
  graph: DependencyGraph
  sources: Map<string, ParsedSourceSummary>
  projectRoot: string
}

export interface Rule {
  id: string
  category: RuleCategory
  severity: "error" | "warning" | "info"
  description: string
  validate(ctx: ValidationContext): RuleResult[]
}

export interface ValidationSummary {
  total: number
  passed: number
  failed: number
  errors: number
  warnings: number
  infos: number
  results: RuleResult[]
}
