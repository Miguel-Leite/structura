export type {
  ArchitectureIR,
  Domain,
  Dependency,
  IRRuleConfig,
  AIPolicy,
  IRMeta,
  UIDesignIR,
  MultiAgentPolicy,
} from "./types.js"
export { generateIR } from "./generator.js"
export { serializeIR, deserializeIR } from "./codec.js"
