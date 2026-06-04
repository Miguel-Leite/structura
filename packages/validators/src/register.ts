import { ForbiddenCrossDomainImportRule } from "./forbidden-cross-domain-import.js"
import { MaxFileLinesRule } from "./max-file-lines.js"
import { NoCircularDependenciesRule } from "./no-circular-dependencies.js"
import { SeparateLogicAndUiRule } from "./separate-logic-and-ui.js"
import { PreventMassiveComponentsRule } from "./prevent-massive-components.js"
import { ComponentNamingConventionRule } from "./component-naming-convention.js"
import type { Registry } from "@structura/rules-engine"

export function registerBuiltinRules(registry: Registry): void {
  registry.register(new ForbiddenCrossDomainImportRule())
  registry.register(new MaxFileLinesRule())
  registry.register(new NoCircularDependenciesRule())
  registry.register(new SeparateLogicAndUiRule())
  registry.register(new PreventMassiveComponentsRule())
  registry.register(new ComponentNamingConventionRule())
}
