import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    /** Tech ids from src/content/tech/*.yaml — validated in src/lib/tech.ts. */
    tech: z.array(z.string()).default([]),
    /** `study`: a learning post that counts toward the roadmap. `news`: a hands-on look at a recent release. */
    kind: z.enum(['study', 'news']).default('study'),
    draft: z.boolean().default(false),
  }),
});

const techSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  /** Learning prerequisites: tech ids you should know before this one. */
  requires: z.array(z.string()).default([]),
  /** Undirected "see also" links; made symmetric in src/lib/tech.ts. */
  related: z.array(z.string()).default([]),
  til: z
    .array(
      z.object({
        repository: z.string(),
        path: z.string(),
      })
    )
    .default([]),
});

/** One file per domain; the file name is the domain id, `techs` keys are tech ids. */
const domains = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/tech' }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    description: z.string().optional(),
    techs: z.record(z.string(), techSchema),
  }),
});

const stepBranches = z.array(z.string()).default([]);

/** A curated learning track: a spine of steps, each one tech or a pick-one choice, plus side branches. */
const tracks = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/tracks' }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    description: z.string().optional(),
    steps: z
      .array(
        z.union([
          z.object({ tech: z.string(), with: stepBranches }),
          z.object({ pick: z.array(z.string()).min(2), with: stepBranches }),
        ])
      )
      .min(2),
  }),
});

export const collections = { posts, domains, tracks };
