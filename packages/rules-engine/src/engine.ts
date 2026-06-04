import type { ValidationContext, Rule, RuleResult, ValidationSummary } from "./types.js"
import type { Registry } from "./registry.js"

export class Engine {
  private registry: Registry

  constructor(registry: Registry) {
    this.registry = registry
  }

  run(context: ValidationContext, ruleIds?: string[]): Map<string, RuleResult[]> {
    const rules = ruleIds
      ? ruleIds.map((id) => this.registry.get(id)).filter((r): r is Rule => r !== undefined)
      : this.registry.getAll()

    const results = new Map<string, RuleResult[]>()

    for (const rule of rules) {
      results.set(rule.id, rule.validate(context))
    }

    return results
  }

  getSummary(results: Map<string, RuleResult[]>): ValidationSummary {
    const allResults: RuleResult[] = []
    for (const [, ruleResults] of results) {
      allResults.push(...ruleResults)
    }

    const summary: ValidationSummary = {
      total: allResults.length,
      passed: allResults.filter((r) => r.passed).length,
      failed: allResults.filter((r) => !r.passed).length,
      errors: allResults.filter((r) => !r.passed && r.severity === "error").length,
      warnings: allResults.filter((r) => !r.passed && r.severity === "warning").length,
      infos: allResults.filter((r) => !r.passed && r.severity === "info").length,
      results: allResults,
    }

    return summary
  }
}
