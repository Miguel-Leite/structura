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

describe("generateIR with design/types config", () => {
  const fullConfig: StructuraConfig = {
    project: { name: "test-app", type: "fullstack-platform" },
    architecture: { style: "modular-monolith" },
    domains: [
      { name: "web", path: "src/web" },
      { name: "api", path: "src/api" },
    ],
    rules: { forbid_cross_domain_imports: true },
    ai: {
      autonomy: "hybrid",
      agents: [
        { id: "opencode", autonomy: "hybrid" },
        { id: "cursor", autonomy: "guided" },
      ],
      rules: { enforce_architecture: true },
    },
    design: {
      philosophy: "minimal",
      constraints: { avoid_generic_ai_layouts: true, avoid_default_dashboard_patterns: true },
    },
    ui: { styling: "tailwindcss" },
    frontend: { framework: "react", type: "application" },
    components: {
      architecture: "atomic-design",
      organization: "by-feature",
      rules: { separate_logic_and_ui: true, prevent_massive_components: true, max_lines: 150 },
    },
    design_system: { enabled: true, tokens: true, variants: true, motion: true, theme: true },
  }

  it("should generate uiDesign from config", () => {
    const ir = generateIR(fullConfig)
    expect(ir.uiDesign).toBeDefined()
    expect(ir.uiDesign?.projectType).toBe("fullstack-platform")
    expect(ir.uiDesign?.frontendType).toBe("application")
    expect(ir.uiDesign?.designPhilosophy).toBe("minimal")
    expect(ir.uiDesign?.stylingSystem).toBe("tailwindcss")
    expect(ir.uiDesign?.componentArchitecture).toBe("atomic-design")
    expect(ir.uiDesign?.componentOrganization).toBe("by-feature")
    expect(ir.uiDesign?.componentRules?.separateLogicAndUi).toBe(true)
    expect(ir.uiDesign?.componentRules?.maxLines).toBe(150)
    expect(ir.uiDesign?.designSystem?.tokens).toBe(true)
    expect(ir.uiDesign?.designSystem?.motion).toBe(true)
    expect(ir.uiDesign?.designConstraints?.avoidGenericAiLayouts).toBe(true)
  })

  it("should generate multiAgent policies", () => {
    const ir = generateIR(fullConfig)
    expect(ir.multiAgent).toBeDefined()
    expect(ir.multiAgent?.agents).toHaveLength(2)
    expect(ir.multiAgent?.agents[0]?.id).toBe("opencode")
    expect(ir.multiAgent?.agents[0]?.autonomy).toBe("hybrid")
    expect(ir.multiAgent?.agents[1]?.id).toBe("cursor")
    expect(ir.multiAgent?.agents[1]?.autonomy).toBe("guided")
  })

  it("should set projectType on meta", () => {
    const ir = generateIR(fullConfig)
    expect(ir.meta.projectType).toBe("fullstack-platform")
  })

  it("should not produce uiDesign when config has no design fields", () => {
    const ir = generateIR(validConfig)
    expect(ir.uiDesign).toBeUndefined()
    expect(ir.multiAgent).toBeUndefined()
    expect(ir.meta.projectType).toBeUndefined()
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
