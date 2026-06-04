import type { Rule, ValidationContext, RuleResult } from "@structura/rules-engine"

function isComponentFile(filePath: string): boolean {
  return filePath.endsWith(".tsx") || filePath.endsWith(".jsx")
}

function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name)
}

export class ComponentNamingConventionRule implements Rule {
  id = "component-naming-convention"
  category = "component" as const
  severity = "warning" as const
  description = "Ensures component files export PascalCase names"

  validate(ctx: ValidationContext): RuleResult[] {
    const results: RuleResult[] = []

    for (const [filePath] of ctx.sources) {
      if (!isComponentFile(filePath)) continue

      const fileName = filePath.split("/").pop()?.replace(/\.(tsx|jsx)$/, "") ?? ""

      if (!isPascalCase(fileName)) {
        results.push({
          ruleId: this.id,
          passed: false,
          file: filePath,
          message: `Nome de arquivo de componente não segue PascalCase: "${fileName}"`,
          detail: `${filePath} deve usar PascalCase (ex: "${fileName.charAt(0).toUpperCase() + fileName.slice(1)}")`,
          severity: this.severity,
          suggestedFix: `Renomeie o arquivo para ${fileName.charAt(0).toUpperCase() + fileName.slice(1)}.tsx`,
        })
      }
    }

    if (results.length === 0) {
      return [
        { ruleId: this.id, passed: true, message: "Todos os componentes seguem PascalCase", severity: this.severity },
      ]
    }

    return results
  }
}
