import type { StructuraConfig } from "@structura/config"
import { describe, expect, it } from "vitest"
import { deserializeIR, generateIR, serializeIR } from "./index.js"

const validConfig: StructuraConfig = {
  project: { name: "test-app" },
  architecture: { style: "modular-monolith" },
  domains: [
    {
      name: "billing",
      path: "src/billing",
      can_access: ["payments"],
      cannot_access: ["analytics"],
    },
    { name: "payments", path: "src/payments" },
    { name: "analytics", path: "src/analytics" },
  ],
  rules: {
    forbid_cross_domain_imports: true,
    max_file_lines: 300,
  },
  ai: { autonomy: "constrained" },
}

describe("generateIR", () => {
  it("should generate IR from config", () => {
    const ir = generateIR(validConfig)

    expect(ir.meta.projectName).toBe("test-app")
    expect(ir.meta.projectStyle).toBe("modular-monolith")
    expect(ir.domains).toHaveLength(3)
  })

  it("should create dependencies from can_access", () => {
    const ir = generateIR(validConfig)
    const billingToPayments = ir.dependencies.find(
      (d) => d.sourceId === "billing" && d.targetId === "payments",
    )
    expect(billingToPayments?.allowed).toBe(true)
  })

  it("should create dependencies from cannot_access", () => {
    const ir = generateIR(validConfig)
    const billingToAnalytics = ir.dependencies.find(
      (d) => d.sourceId === "billing" && d.targetId === "analytics",
    )
    expect(billingToAnalytics?.allowed).toBe(false)
  })

  it("should generate rules from config", () => {
    const ir = generateIR(validConfig)
    expect(ir.rules).toHaveLength(2)
    expect(ir.rules[0]?.id).toBe("forbidden-cross-domain-import")
    expect(ir.rules[1]?.id).toBe("max-file-lines")
  })

  it("should generate AI policies", () => {
    const ir = generateIR(validConfig)
    expect(ir.aiPolicies).toHaveLength(3)
    expect(ir.aiPolicies[0]?.autonomy).toBe("constrained")
  })
})

describe("serializeIR / deserializeIR", () => {
  it("should round-trip IR through JSON", () => {
    const ir = generateIR(validConfig)
    const json = serializeIR(ir)
    const parsed = deserializeIR(json)
    expect(parsed.meta.projectName).toBe("test-app")
    expect(parsed.domains).toHaveLength(3)
  })
})
