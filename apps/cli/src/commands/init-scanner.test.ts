import { describe, it, expect } from "vitest"
import { scanProject } from "./init-scanner.js"

describe("scanProject", () => {
  const projectRoot = process.cwd()

  it("should detect monorepo workspaces", () => {
    const result = scanProject(projectRoot)
    expect(result.isMonorepo).toBe(true)
    expect(result.domains.length).toBeGreaterThan(0)
  })

  it("should detect packages with src/ folder", () => {
    const result = scanProject(projectRoot)
    const core = result.domains.find((d) => d.name.includes("core"))
    expect(core).toBeDefined()
    expect(core?.detected).toBe(true)
    expect(core?.path).toMatch(/src$/)
  })

  it("should detect cli app", () => {
    const result = scanProject(projectRoot)
    const cli = result.domains.find((d) => d.name.includes("cli"))
    expect(cli).toBeDefined()
    expect(cli?.path).toMatch(/src$/)
  })

  it("should mark all detected domains", () => {
    const result = scanProject(projectRoot)
    for (const domain of result.domains) {
      expect(domain.detected).toBe(true)
    }
  })
})
