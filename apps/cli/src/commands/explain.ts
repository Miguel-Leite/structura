import { createCommand } from "commander"
import * as p from "@clack/prompts"
import pc from "picocolors"
import { generateIR } from "@structura/ir"
import { DependencyGraph } from "@structura/graph"
import { ensureConfig } from "../utils/config.js"

export const explainCommand = createCommand("explain")
  .argument("<domain>", "Domain ID to explain")
  .option("--impact", "Show transitive closure (impact analysis)")
  .option("--json", "Output as JSON")
  .option("--auto", "Auto-generate config if missing (non-interactive)")
  .description("Show detailed information about a domain")
  .action(async (domainId: string, options: { impact?: boolean; json?: boolean; auto?: boolean }) => {
    p.intro(pc.bold(`structura explain ${domainId}`))
    const s = p.spinner()

    s.start("Finding configuration")
    const { config } = await ensureConfig({ auto: options.auto })
    s.stop("Config loaded")

    const ir = generateIR(config)
    const graph = DependencyGraph.fromIR(ir)

    const domain = ir.domains.find((d) => d.id === domainId || d.name === domainId)
    if (!domain) {
      p.outro(
        `${pc.red("✖")} Domain "${domainId}" not found.\n` +
          `  Available domains: ${ir.domains.map((d) => pc.cyan(d.id)).join(", ")}`,
      )
      process.exit(1)
    }

    if (options.json) {
      const outgoing = graph.getEdges(domain.id)
      const incoming = graph.getAllEdges().filter((e) => e.targetId === domain.id)
      const impact = options.impact
        ? Array.from(graph.transitiveClosure(domain.id))
        : undefined

      console.log(
        JSON.stringify(
          {
            domain,
            dependencies: {
              outgoing: outgoing.map((e) => ({ targetId: e.targetId, kind: e.kind })),
              incoming: incoming.map((e) => ({ sourceId: e.sourceId, kind: e.kind })),
            },
            aiPolicy: ir.aiPolicies.find((p) => p.domainId === domain.id) ?? null,
            impact,
          },
          null,
          2,
        ),
      )
      p.outro(pc.green("✔") + " Done")
      return
    }

    s.stop("Domain found")

    const aiPolicy = ir.aiPolicies.find((p) => p.domainId === domain.id)
    const outgoing = graph.getEdges(domain.id)
    const incoming = graph.getAllEdges().filter((e) => e.targetId === domain.id)

    console.log(`\n${pc.bold("Domain:")} ${pc.cyan(domain.id)}`)
    console.log(`  ${pc.dim("Name:")}     ${domain.name}`)
    console.log(`  ${pc.dim("Path:")}     ${domain.path}`)

    if (domain.canAccess.length > 0) {
      console.log(`  ${pc.dim("Can access:")} ${domain.canAccess.map((id) => pc.green(id)).join(", ")}`)
    }
    if (domain.cannotAccess.length > 0) {
      console.log(`  ${pc.dim("Cannot access:")} ${domain.cannotAccess.map((id) => pc.red(id)).join(", ")}`)
    }
    if (domain.naming) {
      console.log(`  ${pc.dim("Naming:")}    files=${domain.naming.files ?? "-"}, exports=${domain.naming.exports ?? "-"}`)
    }

    if (aiPolicy) {
      const autonomyColor = aiPolicy.autonomy === "constrained" ? pc.red
        : aiPolicy.autonomy === "guided" ? pc.yellow
        : pc.green
      console.log(`\n${pc.bold("AI Policy:")}`)
      console.log(`  ${pc.dim("Autonomy:")}  ${autonomyColor(aiPolicy.autonomy)}`)
    }

    console.log(`\n${pc.bold("Dependencies:")}`)

    console.log(`  ${pc.dim("Outgoing:")}`)
    if (outgoing.length === 0) {
      console.log(`    ${pc.dim("(none)")}`)
    } else {
      for (const edge of outgoing) {
        const kindIcon = edge.kind === "forbidden" ? pc.red("✖") : pc.green("→")
        console.log(`    ${kindIcon} ${edge.targetId} ${pc.dim(`(${edge.kind})`)}`)
      }
    }

    console.log(`  ${pc.dim("Incoming:")}`)
    if (incoming.length === 0) {
      console.log(`    ${pc.dim("(none)")}`)
    } else {
      for (const edge of incoming) {
        const kindIcon = edge.kind === "forbidden" ? pc.red("✖") : pc.green("←")
        console.log(`    ${kindIcon} ${edge.sourceId} ${pc.dim(`(${edge.kind})`)}`)
      }
    }

    if (options.impact) {
      const closure = graph.transitiveClosure(domain.id)
      console.log(`\n${pc.bold("Impact Analysis:")}`)
      if (closure.size === 0) {
        console.log(`  ${pc.dim("No transitive dependencies")}`)
      } else {
        console.log(`  ${pc.dim("Transitively reachable:")}`)
        for (const nodeId of closure) {
          const node = graph.getNode(nodeId)
          const label = node ? node.label : nodeId
          console.log(`    ${pc.yellow("→")} ${label}`)
        }
      }
    }

    p.outro(pc.green("✔") + " Done")
  })
