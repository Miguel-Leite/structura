import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { findConfigPath, readConfig } from "./index.js"

function createTempDir(): string {
  const dir = join(tmpdir(), `structura-test-${randomUUID()}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

describe("findConfigPath", () => {
  it("should find structura.yml", () => {
    const dir = createTempDir()
    writeFileSync(join(dir, "structura.yml"), "project:\n  name: test")
    expect(findConfigPath(dir)).toBe(join(dir, "structura.yml"))
  })

  it("should find structura.yaml", () => {
    const dir = createTempDir()
    writeFileSync(join(dir, "structura.yaml"), "project:\n  name: test")
    expect(findConfigPath(dir)).toBe(join(dir, "structura.yaml"))
  })

  it("should return null if no config", () => {
    const dir = createTempDir()
    expect(findConfigPath(dir)).toBeNull()
  })
})

describe("readConfig", () => {
  it("should parse a valid config", () => {
    const dir = createTempDir()
    const path = join(dir, "structura.yml")
    writeFileSync(
      path,
      `
project:
  name: my-app
architecture:
  style: modular-monolith
domains:
  - name: billing
    path: src/billing
  - name: payments
    path: src/payments
ai:
  autonomy: constrained
`,
    )
    const result = readConfig(path)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.project?.name).toBe("my-app")
      expect(result.value.architecture.style).toBe("modular-monolith")
      expect(result.value.domains).toHaveLength(2)
    }
  })

  it("should fail for invalid config", () => {
    const dir = createTempDir()
    const path = join(dir, "structura.yml")
    writeFileSync(path, "architecture:\n  style: invalid-style")
    const result = readConfig(path)
    expect(result.ok).toBe(false)
  })

  it("should fail for empty domains", () => {
    const dir = createTempDir()
    const path = join(dir, "structura.yml")
    writeFileSync(
      path,
      `
architecture:
  style: monolith
domains: []
`,
    )
    const result = readConfig(path)
    expect(result.ok).toBe(false)
  })
})
