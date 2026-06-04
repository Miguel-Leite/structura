import type { Rule, ValidationContext, RuleResult } from "@structura/rules-engine"

function isComponentFile(filePath: string): boolean {
  return filePath.endsWith(".tsx") || filePath.endsWith(".jsx")
}

export class PreventMassiveComponentsRule implements Rule {
  id = "prevent-massive-components"
  category = "component" as const
  severity = "warning" as const
  description = "Detects component files that exceed the maximum allowed lines"

  validate(ctx: ValidationContext): RuleResult[] {
    const results: RuleResult[] = []
    const maxLinesConfig = ctx.ir.rules.find((r) => r.id === this.id)
    const maxLines = (maxLinesConfig?.config?.maxLines as number) ?? 150

    for (const [filePath, source] of ctx.sources) {
      if (!isComponentFile(filePath)) continue
      if (source.lineCount > maxLines) {
        results.push({
          ruleId: this.id,
          passed: false,
          file: filePath,
          message: `Componente excede limite de ${maxLines} linhas (${source.lineCount})`,
          detail: `${filePath} tem ${source.lineCount} linhas, máximo permitido é ${maxLines}`,
          severity: this.severity,
          suggestedFix: `Divida este componente em componentes menores`,
        })
      }
    }

    if (results.length === 0) {
      return [
        { ruleId: this.id, passed: true, message: `Nenhum componente excede ${maxLines} linhas`, severity: this.severity },
      ]
    }

    return results
  }
}
