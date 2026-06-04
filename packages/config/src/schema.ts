import { z } from "zod"

const DomainConfigSchema = z.object({
  name: z.string().min(1, "Domain name is required"),
  path: z.string().min(1, "Domain path is required"),
  can_access: z.array(z.string()).optional(),
  cannot_access: z.array(z.string()).optional(),
  naming: z
    .object({
      files: z.string().optional(),
      exports: z.string().optional(),
    })
    .optional(),
})

export const StructuraConfigSchema = z.object({
  project: z
    .object({
      name: z.string().min(1),
      type: z
        .enum([
          "frontend-application",
          "backend-api",
          "fullstack-platform",
          "ai-product",
          "saas",
          "ui-infrastructure",
          "infrastructure-tool",
        ])
        .optional(),
    })
    .optional(),
  architecture: z.object({
    style: z.enum(["monolith", "modular-monolith", "microservices"]),
  }),
  design: z
    .object({
      philosophy: z
        .enum([
          "minimal",
          "editorial",
          "premium",
          "brutalist",
          "experimental",
          "futuristic",
          "enterprise",
          "custom",
        ])
        .optional(),
      constraints: z
        .object({
          avoid_generic_ai_layouts: z.boolean().optional(),
          avoid_default_dashboard_patterns: z.boolean().optional(),
          avoid_repetitive_card_grids: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  ui: z
    .object({
      styling: z
        .enum([
          "tailwindcss",
          "css-modules",
          "pandacss",
          "unocss",
          "styled-components",
          "vanilla-extract",
        ])
        .optional(),
      layout: z
        .object({
          prefer_asymmetry: z.boolean().optional(),
          enforce_visual_hierarchy: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  components: z
    .object({
      architecture: z
        .enum([
          "headless",
          "compound-components",
          "atomic-design",
          "feature-based",
          "semantic-components",
          "design-system",
        ])
        .optional(),
      organization: z
        .enum([
          "by-feature",
          "by-domain",
          "by-semantic-responsibility",
          "by-ui-layer",
          "by-design-tokens",
        ])
        .optional(),
      rules: z
        .object({
          separate_logic_and_ui: z.boolean().optional(),
          enforce_accessibility: z.boolean().optional(),
          prevent_massive_components: z.boolean().optional(),
          enforce_variant_consistency: z.boolean().optional(),
          max_lines: z.number().positive().optional(),
        })
        .optional(),
    })
    .optional(),
  design_system: z
    .object({
      enabled: z.boolean().optional(),
      tokens: z.boolean().optional(),
      variants: z.boolean().optional(),
      motion: z.boolean().optional(),
      theme: z.boolean().optional(),
      accessibility: z.boolean().optional(),
      slots: z.boolean().optional(),
      responsive: z.boolean().optional(),
    })
    .optional(),
  frontend: z
    .object({
      framework: z.string(),
      state: z.string().optional(),
      type: z.enum(["application", "ui-infrastructure"]).optional(),
    })
    .optional(),
  backend: z
    .object({
      framework: z.string(),
      orm: z.string().optional(),
    })
    .optional(),
  domains: z.array(DomainConfigSchema).min(1, "At least one domain is required"),
  rules: z
    .object({
      max_file_lines: z.number().positive().optional(),
      forbid_cross_domain_imports: z.boolean().optional(),
    })
    .optional(),
  ai: z
    .object({
      autonomy: z.enum([
        "strict",
        "constrained",
        "guided",
        "supervised",
        "hybrid",
        "autonomous",
      ]),
      agents: z
        .array(
          z.object({
            id: z.enum(["opencode", "cursor", "claude", "copilot", "continue"]),
            autonomy: z.enum(["strict", "constrained", "guided", "supervised", "hybrid", "autonomous"]),
          }),
        )
        .optional(),
      rules: z
        .object({
          enforce_architecture: z.boolean().optional(),
          preserve_design_identity: z.boolean().optional(),
          prevent_boundary_violations: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  features: z
    .object({
      drift_detection: z.boolean().optional(),
      ai_governance: z.boolean().optional(),
    })
    .optional(),
})

export type ValidatedConfig = z.infer<typeof StructuraConfigSchema>
