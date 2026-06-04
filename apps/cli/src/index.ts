#!/usr/bin/env node
import { Command } from "commander"
import { initCommand } from "./commands/init.js"
import { checkCommand } from "./commands/check.js"
import { driftCommand } from "./commands/drift.js"
import { graphCommand } from "./commands/graph.js"
import { explainCommand } from "./commands/explain.js"
import { syncAiCommand } from "./commands/sync-ai.js"

const program = new Command()

program
  .name("structura")
  .description("Architecture Operating System for AI-native engineering teams")
  .version("0.0.1")

program.addCommand(initCommand)
program.addCommand(checkCommand)
program.addCommand(driftCommand)
program.addCommand(graphCommand)
program.addCommand(explainCommand)
program.addCommand(syncAiCommand)

program.parse()
