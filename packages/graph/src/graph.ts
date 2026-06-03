import type { ArchitectureIR } from "@structura/ir"
import type { GraphNode, GraphEdge, EdgeDiff, CycleResult } from "./types.js"
import { randomUUID } from "node:crypto"

export class DependencyGraph {
  private nodes: Map<string, GraphNode> = new Map()
  private edges: Map<string, GraphEdge[]> = new Map()
  private reverseEdges: Map<string, GraphEdge[]> = new Map()

  addNode(node: GraphNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node "${node.id}" already exists in graph`)
    }
    this.nodes.set(node.id, node)
  }

  addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.sourceId)) {
      throw new Error(`Source node "${edge.sourceId}" not found`)
    }
    if (!this.nodes.has(edge.targetId)) {
      throw new Error(`Target node "${edge.targetId}" not found`)
    }

    const edges = this.edges.get(edge.sourceId) ?? []
    edges.push(edge)
    this.edges.set(edge.sourceId, edges)

    const revEdges = this.reverseEdges.get(edge.targetId) ?? []
    revEdges.push(edge)
    this.reverseEdges.set(edge.targetId, revEdges)
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id)
  }

  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values())
  }

  getEdges(sourceId: string): GraphEdge[] {
    return this.edges.get(sourceId) ?? []
  }

  getAllEdges(): GraphEdge[] {
    const all: GraphEdge[] = []
    for (const edges of this.edges.values()) {
      all.push(...edges)
    }
    return all
  }

  detectCycles(): CycleResult[] {
    const visited = new Set<string>()
    const inStack = new Set<string>()
    const cycles: CycleResult[] = []

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId)
      inStack.add(nodeId)
      path.push(nodeId)

      const outgoing = this.edges.get(nodeId) ?? []
      for (const edge of outgoing) {
        if (!visited.has(edge.targetId)) {
          dfs(edge.targetId, path)
        } else if (inStack.has(edge.targetId)) {
          const cycleStart = path.indexOf(edge.targetId)
          const cycle = path.slice(cycleStart)
          cycle.push(edge.targetId)
          cycles.push({ nodes: cycle })
        }
      }

      path.pop()
      inStack.delete(nodeId)
    }

    for (const [id] of this.nodes) {
      if (!visited.has(id)) {
        dfs(id, [])
      }
    }

    return cycles
  }

  transitiveClosure(nodeId: string): Set<string> {
    const reachable = new Set<string>()
    const stack = [nodeId]

    while (stack.length > 0) {
      const current = stack.pop()
      if (!current) continue

      const outgoing = this.edges.get(current) ?? []
      for (const edge of outgoing) {
        if (!reachable.has(edge.targetId)) {
          reachable.add(edge.targetId)
          stack.push(edge.targetId)
        }
      }
    }

    reachable.delete(nodeId)
    return reachable
  }

  subgraph(domainIds: Set<string>): DependencyGraph {
    const sub = new DependencyGraph()
    const domainSet = new Set(domainIds)

    for (const [id, node] of this.nodes) {
      if (domainSet.has(id)) {
        sub.addNode({ ...node })
      }
    }

    for (const [sourceId, edges] of this.edges) {
      if (!domainSet.has(sourceId)) continue
      for (const edge of edges) {
        if (domainSet.has(edge.targetId)) {
          sub.addEdge({ ...edge })
        }
      }
    }

    return sub
  }

  diff(other: DependencyGraph): EdgeDiff[] {
    const diffs: EdgeDiff[] = []
    const otherEdges = new Map<string, GraphEdge>()

    for (const edge of other.getAllEdges()) {
      otherEdges.set(`${edge.sourceId}->${edge.targetId}`, edge)
    }

    for (const edge of this.getAllEdges()) {
      const key = `${edge.sourceId}->${edge.targetId}`
      if (!otherEdges.has(key)) {
        diffs.push({
          type: "missing",
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          expected: edge,
        })
      } else {
        const otherEdge = otherEdges.get(key)
        if (otherEdge && edge.kind !== otherEdge.kind) {
          diffs.push({
            type: "changed",
            sourceId: edge.sourceId,
            targetId: edge.targetId,
            expected: edge,
            actual: otherEdge,
          })
        }
        otherEdges.delete(key)
      }
    }

    for (const [, edge] of otherEdges) {
      diffs.push({
        type: "extra",
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        actual: edge,
      })
    }

    return diffs
  }

  shortestPath(sourceId: string, targetId: string): string[] | null {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return null
    }

    const visited = new Set<string>()
    const queue: string[][] = [[sourceId]]

    while (queue.length > 0) {
      const path = queue.shift()
      if (!path) continue

      const current = path[path.length - 1] as string
      if (current === targetId) return path

      if (!visited.has(current)) {
        visited.add(current)
        const outgoing = this.edges.get(current) ?? []
        for (const edge of outgoing) {
          if (!visited.has(edge.targetId)) {
            queue.push([...path, edge.targetId])
          }
        }
      }
    }

    return null
  }

  static fromIR(ir: ArchitectureIR): DependencyGraph {
    const graph = new DependencyGraph()

    for (const domain of ir.domains) {
      graph.addNode({
        id: domain.id,
        type: "domain",
        label: domain.name,
      })
    }

    for (const dep of ir.dependencies) {
      graph.addEdge({
        id: randomUUID(),
        sourceId: dep.sourceId,
        targetId: dep.targetId,
        kind: dep.allowed ? "allowed" : "forbidden",
        weight: 1,
      })
    }

    return graph
  }
}
