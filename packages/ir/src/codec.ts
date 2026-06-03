import type { ArchitectureIR } from "./types.js"

export function serializeIR(ir: ArchitectureIR): string {
  return JSON.stringify(ir, null, 2)
}

export function deserializeIR(json: string): ArchitectureIR {
  return JSON.parse(json) as ArchitectureIR
}
