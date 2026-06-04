import { Project } from "ts-morph"
import { existsSync } from "node:fs"
import { join, relative, sep } from "node:path"
import type { ParsedSource, Import, Export, Declaration, ImportGraph, ImportEdge, ParserOptions } from "./types.js"
import { findTsConfigs } from "./workspace.js"

function classifyImport(
  source: string,
  projectRoot: string,
  ir: ParserOptions["ir"],
): { isExternal: boolean; resolvedPath: string; targetDomainId?: string } {
  if (source.startsWith(".")) {
    return { isExternal: false, resolvedPath: source }
  }

  if (source.startsWith("@/")) {
    const resolvedPath = join(projectRoot, "src", source.slice(2))
    for (const domain of ir.domains) {
      if (resolvedPath.startsWith(join(projectRoot, domain.path))) {
        return { isExternal: false, resolvedPath, targetDomainId: domain.id }
      }
    }
    return { isExternal: false, resolvedPath }
  }

  return { isExternal: true, resolvedPath: source }
}

function buildDomainMap(ir: ParserOptions["ir"]): Map<string, string> {
  const map = new Map<string, string>()
  for (const domain of ir.domains) {
    map.set(domain.path, domain.id)
  }
  return map
}

function mergeGraphs(target: ImportGraph, source: ImportGraph): void {
  for (const edge of source.edges) {
    target.edges.push(edge)
  }

  for (const [key, imports] of source.nodeImports) {
    if (!target.nodeImports.has(key)) {
      target.nodeImports.set(key, imports)
    }
  }

  for (const [key, imports] of source.domainImports) {
    if (!target.domainImports.has(key)) {
      target.domainImports.set(key, imports)
    }
  }

  for (const [dep, files] of source.externalDependencies) {
    const existing = target.externalDependencies.get(dep) ?? new Set()
    for (const f of files) existing.add(f)
    target.externalDependencies.set(dep, existing)
  }
}

