# AGENTS.md — Structura

## VISÃO DO PROJETO

Structura é um **Architecture Operating System para engenharia de software AI-native**.

O objetivo do Structura é transformar arquitetura de software em um sistema executável, validável e continuamente governado.

Em vez de arquitetura ser apenas documentação (README, Notion, decisões informais), no Structura ela se torna:

- executável
- analisável
- verificável
- enforceable (com regras)
- integrada com IA

---

## PROBLEMA QUE O STRUCTURA RESOLVE

Hoje, sistemas de software sofrem com:

- divergência arquitetural ao longo do tempo
- falta de enforcement de regras entre equipes
- código gerado por IA sem consistência estrutural
- ausência de uma "fonte única de verdade" arquitetural
- crescimento descontrolado de dependências entre módulos

Com IA (Cursor, Copilot, ChatGPT, OpenCode), esse problema piora porque o código é gerado mais rápido do que pode ser governado.

---

## O QUE O STRUCTURA É

Structura é:

- um **compilador de arquitetura**
- um **runtime de regras arquiteturais**
- um **sistema de grafos de dependência**
- um **motor de validação de código (AST-based)**
- um **sistema de governança para IA**
- um **detector de drift arquitetural**

---

## O QUE O STRUCTURA NÃO É

Structura NÃO é:

- gerador de boilerplate
- create-app CLI
- framework de scaffolding
- sistema de templates
- dashboard visual de arquitetura
- ferramenta low-code

O foco NÃO é gerar projetos.

O foco é:
> garantir que a arquitetura seja respeitada continuamente.

---

## ARQUITETURA DO SISTEMA

Structura segue uma arquitetura tipo **compiler + runtime + graph engine**.

### Pipeline principal:

1. Ler configuração (YAML)
2. Validar schema (Zod)
3. Gerar IR (Intermediate Representation)
4. Construir grafo de dependências
5. Analisar código via AST (TypeScript)
6. Aplicar regras arquiteturais
7. Detectar violações (drift)
8. Gerar outputs (relatórios + adapters IA)

---

## ARQUITETURA INTERNA (MÓDULOS)

O projeto será organizado como monorepo:

```
apps/
  cli/

packages/
  core/
  parser/
  ir/
  graph/
  rules-engine/
  validators/
  ast-engine/
  adapters/
  generators/
  config/
  shared/
```

### core
Orquestra todo o sistema (pipeline principal).

### parser
- lê YAML de configuração
- valida schema inicial

### ir
- define o Architecture IR (modelo interno central)

### graph
- constrói grafo de dependências
- representa relações entre módulos

### rules-engine
- executa regras arquiteturais
- valida consistência

### validators
- validações específicas (imports, limites, boundaries)

### ast-engine
- análise de código TypeScript
- extração de imports e dependências

### adapters
- integração com IA (Cursor, Copilot, OpenCode etc.)

### generators
- geração de outputs (relatórios, markdown, contextos)

---

## ARQUITETURA IR (NÚCLEO DO SISTEMA)

O IR é a representação interna da arquitetura.

Exemplo:

```ts
type ArchitectureIR = {
  domains: Domain[]
  modules: Module[]
  dependencies: Dependency[]
  rules: Rule[]
  aiPolicies: AIPolicy[]
}
```

Tudo no sistema depende do IR.

---

### GRAFO DE ARQUITETURA

O sistema modela o projeto como um grafo:

**Nodes:**
- domains
- modules
- services
- packages

**Edges:**
- imports
- dependências
- permissões
- comunicação entre módulos

Esse grafo é usado para:

- detectar violações
- analisar impacto
- validar regras
- detectar drift

---

### AST ENGINE

O sistema analisa código real usando AST do TypeScript.

**Ferramentas:**
- TypeScript Compiler API
- ts-morph

**Funções:**
- extrair imports
- mapear dependências reais
- comparar com arquitetura definida
- detectar desvios

---

### RULES ENGINE

Regras são modulares:

```ts
interface Rule {
  id: string
  validate(context: ValidationContext): RuleResult[]
}
```

**Exemplos de regras:**
- sem imports entre domínios proibidos
- sem dependências circulares
- limites de tamanho de arquivo
- regras de naming
- separação de responsabilidades

---

### DRIFT DETECTION

Drift = diferença entre:

- arquitetura definida (IR)
- código real (AST)

**Exemplo:**

Regra:
```
billing não pode acessar analytics
```

Violação:
```ts
import analytics from "@/analytics"
```

Resultado:
```
❌ Architecture Drift Detectado
```

---

## TECNOLOGIAS

- **TypeScript** (core language)
- **Turborepo** (monorepo)
- **Node.js** runtime
- **Zod** (validação de schema)
- **YAML** (configuração)
- **ts-morph** (AST analysis)
- **TypeScript Compiler API**
- **Commander.js** (CLI)
- **Clack** (UX CLI interativo)

### Futuro

- Next.js (dashboard opcional)
- NestJS (API opcional)
- PostgreSQL (persistência futura)

---

## CLI (INTERFACE DO SISTEMA)

Comandos iniciais:

```
structura init
structura check
structura drift
structura graph
structura explain <module>
structura sync-ai
```

---

## REGRAS DE IMPLEMENTAÇÃO

### DEVE:
- manter arquitetura modular
- usar graph + IR como núcleo
- priorizar enforcement sobre geração
- evitar abstrações desnecessárias
- manter sistema orientado a compilador
- manter TypeScript como base principal

### NÃO DEVE:
- criar boilerplate generator
- criar visual builder
- criar marketplace de templates
- criar sistema low-code
- adicionar cloud prematurely
- adicionar complexidade desnecessária

---

## PRINCÍPIO CENTRAL

Structura NÃO é um gerador de projetos.

Structura é um:

> Sistema operacional de arquitetura de software.

---

## MISSÃO FINAL

Transformar arquitetura de software em um sistema vivo, executável e governado, capaz de coordenar humanos e agentes de IA com consistência estrutural ao longo do tempo.
