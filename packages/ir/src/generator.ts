import type { StructuraConfig } from "@structura/config"
import type {
  AIPolicy,
  ArchitectureIR,
  Dependency,
  Domain,
  IRMeta,
  IRRuleConfig,
  MultiAgentPolicy,
  UIDesignIR,
} from "./types.js"

function createMeta(config: StructuraConfig): IRMeta {
  return {
    version: "1.0",
    projectName: config.project?.name ?? "unnamed",
    projectStyle: config.architecture.style,
    projectType: config.project?.type,
    createdAt: new Date().toISOString(),
  }
}

function createDomains(config: StructuraConfig): Domain[] {
  return config.domains.map((d) => ({
    id: d.name,
    name: d.name,
    path: d.path,
    canAccess: d.can_access ?? [],
    cannotAccess: d.cannot_access ?? [],
    naming: d.naming,
  }))
}

function createDependencies(config: StructuraConfig): Dependency[] {
  const deps: Dependency[] = []

  for (const domain of config.domains) {
    for (const targetId of domain.can_access ?? []) {
      deps.push({
        sourceId: domain.name,
        targetId,
        kind: "domain",
        allowed: true,
      })
    }

    for (const targetId of domain.cannot_access ?? []) {
      deps.push({
        sourceId: domain.name,
        targetId,
        kind: "domain",
        allowed: false,
        reason: `Configured in structura.yml: ${domain.name} cannot access ${targetId}`,
      })
    }
  }

  return deps
}

function createRules(config: StructuraConfig): IRRuleConfig[] {
  const rules: IRRuleConfig[] = []

  if (config.rules?.forbid_cross_domain_imports) {
    rules.push({
      id: "forbidden-cross-domain-import",
      enabled: true,
      severity: "error",
      config: {},
    })
  }

  if (config.rules?.max_file_lines) {
    rules.push({
      id: "max-file-lines",
      enabled: true,
      severity: "warning",
      config: { maxLines: config.rules.max_file_lines },
    })
  }

  return rules
}

function createAIPolicies(config: StructuraConfig): AIPolicy[] {
  const ai = config.ai
  if (!ai) return []

  return config.domains.map((d) => ({
    domainId: d.name,
    autonomy: ai.autonomy,
  }))
}

function createUIDesign(config: StructuraConfig): UIDesignIR | undefined {
  const projectType = config.project?.type
  if (!projectType) return undefined

  const uiDesign: UIDesignIR = {
    projectType,
  }

  if (config.design?.philosophy) {
    uiDesign.designPhilosophy = config.design.philosophy
  }

  if (config.design?.constraints) {
    uiDesign.designConstraints = {
      avoidGenericAiLayouts: config.design.constraints.avoid_generic_ai_layouts,
      avoidDefaultDashboardPatterns: config.design.constraints.avoid_default_dashboard_patterns,
      avoidRepetitiveCardGrids: config.design.constraints.avoid_repetitive_card_grids,
    }
  }

  if (config.ui?.styling) {
    uiDesign.stylingSystem = config.ui.styling
  }

  if (config.ui?.layout) {
    uiDesign.layout = {
      preferAsymmetry: config.ui.layout.prefer_asymmetry,
      enforceVisualHierarchy: config.ui.layout.enforce_visual_hierarchy,
    }
  }

  if (config.components?.architecture) {
    uiDesign.componentArchitecture = config.components.architecture
  }

  if (config.components?.organization) {
    uiDesign.componentOrganization = config.components.organization
  }

  if (config.components?.rules) {
    uiDesign.componentRules = {
      separateLogicAndUi: config.components.rules.separate_logic_and_ui,
      enforceAccessibility: config.components.rules.enforce_accessibility,
      preventMassiveComponents: config.components.rules.prevent_massive_components,
      enforceVariantConsistency: config.components.rules.enforce_variant_consistency,
      maxLines: config.components.rules.max_lines,
    }
  }

  if (config.design_system) {
    uiDesign.designSystem = {
      enabled: config.design_system.enabled,
      tokens: config.design_system.tokens,
      variants: config.design_system.variants,
      motion: config.design_system.motion,
      theme: config.design_system.theme,
      accessibility: config.design_system.accessibility,
      slots: config.design_system.slots,
      responsive: config.design_system.responsive,
    }
  }

  if (config.frontend?.type) {
    uiDesign.frontendType = config.frontend.type
  }

  return uiDesign
}

function createMultiAgent(config: StructuraConfig): MultiAgentPolicy | undefined {
  const ai = config.ai
  if (!ai?.agents || ai.agents.length === 0) return undefined

  return {
    agents: ai.agents,
    autonomy: ai.autonomy,
    rules: {
      enforceArchitecture: ai.rules?.enforce_architecture ?? true,
      preserveDesignIdentity: ai.rules?.preserve_design_identity ?? true,
      preventBoundaryViolations: ai.rules?.prevent_boundary_violations ?? true,
    },
  }
}

export function generateIR(config: StructuraConfig): ArchitectureIR {
  return {
    meta: createMeta(config),
    domains: createDomains(config),
    dependencies: createDependencies(config),
    rules: createRules(config),
    aiPolicies: createAIPolicies(config),
    uiDesign: createUIDesign(config),
    multiAgent: createMultiAgent(config),
  }
}
