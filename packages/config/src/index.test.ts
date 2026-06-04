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

  it("should accept optional design config with project type", () => {
    const dir = createTempDir()
    const path = join(dir, "structura.yml")
    writeFileSync(
      path,
      `
project:
  name: my-app
  type: fullstack-platform
architecture:
  style: modular-monolith
domains:
  - name: web
    path: src/web
design:
  philosophy: minimal
  constraints:
    avoid_generic_ai_layouts: true
    avoid_default_dashboard_patterns: true
frontend:
  framework: react
  type: application
components:
  architecture: atomic-design
  organization: by-feature
  rules:
    separate_logic_and_ui: true
    prevent_massive_components: true
    enforce_accessibility: true
    max_lines: 150
design_system:
  enabled: true
  tokens: true
  variants: true
  motion: true
  theme: true
  accessibility: true
ai:
  autonomy: constrained
  agents:
    - id: opencode
      autonomy: hybrid
    - id: cursor
      autonomy: guided
  rules:
    enforce_architecture: true
    preserve_design_identity: true
`,
    )
    const result = readConfig(path)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.project?.type).toBe("fullstack-platform")
      expect(result.value.design?.philosophy).toBe("minimal")
      expect(result.value.frontend?.type).toBe("application")
      expect(result.value.frontend?.framework).toBe("react")
      expect(result.value.components?.architecture).toBe("atomic-design")
      expect(result.value.components?.organization).toBe("by-feature")
      expect(result.value.components?.rules?.separate_logic_and_ui).toBe(true)
      expect(result.value.components?.rules?.max_lines).toBe(150)
      expect(result.value.design_system?.tokens).toBe(true)
      expect(result.value.design?.constraints?.avoid_generic_ai_layouts).toBe(true)
      expect(result.value.ai?.agents).toHaveLength(2)
      expect(result.value.ai?.agents?.[0]?.id).toBe("opencode")
      expect(result.value.ai?.agents?.[0]?.autonomy).toBe("hybrid")
      expect(result.value.ai?.rules?.enforce_architecture).toBe(true)
    }
  })

  it("should reject invalid project type", () => {
    const dir = createTempDir()
    const path = join(dir, "structura.yml")
    writeFileSync(
      path,
      `
project:
  name: my-app
  type: invalid-type
architecture:
  style: modular-monolith
domains:
  - name: web
    path: src/web
ai:
  autonomy: constrained
`,
    )
    const result = readConfig(path)
    expect(result.ok).toBe(false)
  })

  it("should reject invalid frontend type", () => {
    const dir = createTempDir()
    const path = join(dir, "structura.yml")
    writeFileSync(
      path,
      `
project:
  name: my-app
  type: fullstack-platform
architecture:
  style: modular-monolith
domains:
  - name: web
    path: src/web
frontend:
  type: invalid-type
ai:
  autonomy: constrained
`,
    )
    const result = readConfig(path)
    expect(result.ok).toBe(false)
  })

  it("should reject invalid design philosophy", () => {
    const dir = createTempDir()
    const path = join(dir, "structura.yml")
    writeFileSync(
      path,
      `
project:
  name: my-app
  type: fullstack-platform
architecture:
  style: modular-monolith
domains:
  - name: web
    path: src/web
design:
  philosophy: invalid-philosophy
ai:
  autonomy: constrained
`,
    )
    const result = readConfig(path)
    expect(result.ok).toBe(false)
  })

  it("should reject invalid AI agent ID", () => {
    const dir = createTempDir()
    const path = join(dir, "structura.yml")
    writeFileSync(
      path,
      `
project:
  name: my-app
  type: fullstack-platform
architecture:
  style: modular-monolith
domains:
  - name: web
    path: src/web
ai:
  agents:
    - id: unknown-agent
      autonomy: constrained
`,
    )
    const result = readConfig(path)
    expect(result.ok).toBe(false)
  })
})
