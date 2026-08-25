import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const nodeTypeEnum = z.enum(['architecture', 'technology', 'concept']);

const articleEntry = z.object({
  context: z.string().optional(),
  path: reference('posts'),
});

const tilEntry = z.object({
  context: z.string().optional(),
  repository: z.string(),
  path: z.string(),
});

const nodes = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/nodes' }),
  schema: z.object({
    name: z.string(),
    type: nodeTypeEnum,
    description: z.string().optional(),
    parent: z.array(reference('nodes')).default([]),
    related: z.array(reference('nodes')).default([]),
    x: z.number().optional(),
    y: z.number().optional(),
    articles: z.array(articleEntry).default([]),
    til: z.array(tilEntry).default([]),
  }),
});

export const collections = { posts, nodes };
