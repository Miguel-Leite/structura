import type { Rule, ValidationContext, RuleResult } from "@structura/rules-engine"

export class MaxFileLinesRule implements Rule {
  id = "max-file-lines"
  category = "structure" as const
  severity = "warning" as const
  description = "Checks if files exceed the maximum allowed lines"

  validate(ctx: ValidationContext): RuleResult[] {
    const results: RuleResult[] = []
    const maxLinesConfig = ctx.ir.rules.find((r) => r.id === this.id)
    const maxLines = (maxLinesConfig?.config?.maxLines as number) ?? 300

    for (const [filePath, source] of ctx.sources) {
      if (source.lineCount > maxLines) {
        results.push({
          ruleId: this.id,
          passed: false,
          file: filePath,
          message: `Arquivo excede limite de ${maxLines} linhas (${source.lineCount})`,
          detail: `${filePath} tem ${source.lineCount} linhas, máximo permitido é ${maxLines}`,
          severity: this.severity,
          suggestedFix: `Divida este arquivo em módulos menores`,
        })
      }
    }

    if (results.length === 0) {
      return [
        { ruleId: this.id, passed: true, message: `Nenhum arquivo excede ${maxLines} linhas`, severity: this.severity },
      ]
    }

    return results
  }
}
