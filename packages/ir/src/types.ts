import type { Severity } from "@structura/core"
import type {
  ProjectType,
  DesignPhilosophy,
  StylingSystem,
  ComponentArchitecture,
  ComponentOrganization,
  FrontendType,
  AIAgentConfig,
} from "@structura/config"

export interface IRMeta {
  version: string
  projectName: string
  projectStyle: "monolith" | "modular-monolith" | "microservices"
  projectType?: ProjectType
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
  autonomy: string
}

export interface UIDesignIR {
  projectType: ProjectType
  designPhilosophy?: DesignPhilosophy
  designConstraints?: {
    avoidGenericAiLayouts?: boolean
    avoidDefaultDashboardPatterns?: boolean
    avoidRepetitiveCardGrids?: boolean
  }
  stylingSystem?: StylingSystem
  layout?: {
    preferAsymmetry?: boolean
    enforceVisualHierarchy?: boolean
  }
  componentArchitecture?: ComponentArchitecture
  componentOrganization?: ComponentOrganization
  componentRules?: {
    separateLogicAndUi?: boolean
    enforceAccessibility?: boolean
    preventMassiveComponents?: boolean
    enforceVariantConsistency?: boolean
    maxLines?: number
  }
  designSystem?: {
    enabled?: boolean
    tokens?: boolean
    variants?: boolean
    motion?: boolean
    theme?: boolean
    accessibility?: boolean
    slots?: boolean
    responsive?: boolean
  }
  frontendType?: FrontendType
}

export interface MultiAgentPolicy {
  agents: AIAgentConfig[]
  autonomy: string
  rules: {
    enforceArchitecture: boolean
    preserveDesignIdentity: boolean
    preventBoundaryViolations: boolean
  }
}

export interface ArchitectureIR {
  meta: IRMeta
  domains: Domain[]
  dependencies: Dependency[]
  rules: IRRuleConfig[]
  aiPolicies: AIPolicy[]
  uiDesign?: UIDesignIR
  multiAgent?: MultiAgentPolicy
}
