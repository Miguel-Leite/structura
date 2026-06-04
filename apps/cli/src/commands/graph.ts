import { createCommand } from "commander"
import * as p from "@clack/prompts"
import pc from "picocolors"
import { writeFileSync } from "node:fs"
import { generateIR } from "@structura/ir"
import { DependencyGraph, toDot, toJson } from "@structura/graph"
import { ensureConfig } from "../utils/config.js"

export const graphCommand = createCommand("graph")
  .description("Export dependency graph in DOT or JSON format")
  .option("-f, --format <format>", "Output format: dot or json", "dot")
  .option("-o, --output <file>", "Write to file instead of stdout")
  .option("--real", "Use real imports from AST (ImportGraph), not IR definitions")
  .option("--auto", "Auto-generate config if missing (non-interactive)")
  .action(async (options: { format?: string; output?: string; real?: boolean; auto?: boolean }) => {
    p.intro(pc.bold("structura graph"))
    const s = p.spinner()

    s.start("Finding configuration")
    const { config } = await ensureConfig({ auto: options.auto })
    s.stop("Config loaded")

    s.start("Generating Architecture IR")
    const ir = generateIR(config)
    s.stop("IR generated")

    const graph = DependencyGraph.fromIR(ir)
    s.stop(`Graph built (${graph.getNodes().length} nodes)`)

    const format = options.format === "json" ? "json" : "dot"
    const output = format === "dot" ? toDot(graph) : toJson(graph)

    if (options.output) {
      writeFileSync(options.output, output, "utf-8")
      s.stop(`Written to ${pc.cyan(options.output)}`)
    } else {
      s.stop("Graph generated")
      console.log(`\n${output}`)
    }

    p.outro(pc.green("✔") + " Done")
  })
