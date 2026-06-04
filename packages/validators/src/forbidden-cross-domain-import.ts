import type { Rule, ValidationContext, RuleResult } from "@structura/rules-engine"

export class ForbiddenCrossDomainImportRule implements Rule {
  id = "forbidden-cross-domain-import"
  category = "import" as const
  severity = "error" as const
  description = "Detects imports between domains that are not allowed"

  validate(ctx: ValidationContext): RuleResult[] {
    const results: RuleResult[] = []

    for (const [filePath, source] of ctx.sources) {
      if (!source.domainId) continue

      for (const imp of source.imports) {
        if (!imp.targetDomainId || imp.targetDomainId === source.domainId) continue

        const dep = ctx.ir.dependencies.find(
          (d) => d.sourceId === source.domainId && d.targetId === imp.targetDomainId,
        )

        const isAllowed = dep?.allowed ?? false

        if (!isAllowed) {
          results.push({
            ruleId: this.id,
            passed: false,
            file: filePath,
            line: imp.line,
            message: `Import proibido: "${source.domainId}" não pode importar "${imp.targetDomainId}"`,
            detail: `O domínio ${source.domainId} tentou importar de ${imp.targetDomainId} em ${filePath}:${imp.line}`,
            severity: this.severity,
            suggestedFix: `Remova ou mova este import para um domínio permitido`,
          })
        }
      }
    }

    if (results.length === 0) {
      return [
        { ruleId: this.id, passed: true, message: "Nenhum import cross-domain proibido encontrado", severity: this.severity },
      ]
    }

    return results
  }
}
