export type ArchitectureStyle = "monolith" | "modular-monolith" | "microservices"

export type AIAutonomyLevel = "strict" | "constrained" | "guided" | "supervised" | "hybrid" | "autonomous"

export type ProjectType =
  | "frontend-application"
  | "backend-api"
  | "fullstack-platform"
  | "ai-product"
  | "saas"
  | "ui-infrastructure"
  | "infrastructure-tool"

export type DesignPhilosophy =
  | "minimal"
  | "editorial"
  | "premium"
  | "brutalist"
  | "experimental"
  | "futuristic"
  | "enterprise"
  | "custom"

export type StylingSystem =
  | "tailwindcss"
  | "css-modules"
  | "pandacss"
  | "unocss"
  | "styled-components"
  | "vanilla-extract"

export type ComponentArchitecture =
  | "headless"
  | "compound-components"
  | "atomic-design"
  | "feature-based"
  | "semantic-components"
  | "design-system"

export type ComponentOrganization =
  | "by-feature"
  | "by-domain"
  | "by-semantic-responsibility"
  | "by-ui-layer"
  | "by-design-tokens"

export type FrontendType = "application" | "ui-infrastructure"

export type AIAgentId = "opencode" | "cursor" | "claude" | "copilot" | "continue"

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

export interface DesignConstraints {
  avoid_generic_ai_layouts?: boolean
  avoid_default_dashboard_patterns?: boolean
  avoid_repetitive_card_grids?: boolean
}

export interface DesignConfig {
  philosophy?: DesignPhilosophy
  constraints?: DesignConstraints
}

export interface LayoutConfig {
  prefer_asymmetry?: boolean
  enforce_visual_hierarchy?: boolean
}

export interface UIConfig {
  styling?: StylingSystem
  layout?: LayoutConfig
}

export interface ComponentRulesConfig {
  separate_logic_and_ui?: boolean
  enforce_accessibility?: boolean
  prevent_massive_components?: boolean
  enforce_variant_consistency?: boolean
  max_lines?: number
}

export interface ComponentConfig {
  architecture?: ComponentArchitecture
  organization?: ComponentOrganization
  rules?: ComponentRulesConfig
}

export interface DesignSystemConfig {
  enabled?: boolean
  tokens?: boolean
  variants?: boolean
  motion?: boolean
  theme?: boolean
  accessibility?: boolean
  slots?: boolean
  responsive?: boolean
}

export interface AIRulesConfig {
  enforce_architecture?: boolean
  preserve_design_identity?: boolean
  prevent_boundary_violations?: boolean
}

export interface AIAgentConfig {
  id: AIAgentId
  autonomy: AIAutonomyLevel
}

export interface AIConfig {
  autonomy: AIAutonomyLevel
  agents?: AIAgentConfig[]
  rules?: AIRulesConfig
}

export interface FeaturesConfig {
  drift_detection?: boolean
  ai_governance?: boolean
}

export interface StructuraConfig {
  project?: {
    name: string
    type?: ProjectType
  }
  architecture: {
    style: ArchitectureStyle
  }
  design?: DesignConfig
  ui?: UIConfig
  components?: ComponentConfig
  design_system?: DesignSystemConfig
  frontend?: {
    framework: string
    state?: string
    type?: FrontendType
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
