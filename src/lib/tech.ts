import { getCollection } from 'astro:content';

export interface Domain {
  id: string;
  name: string;
  order: number;
  color: string;
  description?: string;
  techIds: string[];
}

export interface PostSummary {
  id: string;
  title: string;
  date: Date;
  description?: string;
  tech: string[];
  /** Domain of the post's first tech, used as its display category. */
  domain?: string;
}

export interface Tech {
  id: string;
  name: string;
  description?: string;
  domain: string;
  requires: string[];
  /** Reverse of `requires`: techs that build on this one. */
  next: string[];
  related: string[];
  til: { repository: string; path: string }[];
  /** Published posts on this tech, newest first. */
  posts: PostSummary[];
  /** 1-based column in its domain's roadmap, counting only same-domain prerequisites. */
  stage: number;
}

export interface TechIndex {
  domains: Domain[];
  techs: Map<string, Tech>;
  /** Published posts, newest first. */
  posts: PostSummary[];
}

let cached: Promise<TechIndex> | undefined;

/**
 * Builds the tech flow from src/content/tech/*.yaml and post frontmatter.
 * Cached for the production build (every page calls this); rebuilt on each
 * call in dev so content edits show up without a restart.
 */
export function getTechIndex(): Promise<TechIndex> {
  if (import.meta.env.DEV) return buildIndex();
  return (cached ??= buildIndex());
}

async function buildIndex(): Promise<TechIndex> {
  const domainEntries = (await getCollection('domains')).sort((a, b) => a.data.order - b.data.order);
  const errors: string[] = [];

  const domains: Domain[] = [];
  const techs = new Map<string, Tech>();
  for (const entry of domainEntries) {
    const techIds = Object.keys(entry.data.techs);
    domains.push({
      id: entry.id,
      name: entry.data.name,
      order: entry.data.order,
      color: entry.data.color,
      description: entry.data.description,
      techIds,
    });
    for (const [id, data] of Object.entries(entry.data.techs)) {
      if (techs.has(id)) {
        errors.push(`tech "${id}" is defined in both "${techs.get(id)!.domain}" and "${entry.id}"`);
        continue;
      }
      techs.set(id, {
        id,
        name: data.name,
        description: data.description,
        domain: entry.id,
        requires: data.requires,
        next: [],
        related: [...data.related],
        til: data.til,
        posts: [],
        stage: 1,
      });
    }
  }

  for (const tech of techs.values()) {
    for (const id of [...tech.requires, ...tech.related]) {
      if (!techs.has(id)) errors.push(`tech "${tech.id}" references unknown tech "${id}"`);
    }
  }
  if (errors.length) throw new Error(`[tech] invalid tech data:\n  ${errors.join('\n  ')}`);

  for (const tech of techs.values()) {
    for (const id of tech.requires) techs.get(id)!.next.push(tech.id);
    for (const id of tech.related) {
      const other = techs.get(id)!;
      if (!other.related.includes(tech.id)) other.related.push(tech.id);
    }
  }

  assertAcyclic(techs);
  for (const tech of techs.values()) tech.stage = domainStage(tech, techs);

  const postEntries = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  const posts: PostSummary[] = [];
  for (const entry of postEntries) {
    for (const id of entry.data.tech) {
      if (!techs.has(id)) errors.push(`post "${entry.id}" references unknown tech "${id}"`);
    }
    const summary: PostSummary = {
      id: entry.id,
      title: entry.data.title,
      date: entry.data.date,
      description: entry.data.description,
      tech: entry.data.tech,
      domain: techs.get(entry.data.tech[0])?.domain,
    };
    posts.push(summary);
    for (const id of entry.data.tech) techs.get(id)?.posts.push(summary);
  }
  if (errors.length) throw new Error(`[tech] invalid post frontmatter:\n  ${errors.join('\n  ')}`);

  return { domains, techs, posts };
}

function assertAcyclic(techs: Map<string, Tech>) {
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  const visit = (id: string) => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'visiting') {
      const cycle = [...stack.slice(stack.indexOf(id)), id].join(' → ');
      throw new Error(`[tech] circular "requires": ${cycle}`);
    }
    state.set(id, 'visiting');
    stack.push(id);
    for (const req of techs.get(id)!.requires) visit(req);
    stack.pop();
    state.set(id, 'done');
  };
  for (const id of techs.keys()) visit(id);
}

