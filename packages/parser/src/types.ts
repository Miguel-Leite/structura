import type { ArchitectureIR } from "@structura/ir"

export interface Import {
  source: string
  resolvedPath: string
  isExternal: boolean
  symbolName: string
  line: number
  column: number
  targetDomainId?: string
}

export interface Export {
  symbolName: string
  line: number
}

export interface Declaration {
  name: string
  kind: "class" | "interface" | "function" | "variable" | "type"
  line: number
  isExported: boolean
}

export interface ParsedSource {
  filePath: string
  lineCount: number
  imports: Import[]
  exports: Export[]
  declarations: Declaration[]
  domainId?: string
}

export interface ImportEdge {
  sourceFile: string
  targetFile: string
  sourceDomain: string
  targetDomain: string
  importSymbol: string
  line: number
  isCrossDomain: boolean
  isAllowed: boolean
}

export interface ImportGraph {
  edges: ImportEdge[]
  nodeImports: Map<string, Import[]>
  domainImports: Map<string, Import[]>
  externalDependencies: Map<string, Set<string>>
}

export interface ParserOptions {
  projectRoot: string
  ir: ArchitectureIR
  tsConfigPath?: string
}
