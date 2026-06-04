import type { Rule, ValidationContext, RuleResult } from "@structura/rules-engine"

export class NoCircularDependenciesRule implements Rule {
  id = "no-circular-dependencies"
  category = "dependency" as const
  severity = "error" as const
  description = "Detects circular dependencies between domains"

  validate(ctx: ValidationContext): RuleResult[] {
    const results: RuleResult[] = []
    const cycles = ctx.graph.detectCycles()

    for (const cycle of cycles) {
      results.push({
        ruleId: this.id,
        passed: false,
        message: `Dependência circular detectada: ${cycle.nodes.join(" → ")}`,
        detail: `Ciclo: ${cycle.nodes.join(" → ")}`,
        severity: this.severity,
        suggestedFix: `Remova uma das dependências para quebrar o ciclo`,
      })
    }

    if (results.length === 0) {
      return [
        {
          ruleId: this.id,
          passed: true,
          message: "Nenhuma dependência circular encontrada",
          severity: this.severity,
        },
      ]
    }

    return results
  }
}
