import { describe, it, expect } from "vitest"
import { detectDrift } from "./engine.js"
import type { ArchitectureIR } from "@structura/ir"
import type { ImportGraph, ImportEdge } from "@structura/parser"

function makeIR(overrides?: Partial<ArchitectureIR>): ArchitectureIR {
  return {
    meta: {
      version: "1.0",
      projectName: "test",
      projectStyle: "modular-monolith",
      createdAt: "2026-01-01T00:00:00Z",
    },
    domains: [
      {
        id: "core",
        name: "Core",
        path: "packages/core/src",
        canAccess: ["shared"],
        cannotAccess: ["billing"],
        naming: { files: "*.ts" },
      },
      {
        id: "billing",
        name: "Billing",
        path: "packages/billing/src",
        canAccess: ["shared"],
        cannotAccess: [],
      },
      {
        id: "shared",
        name: "Shared",
        path: "packages/shared/src",
        canAccess: [],
        cannotAccess: [],
      },
    ],
    dependencies: [
      { sourceId: "core", targetId: "shared", kind: "domain", allowed: true },
      { sourceId: "billing", targetId: "core", kind: "domain", allowed: false, reason: "Billing nao pode depender de Core" },
    ],
    rules: [],
    aiPolicies: [],
    ...overrides,
  }
}

function makeEdge(overrides: Partial<ImportEdge>): ImportEdge {
  return {
    sourceFile: "packages/core/src/index.ts",
    targetFile: "packages/shared/src/utils.ts",
    sourceDomain: "core",
    targetDomain: "shared",
    importSymbol: "formatDate",
    line: 5,
    isCrossDomain: false,
    isAllowed: true,
    ...overrides,
  }
}

function makeGraph(edges: ImportEdge[]): ImportGraph {
  return {
    edges,
    nodeImports: new Map(),
    domainImports: new Map(),
    externalDependencies: new Map(),
  }
}

describe("detectDrift", () => {
  it("deve retornar report vazio quando nao ha drift", () => {
    const ir = makeIR()
    const graph = makeGraph([
      makeEdge({
        sourceDomain: "core",
        targetDomain: "shared",
        isCrossDomain: true,
        isAllowed: true,
      }),
    ])

    const report = detectDrift(ir, graph)
    expect(report.summary.total).toBe(0)
    expect(report.summary.errors).toBe(0)
    expect(report.summary.warnings).toBe(0)
  })

  it("deve detectar import inesperado (sem regra de dependencia)", () => {
    const ir = makeIR()
    const graph = makeGraph([
      makeEdge({
        sourceDomain: "billing",
        targetDomain: "analytics",
        isCrossDomain: true,
        isAllowed: false,
      }),
    ])

    const report = detectDrift(ir, graph)
    const unexpected = report.findings.filter((f) => f.type === "unexpected")
    expect(unexpected.length).toBeGreaterThanOrEqual(1)
    expect(unexpected[0]?.severity).toBe("error")
    expect(unexpected[0]?.sourceFile).toContain("packages/core/src/index.ts")
  })

  it("deve detectar import proibido (dependency.allowed=false)", () => {
    const ir = makeIR()
    const graph = makeGraph([
      makeEdge({
        sourceDomain: "billing",
        targetDomain: "core",
        isCrossDomain: true,
        isAllowed: false,
      }),
    ])

    const report = detectDrift(ir, graph)
    const disallowed = report.findings.filter((f) => f.type === "disallowed")
    expect(disallowed.length).toBeGreaterThanOrEqual(1)
    expect(disallowed[0]?.severity).toBe("error")
  })

  it("deve detectar import proibido via cannotAccess", () => {
    const ir = makeIR()
    const graph = makeGraph([
      makeEdge({
        sourceDomain: "core",
        targetDomain: "billing",
        isCrossDomain: true,
        isAllowed: false,
      }),
    ])

    const report = detectDrift(ir, graph)
    const cannotAccess = report.findings.filter(
      (f) => f.type === "disallowed" && f.message.includes("cannotAccess"),
    )
    expect(cannotAccess.length).toBeGreaterThanOrEqual(1)
  })

  it("deve detectar dependencia faltante (allowed=true sem imports)", () => {
    const ir = makeIR()
    const graph = makeGraph([])

    const report = detectDrift(ir, graph)
    expect(report.summary.missing).toBe(1)
    expect(report.findings[0]?.message).toContain("core")
    expect(report.findings[0]?.message).toContain("shared")
    expect(report.findings[0]?.severity).toBe("warning")
  })

  it("nao deve gerar missing para dependencias permitidas com import existente", () => {
    const ir = makeIR()
    const graph = makeGraph([
      makeEdge({
        sourceDomain: "core",
        targetDomain: "shared",
        isCrossDomain: true,
        isAllowed: true,
      }),
    ])

    const report = detectDrift(ir, graph)
    const missingCoreShared = report.findings.filter(
      (f) => f.type === "missing" && f.message.includes("core") && f.message.includes("shared"),
    )
    expect(missingCoreShared.length).toBe(0)
  })

  it("deve ignorar imports dentro do mesmo dominio", () => {
    const ir = makeIR()
    const graph = makeGraph([
      makeEdge({
        sourceDomain: "core",
        targetDomain: "core",
        isCrossDomain: false,
        isAllowed: true,
      }),
    ])

    const report = detectDrift(ir, graph)
    const unexpectedCoreCore = report.findings.filter(
      (f) => f.type === "unexpected" && f.message.includes("core") && f.message.includes("core"),
    )
    expect(unexpectedCoreCore.length).toBe(0)
  })
})
