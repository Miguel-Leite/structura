import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { createError, err, ok } from "@structura/core"
import type { Result } from "@structura/core"
import { load } from "js-yaml"
import { StructuraConfigSchema } from "./schema.js"
import type { StructuraConfig } from "./types.js"

export function findConfigPath(root: string): string | null {
  const candidates = ["structura.yml", "structura.yaml"]
  for (const candidate of candidates) {
    const fullPath = join(root, candidate)
    if (existsSync(fullPath)) {
      return fullPath
    }
  }
  return null
}

export function readConfig(path: string): Result<StructuraConfig> {
  try {
    const content = readFileSync(path, "utf-8")
    const parsed = load(content)

    if (!parsed || typeof parsed !== "object") {
      return err(createError("CONFIG_PARSE_ERROR", "Config file must contain a YAML object"))
    }

    const result = StructuraConfigSchema.safeParse(parsed)
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")
      return err(createError("SCHEMA_VALIDATION_ERROR", `Config validation failed:\n${issues}`))
    }

    return ok(result.data as unknown as StructuraConfig)
  } catch (e) {
    return err(
      createError(
        "CONFIG_PARSE_ERROR",
        `Failed to parse config: ${e instanceof Error ? e.message : String(e)}`,
      ),
    )
  }
}
