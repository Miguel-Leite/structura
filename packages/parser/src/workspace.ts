import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

function resolveGlob(pattern: string, root: string): string[] {
  const parts = pattern.replace(/\\/g, "/").split("/")
  const starIndex = parts.indexOf("*")
  const doubleStarIndex = parts.indexOf("**")
  const wildcardIndex = starIndex >= 0 ? starIndex : doubleStarIndex

  if (wildcardIndex < 0) {
    const full = join(root, pattern)
    return existsSync(full) ? [full] : []
  }

  const base = join(root, ...parts.slice(0, wildcardIndex))
  if (!existsSync(base)) return []

  const results: string[] = []
  try {
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const remainder = parts.slice(wildcardIndex + 1).join("/")
      if (!remainder) {
        results.push(join(base, entry.name))
      } else {
        results.push(
          ...resolveGlob(join(entry.name, remainder), base),
        )
      }
    }
  } catch { /* empty */ }

  return results
}

export function findTsConfigs(projectRoot: string): string[] {
  const rootTsConfig = join(projectRoot, "tsconfig.json")
  if (existsSync(rootTsConfig)) {
    return [rootTsConfig]
  }

  const packageJsonPath = join(projectRoot, "package.json")
  if (!existsSync(packageJsonPath)) {
    return []
  }

  let pkg: { workspaces?: string[] }
  try {
    pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
  } catch {
    return []
  }

  const globs = pkg.workspaces
  if (!globs || globs.length === 0) {
    return []
  }

  const results: string[] = []

  for (const glob of globs) {
    const dirs = resolveGlob(glob, projectRoot)
    for (const dir of dirs) {
      const tsConfig = join(dir, "tsconfig.json")
      const tsConfigApp = join(dir, "tsconfig.app.json")
      if (existsSync(tsConfig)) {
        results.push(tsConfig)
      } else if (existsSync(tsConfigApp)) {
        results.push(tsConfigApp)
      }
    }
  }

  return results
}
