import type { Rule, RuleCategory } from "./types.js"

export class Registry {
  private rules: Map<string, Rule> = new Map()

  register(rule: Rule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule "${rule.id}" is already registered`)
    }
    this.rules.set(rule.id, rule)
  }

  get(id: string): Rule | undefined {
    return this.rules.get(id)
  }

  getAll(): Rule[] {
    return Array.from(this.rules.values())
  }

  getByCategory(category: RuleCategory): Rule[] {
    return this.getAll().filter((r) => r.category === category)
  }

  remove(id: string): void {
    this.rules.delete(id)
  }

  clear(): void {
    this.rules.clear()
  }

  get size(): number {
    return this.rules.size
  }
}
