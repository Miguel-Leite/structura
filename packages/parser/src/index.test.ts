import { describe, it, expect } from "vitest"
import { parseProject } from "./index.js"
import { join } from "node:path"
import type { ArchitectureIR } from "@structura/ir"

const fixtureRoot = join(import.meta.dirname, "__fixtures__", "test-project")

const testIR: ArchitectureIR = {
  meta: {
    version: "1.0",
    projectName: "test-project",
    projectStyle: "modular-monolith",
    createdAt: "",
  },
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

describe("parseProject", () => {
  it("should parse all source files", () => {
    const result = parseProject({ projectRoot: fixtureRoot, ir: testIR })
    expect(result.sources.size).toBeGreaterThanOrEqual(4)
  })

  it("should detect external dependencies", () => {
    const result = parseProject({ projectRoot: fixtureRoot, ir: testIR })
    const zodDeps = result.graph.externalDependencies.get("zod")
    expect(zodDeps).toBeDefined()
    expect(zodDeps?.size).toBeGreaterThan(0)
  })

  it("should detect cross-domain imports", () => {
    const result = parseProject({ projectRoot: fixtureRoot, ir: testIR })
    const crossDomainEdges = result.graph.edges.filter((e) => e.isCrossDomain)
    expect(crossDomainEdges.length).toBeGreaterThanOrEqual(2)

    const billingToAnalytics = crossDomainEdges.find(
      (e) => e.sourceDomain === "billing" && e.targetDomain === "analytics",
    )
    expect(billingToAnalytics).toBeDefined()
    expect(billingToAnalytics?.isAllowed).toBe(false)

    const billingToPayments = crossDomainEdges.find(
      (e) => e.sourceDomain === "billing" && e.targetDomain === "payments",
    )
    expect(billingToPayments).toBeDefined()
    expect(billingToPayments?.isAllowed).toBe(true)
  })

  it("should map source files to domains", () => {
    const result = parseProject({ projectRoot: fixtureRoot, ir: testIR })
    const billingSource = Array.from(result.sources.values()).find(
      (s) => s.filePath.includes("billing") && s.filePath.endsWith("service.ts"),
    )
    expect(billingSource).toBeDefined()
    expect(billingSource?.domainId).toBe("billing")
  })

  it("should return empty graph for project without tsconfig", () => {
    const result = parseProject({ projectRoot: "/non/existent", ir: testIR })
    expect(result.sources.size).toBe(0)
    expect(result.graph.edges).toHaveLength(0)
  })
})
