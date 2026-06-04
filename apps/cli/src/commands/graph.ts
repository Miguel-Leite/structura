import { createCommand } from "commander"
import * as p from "@clack/prompts"
import pc from "picocolors"
import { writeFileSync } from "node:fs"
import { findConfigPath, readConfig } from "@structura/config"
import { generateIR } from "@structura/ir"
import { DependencyGraph, toDot, toJson } from "@structura/graph"

export const graphCommand = createCommand("graph")
  .description("Export dependency graph in DOT or JSON format")
  .option("-f, --format <format>", "Output format: dot or json", "dot")
  .option("-o, --output <file>", "Write to file instead of stdout")
  .option("--real", "Use real imports from AST (ImportGraph), not IR definitions")
  .action(async (options: { format?: string; output?: string; real?: boolean }) => {
    p.intro(pc.bold("structura graph"))

    const s = p.spinner()

    s.start("Finding configuration")
    const configPath = findConfigPath(process.cwd())
    if (!configPath) {
      s.stop("Config not found")
      p.outro(
        `${pc.red("✖")} No structura.yml found.\n` +
          `  Run ${pc.cyan("structura init")} to create one.`,
      )
      process.exit(1)
    }
    s.stop(`Found ${pc.cyan(configPath)}`)

    s.start("Reading and validating config")
    const configResult = readConfig(configPath)
    if (!configResult.ok) {
      s.stop("Config validation failed")
      p.outro(`${pc.red("✖")} ${configResult.error.message}`)
      process.exit(1)
    }
    s.stop("Config validated")

    const config = configResult.value

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
