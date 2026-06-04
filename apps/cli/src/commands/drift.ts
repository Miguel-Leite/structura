import { createCommand } from "commander"
import * as p from "@clack/prompts"
import pc from "picocolors"
import { findConfigPath, readConfig } from "@structura/config"
import { generateIR } from "@structura/ir"
import { parseProject } from "@structura/parser"
import { detectDrift } from "@structura/drift"

export const driftCommand = createCommand("drift")
  .description("Detect architectural drift between defined architecture and real code")
  .option("-v, --verbose", "Show detailed output")
  .action(async (options: { verbose?: boolean }) => {
    p.intro(pc.bold("structura drift"))

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

    s.start("Parsing project source code")
    const parseResult = parseProject({
      projectRoot: process.cwd(),
      ir,
    })
    s.stop(`Parsed ${parseResult.sources.size} source files`)

    s.start("Detecting architectural drift")
    const report = detectDrift(ir, parseResult.graph)
    const summary = report.summary
    s.stop(`Drift analysis complete (${summary.total} findings)`)

    if (summary.total === 0) {
      p.outro(`${pc.green("✔")} No architectural drift detected!`)
      return
    }

    console.log(`\n${pc.bold("Drift Report:")}`)
    console.log(`  ${pc.red(`${summary.errors} errors`)}`)
    console.log(`  ${pc.yellow(`${summary.warnings} warnings`)}`)
    console.log(`  ${pc.dim(`${summary.unexpected} unexpected`)}`)
    console.log(`  ${pc.dim(`${summary.missing} missing`)}`)
    console.log(`  ${pc.dim(`${summary.disallowed} disallowed`)}`)

    if (options.verbose || summary.errors > 0) {
      for (const finding of report.findings) {
        const color = finding.severity === "error" ? pc.red : pc.yellow
        const icon = finding.severity === "error" ? "✖" : "⚠"
        const typeLabel = {
          unexpected: "inesperado",
          missing: "faltante",
          disallowed: "proibido",
        }[finding.type]

        console.log(
          `\n  ${color(`${icon} [${typeLabel}]`)} ${finding.sourceDomainId} -> ${finding.targetDomainId}` +
          (finding.sourceFile ? `\n     ${pc.dim(finding.sourceFile)}` : "") +
          (finding.line ? `:${finding.line}` : "") +
          `\n     ${finding.message}`,
        )
        if (finding.suggestedFix && options.verbose) {
          console.log(`     ${pc.dim(`→ ${finding.suggestedFix}`)}`)
        }
      }
    }

    if (summary.errors > 0) {
      p.outro(`${pc.red("✖")} Architectural drift detected`)
      process.exit(1)
    } else {
      p.outro(`${pc.yellow("⚠")} Drift warnings found (no errors)`)
    }
  })
