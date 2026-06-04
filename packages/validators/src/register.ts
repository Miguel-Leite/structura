import { ForbiddenCrossDomainImportRule } from "./forbidden-cross-domain-import.js"
import { MaxFileLinesRule } from "./max-file-lines.js"
import { NoCircularDependenciesRule } from "./no-circular-dependencies.js"
import type { Registry } from "@structura/rules-engine"

export function registerBuiltinRules(registry: Registry): void {
  registry.register(new ForbiddenCrossDomainImportRule())
  registry.register(new MaxFileLinesRule())
  registry.register(new NoCircularDependenciesRule())
}
