import { describe, it, expect } from "vitest"
import { DependencyGraph } from "./index.js"
import type { ArchitectureIR } from "@structura/ir"

describe("DependencyGraph", () => {
  it("should add nodes and edges", () => {
    const graph = new DependencyGraph()
    graph.addNode({ id: "a", type: "domain", label: "A" })
    graph.addNode({ id: "b", type: "domain", label: "B" })
    graph.addEdge({
      id: "1",
      sourceId: "a",
      targetId: "b",
      kind: "dependency",
      weight: 1,
    })

    expect(graph.getNodes()).toHaveLength(2)
    expect(graph.getEdges("a")).toHaveLength(1)
  })

  it("should throw on duplicate node", () => {
    const graph = new DependencyGraph()
    graph.addNode({ id: "x", type: "domain", label: "X" })
    expect(() => graph.addNode({ id: "x", type: "domain", label: "X" })).toThrow()
  })

  it("should detect no cycles in DAG", () => {
    const graph = new DependencyGraph()
    graph.addNode({ id: "a", type: "domain", label: "A" })
    graph.addNode({ id: "b", type: "domain", label: "B" })
    graph.addNode({ id: "c", type: "domain", label: "C" })
    graph.addEdge({ id: "1", sourceId: "a", targetId: "b", kind: "dependency", weight: 1 })
    graph.addEdge({ id: "2", sourceId: "b", targetId: "c", kind: "dependency", weight: 1 })

    expect(graph.detectCycles()).toHaveLength(0)
  })

  it("should detect cycles", () => {
    const graph = new DependencyGraph()
    graph.addNode({ id: "a", type: "domain", label: "A" })
    graph.addNode({ id: "b", type: "domain", label: "B" })
    graph.addNode({ id: "c", type: "domain", label: "C" })
    graph.addEdge({ id: "1", sourceId: "a", targetId: "b", kind: "dependency", weight: 1 })
    graph.addEdge({ id: "2", sourceId: "b", targetId: "c", kind: "dependency", weight: 1 })
    graph.addEdge({ id: "3", sourceId: "c", targetId: "a", kind: "dependency", weight: 1 })

    const cycles = graph.detectCycles()
    expect(cycles.length).toBeGreaterThan(0)
    if (cycles[0]) {
      expect(cycles[0].nodes.length).toBeGreaterThanOrEqual(3)
    }
  })

  it("should compute transitive closure", () => {
    const graph = new DependencyGraph()
    graph.addNode({ id: "a", type: "domain", label: "A" })
    graph.addNode({ id: "b", type: "domain", label: "B" })
    graph.addNode({ id: "c", type: "domain", label: "C" })
    graph.addEdge({ id: "1", sourceId: "a", targetId: "b", kind: "dependency", weight: 1 })
    graph.addEdge({ id: "2", sourceId: "b", targetId: "c", kind: "dependency", weight: 1 })

    const closure = graph.transitiveClosure("a")
    expect(closure.has("b")).toBe(true)
    expect(closure.has("c")).toBe(true)
  })

  it("should extract subgraph", () => {
    const graph = new DependencyGraph()
    graph.addNode({ id: "a", type: "domain", label: "A" })
    graph.addNode({ id: "b", type: "domain", label: "B" })
    graph.addNode({ id: "c", type: "domain", label: "C" })
    graph.addEdge({ id: "1", sourceId: "a", targetId: "b", kind: "dependency", weight: 1 })
    graph.addEdge({ id: "2", sourceId: "a", targetId: "c", kind: "dependency", weight: 1 })

    const sub = graph.subgraph(new Set(["a", "b"]))
    expect(sub.getNodes()).toHaveLength(2)
    expect(sub.getEdges("a")).toHaveLength(1)
  })

  it("should find shortest path", () => {
    const graph = new DependencyGraph()
    graph.addNode({ id: "a", type: "domain", label: "A" })
    graph.addNode({ id: "b", type: "domain", label: "B" })
    graph.addNode({ id: "c", type: "domain", label: "C" })
    graph.addEdge({ id: "1", sourceId: "a", targetId: "b", kind: "dependency", weight: 1 })
    graph.addEdge({ id: "2", sourceId: "b", targetId: "c", kind: "dependency", weight: 1 })

    const path = graph.shortestPath("a", "c")
    expect(path).toEqual(["a", "b", "c"])
  })

  it("should return null for unreachable path", () => {
    const graph = new DependencyGraph()
    graph.addNode({ id: "a", type: "domain", label: "A" })
    graph.addNode({ id: "b", type: "domain", label: "B" })

    expect(graph.shortestPath("a", "b")).toBeNull()
  })

  it("should compute diff between two graphs", () => {
    const graph1 = new DependencyGraph()
    graph1.addNode({ id: "a", type: "domain", label: "A" })
    graph1.addNode({ id: "b", type: "domain", label: "B" })
    graph1.addEdge({ id: "1", sourceId: "a", targetId: "b", kind: "allowed", weight: 1 })

    const graph2 = new DependencyGraph()
    graph2.addNode({ id: "a", type: "domain", label: "A" })
    graph2.addNode({ id: "b", type: "domain", label: "B" })
    graph2.addNode({ id: "c", type: "domain", label: "C" })
    graph2.addEdge({ id: "2", sourceId: "a", targetId: "c", kind: "forbidden", weight: 1 })

    const diffs = graph1.diff(graph2)
    expect(diffs.length).toBeGreaterThan(0)
    const extraEdge = diffs.find((d) => d.type === "extra")
    expect(extraEdge).toBeDefined()
    expect(extraEdge?.sourceId).toBe("a")
  })

  it("should build graph from IR", () => {
    const ir: ArchitectureIR = {
      meta: { version: "1.0", projectName: "test", projectStyle: "modular-monolith", createdAt: "" },
      domains: [
        { id: "billing", name: "billing", path: "src/billing", canAccess: [], cannotAccess: [] },
        { id: "payments", name: "payments", path: "src/payments", canAccess: [], cannotAccess: [] },
      ],
      dependencies: [
        { sourceId: "billing", targetId: "payments", kind: "domain", allowed: true },
      ],
      rules: [],
      aiPolicies: [],
    }

    const graph = DependencyGraph.fromIR(ir)
    expect(graph.getNodes()).toHaveLength(2)
    expect(graph.getEdges("billing")).toHaveLength(1)
  })
})
