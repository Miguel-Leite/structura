import type { StructuraConfig } from "@structura/config"
import type { AIPolicy, ArchitectureIR, Dependency, Domain, IRMeta, IRRuleConfig } from "./types.js"

function createMeta(config: StructuraConfig): IRMeta {
  return {
    version: "1.0",
    projectName: config.project?.name ?? "unnamed",
    projectStyle: config.architecture.style,
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

export function generateIR(config: StructuraConfig): ArchitectureIR {
  return {
    meta: createMeta(config),
    domains: createDomains(config),
    dependencies: createDependencies(config),
    rules: createRules(config),
    aiPolicies: createAIPolicies(config),
  }
}
