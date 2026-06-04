import { createCommand } from "commander"
import * as p from "@clack/prompts"
import pc from "picocolors"
import { findConfigPath, readConfig } from "@structura/config"
import { generateIR } from "@structura/ir"
import { DependencyGraph } from "@structura/graph"
import { parseProject } from "@structura/parser"
import { Registry, Engine } from "@structura/rules-engine"
import { registerBuiltinRules } from "@structura/validators"

export const checkCommand = createCommand("check")
  .description("Validate architecture against declared rules")
  .option("-s, --strict", "Treat warnings as errors")
  .option("-v, --verbose", "Show detailed output")
  .action(async (options: { strict?: boolean; verbose?: boolean }) => {
    p.intro(pc.bold("structura check"))

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

    s.start("Building dependency graph")
    const graph = DependencyGraph.fromIR(ir)
    s.stop(`Graph built (${graph.getNodes().length} nodes)`)

    s.start("Parsing project source code")
    const parseResult = parseProject({
      projectRoot: process.cwd(),
      ir,
    })
    s.stop(`Parsed ${parseResult.sources.size} source files`)

    const sourcesSummary = new Map<string, import("@structura/rules-engine").ParsedSourceSummary>()
    for (const [path, source] of parseResult.sources) {
      sourcesSummary.set(path, {
        filePath: source.filePath,
        lineCount: source.lineCount,
        domainId: source.domainId,
        imports: source.imports.map((imp) => ({
          source: imp.source,
          targetDomainId: imp.targetDomainId,
          line: imp.line,
        })),
      })
    }

    s.start("Running rules engine")
    const registry = new Registry()
    registerBuiltinRules(registry)

    const engine = new Engine(registry)
    const results = engine.run({
      ir,
      graph,
      sources: sourcesSummary,
      projectRoot: process.cwd(),
    })
    const summary = engine.getSummary(results)
    s.stop("Rules executed")

    if (summary.failed === 0) {
      p.outro(`${pc.green("✔")} All rules passed!`)
      if (options.verbose) {
        for (const [, ruleResults] of results) {
          for (const result of ruleResults) {
            if (result.passed) {
              console.log(`  ${pc.green("✓")} ${result.ruleId}: ${result.message}`)
            }
          }
        }
      }
      return
    }

    console.log(`\n${pc.bold("Results:")}`)
    console.log(`  ${pc.green(`${summary.passed} passed`)}`)
    console.log(`  ${pc.red(`${summary.errors} errors`)}`)
    console.log(`  ${pc.yellow(`${summary.warnings} warnings`)}`)

    for (const [, ruleResults] of results) {
      for (const result of ruleResults) {
        if (!result.passed) {
          const color = result.severity === "error" ? pc.red : pc.yellow
          const icon = result.severity === "error" ? "✖" : "⚠"
          const location = result.file ? `${pc.dim(result.file)}` : ""
          const line = result.line ? `:${result.line}` : ""
          console.log(
            `\n  ${color(`${icon} [${result.severity.toUpperCase()}]`)} ${result.ruleId}` +
            `${location ? `\n     ${location}${line}` : ""}` +
            `\n     ${result.message}`,
          )
          if (result.suggestedFix && options.verbose) {
            console.log(`     ${pc.dim(`→ ${result.suggestedFix}`)}`)
          }
        }
      }
    }

    const exitCode = options.strict
      ? summary.errors + summary.warnings > 0 ? 1 : 0
      : summary.errors > 0 ? 1 : 0

    if (exitCode !== 0) {
      p.outro(`${pc.red("✖")} Architecture validation failed`)
      process.exit(exitCode)
    } else {
      p.outro(`${pc.green("✔")} Check completed with warnings only`)
    }
  })
