import { describe, it, expect } from "vitest"
import { ForbiddenCrossDomainImportRule } from "./forbidden-cross-domain-import.js"
import { MaxFileLinesRule } from "./max-file-lines.js"
import { NoCircularDependenciesRule } from "./no-circular-dependencies.js"
import { SeparateLogicAndUiRule } from "./separate-logic-and-ui.js"
import { PreventMassiveComponentsRule } from "./prevent-massive-components.js"
import { ComponentNamingConventionRule } from "./component-naming-convention.js"
import { registerBuiltinRules } from "./register.js"
import { Registry } from "@structura/rules-engine"
import type { ValidationContext } from "@structura/rules-engine"
import type { ArchitectureIR } from "@structura/ir"

const baseIR: ArchitectureIR = {
  meta: { version: "1.0", projectName: "test", projectStyle: "modular-monolith", createdAt: "" },
  domains: [
    { id: "billing", name: "billing", path: "src/billing", canAccess: ["payments"], cannotAccess: ["analytics"] },
    { id: "payments", name: "payments", path: "src/payments", canAccess: [], cannotAccess: [] },
    { id: "analytics", name: "analytics", path: "src/analytics", canAccess: [], cannotAccess: [] },
  ],
  dependencies: [
    { sourceId: "billing", targetId: "payments", kind: "domain", allowed: true },
    { sourceId: "billing", targetId: "analytics", kind: "domain", allowed: false },
  ],
  rules: [],
  aiPolicies: [],
}

function makeGraph(allowed: boolean) {
  const { DependencyGraph } = require("@structura/graph")
  const graph = new DependencyGraph()
  graph.addNode({ id: "billing", type: "domain", label: "billing" })
  graph.addNode({ id: "payments", type: "domain", label: "payments" })
  graph.addNode({ id: "analytics", type: "domain", label: "analytics" })
  graph.addEdge({ id: "1", sourceId: "billing", targetId: "payments", kind: allowed ? "allowed" : "forbidden", weight: 1 })
  graph.addEdge({ id: "2", sourceId: "billing", targetId: "analytics", kind: "forbidden", weight: 1 })
  return graph
}

describe("ForbiddenCrossDomainImportRule", () => {
  it("should detect forbidden cross-domain imports", () => {
    const rule = new ForbiddenCrossDomainImportRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/billing/service.ts", {
          filePath: "src/billing/service.ts",
          lineCount: 10,
          domainId: "billing",
          imports: [
            { source: "@/analytics/service", targetDomainId: "analytics", line: 1 },
          ],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.some((r) => !r.passed && r.file === "src/billing/service.ts")).toBe(true)
  })

  it("should pass when no forbidden imports exist", () => {
    const rule = new ForbiddenCrossDomainImportRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/billing/service.ts", {
          filePath: "src/billing/service.ts",
          lineCount: 10,
          domainId: "billing",
          imports: [
            { source: "@/payments/service", targetDomainId: "payments", line: 1 },
          ],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.every((r) => r.passed)).toBe(true)
  })
})

