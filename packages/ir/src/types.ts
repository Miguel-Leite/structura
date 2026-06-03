import type { Severity } from "@structura/core"

export interface IRMeta {
  version: string
  projectName: string
  projectStyle: "monolith" | "modular-monolith" | "microservices"
  createdAt: string
}

export interface Domain {
  id: string
  name: string
  path: string
  canAccess: string[]
  cannotAccess: string[]
  naming?: {
    files?: string
    exports?: string
  }
}

export interface Dependency {
  sourceId: string
  targetId: string
  kind: "domain" | "module"
  allowed: boolean
  reason?: string
}

export interface IRRuleConfig {
  id: string
  enabled: boolean
  severity: Severity
  config: Record<string, unknown>
}

export interface AIPolicy {
  domainId: string
  autonomy: "constrained" | "guided" | "supervised"
}

export interface ArchitectureIR {
  meta: IRMeta
  domains: Domain[]
  dependencies: Dependency[]
  rules: IRRuleConfig[]
  aiPolicies: AIPolicy[]
}
