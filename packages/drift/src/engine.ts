import type { ArchitectureIR, Dependency, Domain } from "@structura/ir"
import type { ImportEdge, ImportGraph } from "@structura/parser"
import type { DriftFinding, DriftReport } from "./types.js"

function dependencyKey(sourceId: string, targetId: string): string {
  return `${sourceId}->${targetId}`
}

function isDependencyAllowed(dep: Dependency): boolean {
  return dep.allowed
}

function buildAllowedDepMap(ir: ArchitectureIR): Map<string, Dependency> {
  const deps = new Map<string, Dependency>()
  for (const dep of ir.dependencies) {
    deps.set(dependencyKey(dep.sourceId, dep.targetId), dep)
  }
  return deps
}

function buildDomainMap(ir: ArchitectureIR): Map<string, Domain> {
  const map = new Map<string, Domain>()
  for (const domain of ir.domains) {
    map.set(domain.id, domain)
  }
  return map
}

function findMissingDependencies(
  ir: ArchitectureIR,
  importEdges: ImportEdge[],
): DriftFinding[] {
  const findings: DriftFinding[] = []
  const allowedDeps = ir.dependencies.filter(isDependencyAllowed)
  const observed = new Set<string>()

  for (const edge of importEdges) {
    if (edge.isCrossDomain) {
      observed.add(dependencyKey(edge.sourceDomain, edge.targetDomain))
    }
  }

  for (const dep of allowedDeps) {
    const key = dependencyKey(dep.sourceId, dep.targetId)
    if (!observed.has(key)) {
      findings.push({
        type: "missing",
        sourceDomainId: dep.sourceId,
        targetDomainId: dep.targetId,
        message: `Dependencia permitida "${dep.sourceId} -> ${dep.targetId}" nao encontrada em imports reais`,
        severity: "warning",
        suggestedFix: `Se a dependencia nao for mais necessaria, remova-a do structura.yml em dependencies`,
      })
    }
  }

  return findings
}

function findUnexpectedDependencies(
  ir: ArchitectureIR,
  importEdges: ImportEdge[],
): DriftFinding[] {
  const findings: DriftFinding[] = []
  const allowedDeps = buildAllowedDepMap(ir)

  for (const edge of importEdges) {
    if (!edge.isCrossDomain) continue

    const key = dependencyKey(edge.sourceDomain, edge.targetDomain)
    const dep = allowedDeps.get(key)

    if (!dep) {
      findings.push({
        type: "unexpected",
        sourceDomainId: edge.sourceDomain,
        targetDomainId: edge.targetDomain,
        sourceFile: edge.sourceFile,
        line: edge.line,
        importSymbol: edge.importSymbol,
        message: `Import inesperado: "${edge.sourceDomain}" importa de "${edge.targetDomain}" (${edge.sourceFile}:${edge.line})`,
        severity: "error",
        suggestedFix: `Adicione uma regra de dependencia em structura.yml ou remova o import`,
      })
    } else if (!dep.allowed) {
      findings.push({
        type: "disallowed",
        sourceDomainId: edge.sourceDomain,
        targetDomainId: edge.targetDomain,
        sourceFile: edge.sourceFile,
        line: edge.line,
        importSymbol: edge.importSymbol,
        message: `Import proibido: "${edge.sourceDomain}" importa de "${edge.targetDomain}"` +
          ` (${edge.sourceFile}:${edge.line})`,
        severity: "error",
        suggestedFix: dep.reason ?? `Remova o import de "${edge.sourceDomain}" para "${edge.targetDomain}"`,
      })
    }
  }

  return findings
}

function findDisallowedByCannotAccess(
  ir: ArchitectureIR,
  importEdges: ImportEdge[],
): DriftFinding[] {
  const findings: DriftFinding[] = []
  const domainMap = buildDomainMap(ir)

  for (const edge of importEdges) {
    if (!edge.isCrossDomain) continue
    if (edge.isAllowed) continue

    const sourceDomain = domainMap.get(edge.sourceDomain)
    if (!sourceDomain) continue

    if (sourceDomain.cannotAccess.includes(edge.targetDomain)) {
      findings.push({
        type: "disallowed",
        sourceDomainId: edge.sourceDomain,
        targetDomainId: edge.targetDomain,
        sourceFile: edge.sourceFile,
        line: edge.line,
        importSymbol: edge.importSymbol,
        message: `"${edge.sourceDomain}" nao pode acessar "${edge.targetDomain}" (listado em cannotAccess)` +
          ` (${edge.sourceFile}:${edge.line})`,
        severity: "error",
      })
    }
  }

  return findings
}

export function detectDrift(ir: ArchitectureIR, importGraph: ImportGraph): DriftReport {
  const edges = Array.from(importGraph.edges)

  const unexpected = findUnexpectedDependencies(ir, edges)
  const missing = findMissingDependencies(ir, edges)
  const disallowed1 = findDisallowedByCannotAccess(ir, edges)

  const disallowed = [
    ...unexpected.filter((f) => f.type === "disallowed"),
    ...disallowed1,
  ]
  const unexpectedOnly = unexpected.filter((f) => f.type !== "disallowed")

  const allFindings = [...unexpectedOnly, ...missing, ...disallowed]

  let errors = 0
  let warnings = 0
  for (const f of allFindings) {
    if (f.severity === "error") errors++
    else if (f.severity === "warning") warnings++
  }

  return {
    findings: allFindings,
    summary: {
      total: allFindings.length,
      unexpected: unexpectedOnly.length,
      missing: missing.length,
      disallowed: disallowed.length,
      errors,
      warnings,
    },
  }
}
