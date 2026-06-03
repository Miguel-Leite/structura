#!/usr/bin/env node
import { Command } from "commander"
import { initCommand } from "./commands/init.js"

const program = new Command()

program
  .name("structura")
  .description("Architecture Operating System for AI-native engineering teams")
  .version("0.0.1")

program.addCommand(initCommand)

program.parse()
