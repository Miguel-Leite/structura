import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

export interface CandidateDomain {
  name: string
  path: string
  detected: boolean
}

function hasSrcFolder(dir: string): boolean {
  const srcPath = join(dir, "src")
  return existsSync(srcPath) && statSync(srcPath).isDirectory()
}

function readPackageJson(dir: string): { name?: string; workspaces?: string[] } | null {
  const pkgPath = join(dir, "package.json")
  if (!existsSync(pkgPath)) return null
  try {
    return JSON.parse(readFileSync(pkgPath, "utf-8"))
  } catch {
    return null
  }
}

function resolveWorkspaceGlob(root: string, glob: string): string[] {
  const parts = glob.split("/")
  const dirs: string[] = []

  if (parts.length === 1 && parts[0] === "*") {
    for (const entry of readdirSync(root)) {
      const full = join(root, entry)
      if (statSync(full).isDirectory()) dirs.push(full)
    }
  } else if (parts.length === 2 && parts[1] === "*") {
    const parent = join(root, parts[0]!)
    if (existsSync(parent) && statSync(parent).isDirectory()) {
      for (const entry of readdirSync(parent)) {
        const full = join(parent, entry)
        if (statSync(full).isDirectory()) dirs.push(full)
      }
    }
  }

  return dirs
}

export interface ScanResult {
  domains: CandidateDomain[]
  isMonorepo: boolean
}

export function scanProject(projectRoot: string): ScanResult {
  const pkg = readPackageJson(projectRoot)
  const workspaces = pkg?.workspaces
  const isMonorepo = Array.isArray(workspaces) && workspaces.length > 0

  if (isMonorepo) {
    const domains: CandidateDomain[] = []
    const seen = new Set<string>()

    for (const glob of workspaces as string[]) {
      const dirs = resolveWorkspaceGlob(projectRoot, glob)
      for (const dir of dirs) {
        const baseName = relative(projectRoot, dir).replace(/\\/g, "/").split("/").pop() ?? ""
        const hasSrc = hasSrcFolder(dir)

        if (!hasSrc) continue

        const relPath = relative(projectRoot, dir).replace(/\\/g, "/")
        const srcPath = join(relPath, "src").replace(/\\/g, "/")

        if (!seen.has(baseName)) {
          seen.add(baseName)
          domains.push({ name: baseName, path: srcPath, detected: true })
        }
      }
    }

    if (domains.length > 0) {
      return { domains, isMonorepo: true }
    }
  }

  const srcDir = join(projectRoot, "src")
  if (existsSync(srcDir) && statSync(srcDir).isDirectory()) {
    const domains: CandidateDomain[] = []
    for (const entry of readdirSync(srcDir)) {
      const full = join(srcDir, entry)
      if (statSync(full).isDirectory()) {
        domains.push({
          name: entry,
          path: `src/${entry}`,
          detected: true,
        })
      }
    }
    if (domains.length > 0) {
      return { domains: domains, isMonorepo: false }
    }

    return { domains: [{ name: "app", path: "src/app", detected: false }], isMonorepo: false }
  }

  const topDirs = readdirSync(projectRoot)
    .filter((entry) => {
      if (entry.startsWith(".") || entry === "node_modules") return false
      const full = join(projectRoot, entry)
      return statSync(full).isDirectory()
    })
    .filter((entry) => {
      const full = join(projectRoot, entry)
      return hasSrcFolder(full) || readdirSync(full).some((f) => f.endsWith(".ts"))
    })

  if (topDirs.length > 0) {
    return {
      domains: topDirs.map((name) => ({
        name,
        path: name,
        detected: true,
      })),
      isMonorepo: false,
    }
  }

  return {
    domains: [{ name: "app", path: "src", detected: false }],
    isMonorepo: false,
  }
}