describe("MaxFileLinesRule", () => {
  it("should detect files exceeding line limit", () => {
    const rule = new MaxFileLinesRule()
    const ir: ArchitectureIR = {
      ...baseIR,
      rules: [{ id: "max-file-lines", enabled: true, severity: "warning", config: { maxLines: 5 } }],
    }

    const ctx: ValidationContext = {
      ir,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/billing/huge.ts", { filePath: "src/billing/huge.ts", lineCount: 100, domainId: "billing", imports: [] }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.some((r) => !r.passed)).toBe(true)
  })

  it("should pass when files are within limit", () => {
    const rule = new MaxFileLinesRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/billing/small.ts", { filePath: "src/billing/small.ts", lineCount: 10, domainId: "billing", imports: [] }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.every((r) => r.passed)).toBe(true)
  })
})

describe("NoCircularDependenciesRule", () => {
  it("should detect cycles in graph", () => {
    const rule = new NoCircularDependenciesRule()
    const { DependencyGraph } = require("@structura/graph")
    const cyclicGraph = new DependencyGraph()
    cyclicGraph.addNode({ id: "a", type: "domain", label: "A" })
    cyclicGraph.addNode({ id: "b", type: "domain", label: "B" })
    cyclicGraph.addEdge({ id: "1", sourceId: "a", targetId: "b", kind: "dependency", weight: 1 })
    cyclicGraph.addEdge({ id: "2", sourceId: "b", targetId: "a", kind: "dependency", weight: 1 })

    const ctx: ValidationContext = {
      ir: baseIR,
      graph: cyclicGraph,
      projectRoot: "/test",
      sources: new Map(),
    }

    const results = rule.validate(ctx)
    expect(results.some((r) => !r.passed)).toBe(true)
  })
})

describe("SeparateLogicAndUiRule", () => {
  it("should detect business logic imports in component files", () => {
    const rule = new SeparateLogicAndUiRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/components/UserCard.tsx", {
          filePath: "src/components/UserCard.tsx",
          lineCount: 20,
          domainId: "ui",
          imports: [
            { source: "@/services/user", targetDomainId: "billing", line: 1 },
          ],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.some((r) => !r.passed)).toBe(true)
  })

  it("should pass when component only imports UI code", () => {
    const rule = new SeparateLogicAndUiRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/components/Button.tsx", {
          filePath: "src/components/Button.tsx",
          lineCount: 15,
          domainId: "ui",
          imports: [
            { source: "./Button.module.css", targetDomainId: undefined, line: 1 },
            { source: "react", targetDomainId: undefined, line: 2 },
          ],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.every((r) => r.passed)).toBe(true)
  })

  it("should ignore non-component files", () => {
    const rule = new SeparateLogicAndUiRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/services/user.ts", {
          filePath: "src/services/user.ts",
          lineCount: 10,
          domainId: "billing",
          imports: [
            { source: "@/database/connection", targetDomainId: undefined, line: 1 },
          ],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.every((r) => r.passed)).toBe(true)
  })
})

describe("PreventMassiveComponentsRule", () => {
  it("should detect component files exceeding line limit", () => {
    const rule = new PreventMassiveComponentsRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/components/HugeComponent.tsx", {
          filePath: "src/components/HugeComponent.tsx",
          lineCount: 300,
          domainId: "ui",
          imports: [],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.some((r) => !r.passed)).toBe(true)
  })

  it("should pass when component files are within limit", () => {
    const rule = new PreventMassiveComponentsRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/components/SmallComponent.tsx", {
          filePath: "src/components/SmallComponent.tsx",
          lineCount: 50,
          domainId: "ui",
          imports: [],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.every((r) => r.passed)).toBe(true)
  })

  it("should ignore non-component files", () => {
    const rule = new PreventMassiveComponentsRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/services/huge.ts", {
          filePath: "src/services/huge.ts",
          lineCount: 500,
          domainId: "billing",
          imports: [],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.every((r) => r.passed)).toBe(true)
  })
})

describe("ComponentNamingConventionRule", () => {
  it("should detect non-PascalCase component files", () => {
    const rule = new ComponentNamingConventionRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/components/button.tsx", {
          filePath: "src/components/button.tsx",
          lineCount: 10,
          domainId: "ui",
          imports: [],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.some((r) => !r.passed)).toBe(true)
  })

  it("should pass when component files use PascalCase", () => {
    const rule = new ComponentNamingConventionRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/components/Button.tsx", {
          filePath: "src/components/Button.tsx",
          lineCount: 10,
          domainId: "ui",
          imports: [],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.every((r) => r.passed)).toBe(true)
  })

  it("should ignore non-component files", () => {
    const rule = new ComponentNamingConventionRule()
    const ctx: ValidationContext = {
      ir: baseIR,
      graph: makeGraph(true),
      projectRoot: "/test",
      sources: new Map([
        ["src/utils/helper.ts", {
          filePath: "src/utils/helper.ts",
          lineCount: 10,
          domainId: "shared",
          imports: [],
        }],
      ]),
    }

    const results = rule.validate(ctx)
    expect(results.every((r) => r.passed)).toBe(true)
  })
})

describe("registerBuiltinRules", () => {
  it("should register all built-in rules", () => {
    const registry = new Registry()
    registerBuiltinRules(registry)
    expect(registry.size).toBe(6)
    expect(registry.get("forbidden-cross-domain-import")).toBeDefined()
    expect(registry.get("max-file-lines")).toBeDefined()
    expect(registry.get("no-circular-dependencies")).toBeDefined()
    expect(registry.get("separate-logic-and-ui")).toBeDefined()
    expect(registry.get("prevent-massive-components")).toBeDefined()
    expect(registry.get("component-naming-convention")).toBeDefined()
  })
})
