import { DependencyGraph } from "./graph.js"

const COLORS: Record<string, string> = {
  domain: "#4A90D9",
  module: "#7B68EE",
  service: "#2ECC71",
  package: "#E67E22",
  "ai-agent": "#E74C3C",
}

const EDGE_STYLES: Record<string, string> = {
  allowed: "solid",
  forbidden: "dashed",
  import: "solid",
  dependency: "bold",
  communication: "dotted",
}

export function toDot(graph: DependencyGraph): string {
  const nodes = graph.getNodes()
  const edges = graph.getAllEdges()

  const lines: string[] = []
  lines.push("digraph structura {")
  lines.push("  rankdir=LR;")
  lines.push('  node [shape=box, style="rounded,filled", fontname="Inter"];')
  lines.push('  edge [fontname="Inter", fontsize=10];')

  for (const node of nodes) {
    const color = COLORS[node.type] ?? "#999999"
    const label = node.label.replace(/"/g, '\\"')
    lines.push(`  "${node.id}" [label="${label}", fillcolor="${color}", fontcolor="white"];`)
  }

  for (const edge of edges) {
    const style = EDGE_STYLES[edge.kind] ?? "solid"
    const color = edge.kind === "forbidden" ? "#E74C3C" : edge.kind === "allowed" ? "#27AE60" : "#555555"
    const label = edge.metadata?.label ? ` [label="${String(edge.metadata.label)}"]` : ""
    lines.push(`  "${edge.sourceId}" -> "${edge.targetId}" [style="${style}", color="${color}"${label}];`)
  }

  lines.push("}")
  return lines.join("\n")
}

export function toJson(graph: DependencyGraph): string {
  const nodes = graph.getNodes()
  const edges = graph.getAllEdges()

  const obj = {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
    })),
    edges: edges.map((e) => ({
      sourceId: e.sourceId,
      targetId: e.targetId,
      kind: e.kind,
      weight: e.weight,
    })),
  }

  return JSON.stringify(obj, null, 2)
}