function parseWithTsConfig(
  tsConfigPath: string,
  projectRoot: string,
  ir: ParserOptions["ir"],
  domainMap: Map<string, string>,
): {
  sources: Map<string, ParsedSource>
  graph: ImportGraph
} {
  const sources = new Map<string, ParsedSource>()
  const edges: ImportEdge[] = []
  const nodeImports = new Map<string, Import[]>()
  const domainImports = new Map<string, Import[]>()
  const externalDependencies = new Map<string, Set<string>>()

  const project = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: false,
  })

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath()
    const lineCount = sourceFile.getEndLineNumber()
    const relPath = relative(projectRoot, filePath).split(sep).join("/")

    let domainId: string | undefined
    for (const [domainPath, id] of domainMap) {
      if (relPath.startsWith(domainPath.replace(/^\.\//, ""))) {
        domainId = id
        break
      }
    }

    const imports: Import[] = []
    for (const imp of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = imp.getModuleSpecifierValue()
      const { isExternal, resolvedPath, targetDomainId } = classifyImport(
        moduleSpecifier,
        projectRoot,
        ir,
      )

      const namedImports = imp.getNamedImports()
      if (namedImports.length > 0) {
        for (const named of namedImports) {
          const symbolName = named.getName()
          const line = imp.getStartLineNumber()
          const column = imp.getStartLinePos()

          imports.push({
            source: moduleSpecifier,
            resolvedPath,
            isExternal,
            symbolName,
            line,
            column,
            targetDomainId,
          })

          if (isExternal) {
            const existing = externalDependencies.get(moduleSpecifier) ?? new Set()
            existing.add(relPath)
            externalDependencies.set(moduleSpecifier, existing)
          }
        }
      } else {
        const line = imp.getStartLineNumber()
        const column = imp.getStartLinePos()
        imports.push({
          source: moduleSpecifier,
          resolvedPath,
          isExternal,
          symbolName: "*",
          line,
          column,
          targetDomainId,
        })

        if (isExternal) {
          const existing = externalDependencies.get(moduleSpecifier) ?? new Set()
          existing.add(relPath)
          externalDependencies.set(moduleSpecifier, existing)
        }
      }
    }

    const exports: Export[] = []
    for (const exp of sourceFile.getExportDeclarations()) {
      const specifier = exp.getModuleSpecifierValue()
      const symbolName = specifier ?? "*"
      exports.push({ symbolName, line: exp.getStartLineNumber() })
    }

    const declarations: Declaration[] = []
    for (const cls of sourceFile.getClasses()) {
      declarations.push({
        name: cls.getName() ?? "unknown",
        kind: "class",
        line: cls.getStartLineNumber(),
        isExported: cls.isExported(),
      })
    }
    for (const func of sourceFile.getFunctions()) {
      declarations.push({
        name: func.getName() ?? "unknown",
        kind: "function",
        line: func.getStartLineNumber(),
        isExported: func.isExported(),
      })
    }
    for (const iface of sourceFile.getInterfaces()) {
      declarations.push({
        name: iface.getName() ?? "unknown",
        kind: "interface",
        line: iface.getStartLineNumber(),
        isExported: iface.isExported(),
      })
    }
    for (const type of sourceFile.getTypeAliases()) {
      declarations.push({
        name: type.getName() ?? "unknown",
        kind: "type",
        line: type.getStartLineNumber(),
        isExported: type.isExported(),
      })
    }

    const parsed: ParsedSource = {
      filePath: relPath,
      lineCount,
      imports,
      exports,
      declarations,
      domainId,
    }

    sources.set(relPath, parsed)
    nodeImports.set(relPath, imports)

    for (const imp of imports) {
      if (imp.targetDomainId && domainId && imp.targetDomainId !== domainId) {
        const dep = ir.dependencies.find(
          (d) => d.sourceId === domainId && d.targetId === imp.targetDomainId,
        )

        edges.push({
          sourceFile: relPath,
          targetFile: imp.resolvedPath,
          sourceDomain: domainId,
          targetDomain: imp.targetDomainId,
          importSymbol: imp.symbolName,
          line: imp.line,
          isCrossDomain: true,
          isAllowed: dep?.allowed ?? false,
        })

        const domainKey = `${domainId}->${imp.targetDomainId}`
        const existing = domainImports.get(domainKey) ?? []
        existing.push(imp)
        domainImports.set(domainKey, existing)
      }
    }
  }

  return {
    sources,
    graph: { edges, nodeImports, domainImports, externalDependencies },
  }
}

export function parseProject(options: ParserOptions): {
  sources: Map<string, ParsedSource>
  graph: ImportGraph
} {
  const { projectRoot, ir } = options
  const emptyResult = () => ({
    sources: new Map<string, ParsedSource>(),
    graph: { edges: [], nodeImports: new Map(), domainImports: new Map(), externalDependencies: new Map() } as ImportGraph,
  })

  let tsConfigPaths: string[]

  if (options.tsConfigPaths && options.tsConfigPaths.length > 0) {
    tsConfigPaths = options.tsConfigPaths
  } else if (options.tsConfigPath) {
    tsConfigPaths = [options.tsConfigPath]
  } else {
    tsConfigPaths = findTsConfigs(projectRoot)
  }

  if (tsConfigPaths.length === 0) {
    return emptyResult()
  }

  const domainMap = buildDomainMap(ir)

  const allSources = new Map<string, ParsedSource>()
  const mergedGraph: ImportGraph = {
    edges: [],
    nodeImports: new Map(),
    domainImports: new Map(),
    externalDependencies: new Map(),
  }

  for (const tsConfigPath of tsConfigPaths) {
    if (!existsSync(tsConfigPath)) continue

    const { sources, graph } = parseWithTsConfig(tsConfigPath, projectRoot, ir, domainMap)

    for (const [key, source] of sources) {
      if (!allSources.has(key)) {
        allSources.set(key, source)
      }
    }

    mergeGraphs(mergedGraph, graph)
  }

  return {
    sources: allSources,
    graph: mergedGraph,
  }
}
