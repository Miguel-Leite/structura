import * as p from "@clack/prompts"
import pc from "picocolors"
import { findConfigPath, readConfig } from "@structura/config"
import type { StructuraConfig } from "@structura/config"
import { generateIR } from "@structura/ir"
import { runInitFlow } from "../commands/init.js"
import { writeAiFiles } from "../commands/sync-ai.js"

export async function ensureConfig(options?: { auto?: boolean }): Promise<{
  config: StructuraConfig
  configPath: string
}> {
  const root = process.cwd()
  const existingPath = findConfigPath(root)

  if (existingPath) {
    const result = readConfig(existingPath)
    if (!result.ok) {
      p.outro(`${pc.red("✖")} ${result.error.message}`)
      process.exit(1)
    }
    return { config: result.value, configPath: existingPath }
  }

  if (options?.auto) {
    p.outro(`${pc.red("✖")} No structura.yml found and --auto set. Run \`structura init\` first.`)
    process.exit(1)
  }

  console.log(`\n${pc.yellow("ℹ")} No structura.yml found. Let's set up Structura.\n`)

  const initResult = await runInitFlow({ silent: true })
  if (!initResult) {
    process.exit(1)
  }

  const secondPath = findConfigPath(root)
  if (!secondPath) {
    p.outro(`${pc.red("✖")} Failed to create structura.yml`)
    process.exit(1)
  }

  const result = readConfig(secondPath)
  if (!result.ok) {
    p.outro(`${pc.red("✖")} ${result.error.message}`)
    process.exit(1)
  }

  const config = result.value
  const aiGovernance = config.features?.ai_governance ?? false

  if (aiGovernance) {
    const s = p.spinner()
    s.start("Generating AI context files")
    const ir = generateIR(config)
    const written = writeAiFiles(ir, root)
    s.stop(`Generated ${written.length} AI file(s)`)

    if (written.length > 0) {
      console.log("")
      for (const f of written) {
        console.log(`  ${pc.green("✓")} ${f.label}`)
      }
      console.log("")
    }
  }

  return { config, configPath: secondPath }
}
