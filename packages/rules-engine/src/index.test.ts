import { describe, it, expect } from "vitest"
import { Registry, Engine } from "./index.js"
import type { Rule, ValidationContext } from "./types.js"

describe("Registry", () => {
  it("should register and retrieve rules", () => {
    const registry = new Registry()
    const rule: Rule = {
      id: "test-rule",
      category: "dependency",
      severity: "error",
      description: "Test rule",
      validate: () => [],
    }

    registry.register(rule)
    expect(registry.get("test-rule")).toBe(rule)
    expect(registry.size).toBe(1)
  })

  it("should throw on duplicate registration", () => {
    const registry = new Registry()
    const rule: Rule = {
      id: "dup",
      category: "dependency",
      severity: "error",
      description: "Duplicate",
      validate: () => [],
    }

    registry.register(rule)
    expect(() => registry.register(rule)).toThrow()
  })

  it("should filter by category", () => {
    const registry = new Registry()
    registry.register({
      id: "a", category: "import", severity: "error", description: "", validate: () => [],
    })
    registry.register({
      id: "b", category: "import", severity: "error", description: "", validate: () => [],
    })
    registry.register({
      id: "c", category: "naming", severity: "warning", description: "", validate: () => [],
    })

    expect(registry.getByCategory("import")).toHaveLength(2)
    expect(registry.getByCategory("naming")).toHaveLength(1)
  })
})

describe("Engine", () => {
  it("should run all registered rules", () => {
    const registry = new Registry()

    registry.register({
      id: "passing-rule",
      category: "dependency",
      severity: "error",
      description: "Always passes",
      validate: () => [
        { ruleId: "passing-rule", passed: true, message: "ok", severity: "error" },
      ],
    })

    registry.register({
      id: "failing-rule",
      category: "dependency",
      severity: "warning",
      description: "Always fails",
      validate: () => [
        { ruleId: "failing-rule", passed: false, message: "fail", severity: "warning" },
      ],
    })

    const engine = new Engine(registry)
    const context = {} as unknown as ValidationContext
    const results = engine.run(context)

    expect(results.size).toBe(2)
    expect(results.get("passing-rule")?.[0]?.passed).toBe(true)
    expect(results.get("failing-rule")?.[0]?.passed).toBe(false)
  })

  it("should compute summary correctly", () => {
    const registry = new Registry()
    const rule: Rule = {
      id: "test",
      category: "dependency",
      severity: "error",
      description: "Mixed results",
      validate: () => [
        { ruleId: "test", passed: true, message: "ok", severity: "error" },
        { ruleId: "test", passed: false, message: "error", severity: "error" },
        { ruleId: "test", passed: false, message: "warning", severity: "warning" },
      ],
    }

    registry.register(rule)
    const engine = new Engine(registry)
    const results = engine.run({} as unknown as ValidationContext)
    const summary = engine.getSummary(results)

    expect(summary.total).toBe(3)
    expect(summary.passed).toBe(1)
    expect(summary.failed).toBe(2)
    expect(summary.errors).toBe(1)
    expect(summary.warnings).toBe(1)
  })

  it("should run only specified rule IDs", () => {
    const registry = new Registry()

    registry.register({
      id: "run-this", category: "dependency", severity: "error", description: "", validate: () => [
        { ruleId: "run-this", passed: true, message: "", severity: "error" },
      ],
    })
    registry.register({
      id: "skip-this", category: "dependency", severity: "error", description: "", validate: () => [
        { ruleId: "skip-this", passed: false, message: "", severity: "error" },
      ],
    })

    const engine = new Engine(registry)
    const results = engine.run({} as unknown as ValidationContext, ["run-this"])

    expect(results.size).toBe(1)
    expect(results.has("run-this")).toBe(true)
    expect(results.has("skip-this")).toBe(false)
  })
})
