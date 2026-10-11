import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    /** Tech ids from src/content/tech/*.yaml — validated in src/lib/tech.ts. */
    tech: z.array(z.string()).default([]),
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

export const collections = { posts, domains };
