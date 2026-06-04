import type { Rule, ValidationContext, RuleResult } from "@structura/rules-engine"

const BUSINESS_LOGIC_PATTERNS = [
  "/services/",
  "/repositories/",
  "/stores/",
  "/api/",
  "/database/",
  "/infra/",
  "../services/",
  "../repositories/",
  "../stores/",
  "../api/",
  "../database/",
  "../infra/",
]

function isComponentFile(filePath: string): boolean {
  return filePath.endsWith(".tsx") || filePath.endsWith(".jsx")
}

function isBusinessLogicImport(source: string): boolean {
  return BUSINESS_LOGIC_PATTERNS.some((pattern) => source.includes(pattern))
}

export class SeparateLogicAndUiRule implements Rule {
  id = "separate-logic-and-ui"
  category = "component" as const
  severity = "error" as const
  description = "Detects business logic imports inside component files"

  validate(ctx: ValidationContext): RuleResult[] {
    const results: RuleResult[] = []

    for (const [filePath, source] of ctx.sources) {
      if (!isComponentFile(filePath)) continue

      for (const imp of source.imports) {
        if (isBusinessLogicImport(imp.source)) {
          results.push({
            ruleId: this.id,
            passed: false,
            file: filePath,
            line: imp.line,
            message: `Componente importa lógica de negócio: "${imp.source}"`,
            detail: `Arquivo de componente (${filePath}) não deve importar de serviços/repositórios/stores`,
            severity: this.severity,
            suggestedFix: `Mova a lógica para um hook, container ou camada intermediária`,
          })
        }
      }
    }

    if (results.length === 0) {
      return [
        { ruleId: this.id, passed: true, message: "Nenhum componente importa lógica de negócio", severity: this.severity },
      ]
    }

    return results
  }
}
