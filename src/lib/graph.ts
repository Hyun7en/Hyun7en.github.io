import { getCollection } from 'astro:content';

export type NodeType = 'architecture' | 'technology' | 'concept';

export interface GraphArticle {
  context?: string;
  path: string;
}

export interface GraphTil {
  context?: string;
  repository: string;
  path: string;
  exists: boolean | 'unknown';
}

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  description?: string;
  parent: string[];
  related: string[];
  children: string[];
  x?: number;
  y?: number;
  articles: GraphArticle[];
  til: GraphTil[];
}

export interface Graph {
  generatedAt: string;
  nodes: GraphNode[];
}

/**
 * Derives the full node graph (including reverse `children` edges) from
 * `nodes` collection frontmatter — the only source of truth, per
 * docs/architecture-blog-plan.md section 10. Also runs a best-effort,
 * non-blocking existence check against the TIL GitHub repo.
 */
export async function getGraph(): Promise<Graph> {
  const nodeEntries = await getCollection('nodes');
  const postEntries = await getCollection('posts');
  const postIds = new Set(postEntries.map((p) => p.id));

  const nodeMap = new Map<string, GraphNode>();
  for (const entry of nodeEntries) {
    nodeMap.set(entry.id, {
      id: entry.id,
      name: entry.data.name,
      type: entry.data.type,
      description: entry.data.description,
      parent: entry.data.parent.map((ref) => ref.id),
      related: entry.data.related.map((ref) => ref.id),
      children: [],
      x: entry.data.x,
      y: entry.data.y,
      articles: entry.data.articles.map((a) => ({ context: a.context, path: a.path.id })),
      til: entry.data.til.map((t) => ({ ...t, exists: 'unknown' as const })),
    });
  }

  for (const node of nodeMap.values()) {
    for (const parentId of node.parent) {
      nodeMap.get(parentId)?.children.push(node.id);
    }
  }

  for (const node of nodeMap.values()) {
    for (const article of node.articles) {
      if (!postIds.has(article.path)) {
        console.warn(`[graph] node "${node.id}" references missing post "${article.path}"`);
      }
    }
  }

  await Promise.allSettled(
    Array.from(nodeMap.values()).flatMap((node) =>
      node.til.map(async (til) => {
        try {
          const res = await fetch(
            `https://api.github.com/repos/Hyun7en/${til.repository}/contents/${til.path}`
          );
          til.exists = res.ok;
        } catch {
          til.exists = 'unknown';
        }
      })
    )
  );

  return {
    generatedAt: new Date().toISOString(),
    nodes: Array.from(nodeMap.values()),
  };
}
