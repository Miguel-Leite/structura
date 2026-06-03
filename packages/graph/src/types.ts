export type GraphNodeType = "domain" | "module" | "service" | "package" | "ai-agent"

export type GraphEdgeKind =
  | "import"
  | "dependency"
  | "communication"
  | "ownership"
  | "allowed"
  | "forbidden"

export interface GraphNode {
  id: string
  type: GraphNodeType
  label: string
  metadata?: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  sourceId: string
  targetId: string
  kind: GraphEdgeKind
  weight: number
  metadata?: Record<string, unknown>
}

export interface EdgeDiff {
  type: "missing" | "extra" | "changed"
  sourceId: string
  targetId: string
  expected?: GraphEdge
  actual?: GraphEdge
}

export interface CycleResult {
  nodes: string[]
}
