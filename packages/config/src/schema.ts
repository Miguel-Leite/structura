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
    })
    .optional(),
  architecture: z.object({
    style: z.enum(["monolith", "modular-monolith", "microservices"]),
  }),
  frontend: z
    .object({
      framework: z.string(),
      state: z.string().optional(),
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
      autonomy: z.enum(["constrained", "guided", "supervised"]),
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