function domainStage(tech: Tech, techs: Map<string, Tech>): number {
  const sameDomain = tech.requires.map((id) => techs.get(id)!).filter((t) => t.domain === tech.domain);
  return 1 + Math.max(0, ...sameDomain.map((t) => domainStage(t, techs)));
}

/** Every prerequisite of `id` (transitively), in a valid learning order, ending with `id`. */
export function learningPath(index: TechIndex, id: string): Tech[] {
  const seen = new Set<string>();
  const order: Tech[] = [];
  const visit = (techId: string) => {
    if (seen.has(techId)) return;
    seen.add(techId);
    const tech = index.techs.get(techId)!;
    for (const req of tech.requires) visit(req);
    order.push(tech);
  };
  visit(id);
  return order;
}

export interface FlowPath {
  steps: Tech[];
  /** A follow-up tech to suggest after the last step, if any. */
  upcoming?: Tech;
  postCount: number;
}

/**
 * Picks up to `limit` single-line chains through the `requires` graph that
 * cover the most techs with posts, so the home page can show "read along this
 * flow" without anyone curating it by hand.
 */
export function recommendedPaths(index: TechIndex, limit = 2): FlowPath[] {
  const best = new Map<string, { chain: Tech[]; covered: number }>();
  const bestChain = (tech: Tech): { chain: Tech[]; covered: number } => {
    const hit = best.get(tech.id);
    if (hit) return hit;
    let prefix = { chain: [] as Tech[], covered: 0 };
    for (const id of tech.requires) {
      const candidate = bestChain(index.techs.get(id)!);
      if (
        candidate.covered > prefix.covered ||
        (candidate.covered === prefix.covered && candidate.chain.length > prefix.chain.length)
      ) {
        prefix = candidate;
      }
    }
    const result = {
      chain: [...prefix.chain, tech],
      covered: prefix.covered + (tech.posts.length > 0 ? 1 : 0),
    };
    best.set(tech.id, result);
    return result;
  };

  const postIdsOf = (chain: Tech[]) => new Set(chain.flatMap((t) => t.posts.map((p) => p.id)));
  const candidates = [...index.techs.values()]
    .filter((t) => t.posts.length > 0)
    .map((t) => ({ ...bestChain(t), postIds: postIdsOf(bestChain(t).chain) }))
    .filter((c) => c.chain.length > 1)
    .sort(
      (a, b) =>
        b.covered - a.covered || b.postIds.size - a.postIds.size || b.chain.length - a.chain.length
    );

  const picked: FlowPath[] = [];
  const shown = new Set<string>();
  for (const { chain, postIds } of candidates) {
    if (picked.length >= limit) break;
    // A path whose posts are all in an earlier path only repeats it.
    if ([...postIds].every((id) => shown.has(id))) continue;
    postIds.forEach((id) => shown.add(id));
    const last = chain[chain.length - 1];
    const upcoming = last.next
      .map((id) => index.techs.get(id)!)
      .sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name))[0];
    picked.push({ steps: chain, upcoming, postCount: postIds.size });
  }
  return picked;
}

export interface TreeNode {
  tech: Tech;
  /** Already shown earlier in this tree; rendered once more but not expanded again. */
  repeated: boolean;
  children: TreeNode[];
}

/**
 * Prerequisites of `id` as a tree (children = `requires`), or what builds on it
 * (children = `next`). Techs with several parents would appear more than once;
 * only the first occurrence is expanded.
 */
export function techTree(
  index: TechIndex,
  id: string,
  direction: 'requires' | 'next',
  maxDepth = Infinity
): TreeNode {
  const seen = new Set<string>();
  const build = (techId: string, depth: number): TreeNode => {
    const tech = index.techs.get(techId)!;
    const repeated = seen.has(techId);
    seen.add(techId);
    const children =
      repeated || depth >= maxDepth ? [] : tech[direction].map((childId) => build(childId, depth + 1));
    return { tech, repeated, children };
  };
  return build(id, 0);
}
