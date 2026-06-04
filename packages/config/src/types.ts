export type ArchitectureStyle = "monolith" | "modular-monolith" | "microservices"

export type AIAutonomyLevel = "constrained" | "guided" | "supervised"

export interface DomainConfig {
  name: string
  path: string
  can_access?: string[]
  cannot_access?: string[]
  naming?: {
    files?: string
    exports?: string
  }
}

export interface RuleConfig {
  max_file_lines?: number
  forbid_cross_domain_imports?: boolean
}

export interface AIConfig {
  autonomy: AIAutonomyLevel
}

export interface FeaturesConfig {
  drift_detection?: boolean
  ai_governance?: boolean
}

export interface StructuraConfig {
  project?: {
    name: string
  }
  architecture: {
    style: ArchitectureStyle
  }
  frontend?: {
    framework: string
    state?: string
  }
  backend?: {
    framework: string
    orm?: string
  }
  domains: DomainConfig[]
  rules?: RuleConfig
  ai?: AIConfig
  features?: FeaturesConfig
}
