import { createCommand } from "commander"
import * as p from "@clack/prompts"
import pc from "picocolors"
import { generateIR } from "@structura/ir"
import { parseProject } from "@structura/parser"
import { detectDrift } from "@structura/drift"
import { ensureConfig } from "../utils/config.js"

export const driftCommand = createCommand("drift")
  .description("Detect architectural drift between defined architecture and real code")
  .option("-v, --verbose", "Show detailed output")
  .option("--auto", "Auto-generate config if missing (non-interactive)")
  .option("--tsconfig <paths...>", "One or more tsconfig.json paths for monorepos")
  .action(async (options: { verbose?: boolean; auto?: boolean; tsconfig?: string[] }) => {
    p.intro(pc.bold("structura drift"))
    const s = p.spinner()

    s.start("Finding configuration")
    const { config } = await ensureConfig({ auto: options.auto })
    s.stop("Config loaded")

    s.start("Generating Architecture IR")
    const ir = generateIR(config)
    s.stop("IR generated")

    s.start("Parsing project source code")
    const parseResult = parseProject({
      projectRoot: process.cwd(),
      ir,
      tsConfigPaths: options.tsconfig,
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
