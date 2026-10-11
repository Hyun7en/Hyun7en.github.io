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
  kind: 'study' | 'news';
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
  /** Published study posts on this tech, newest first. Roadmap and track progress count only these. */
  posts: PostSummary[];
  /** Published news posts on this tech, newest first. */
  news: PostSummary[];
  /** 1-based column in its domain's roadmap, counting only same-domain prerequisites. */
  stage: number;
}

export interface TrackStep {
  /** One tech, or several when the step is "pick one of these". */
  options: Tech[];
  /** Side topics worth learning alongside this step. */
  branches: Tech[];
}

export interface Track {
  id: string;
  name: string;
  description?: string;
  /** Techs the track takes as already known. */
  assumes: Tech[];
  steps: TrackStep[];
  /** Every tech on the track (spine and branches), deduplicated. */
  techs: Tech[];
}

export interface TechIndex {
  domains: Domain[];
  techs: Map<string, Tech>;
  /** Published posts of both kinds, newest first. */
  posts: PostSummary[];
  tracks: Track[];
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
        news: [],
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
      kind: entry.data.kind,
      domain: techs.get(entry.data.tech[0])?.domain,
    };
    posts.push(summary);
    for (const id of entry.data.tech) techs.get(id)?.[summary.kind === 'news' ? 'news' : 'posts'].push(summary);
  }
  if (errors.length) throw new Error(`[tech] invalid post frontmatter:\n  ${errors.join('\n  ')}`);

  const tracks: Track[] = [];
  for (const entry of (await getCollection('tracks')).sort((a, b) => a.data.order - b.data.order)) {
    const resolve = (id: string) => {
      const tech = techs.get(id);
      if (!tech) errors.push(`track "${entry.id}" references unknown tech "${id}"`);
      return tech;
    };
    const steps = entry.data.steps.map((step) => ({
      options: ('tech' in step ? [step.tech] : step.pick).map(resolve).filter((t) => t !== undefined),
      branches: step.with.map(resolve).filter((t) => t !== undefined),
    }));
    const assumes = entry.data.assumes.map(resolve).filter((t) => t !== undefined);
    checkTrackOrder(entry.id, steps, assumes, errors);
    tracks.push({
      id: entry.id,
      name: entry.data.name,
      description: entry.data.description,
      assumes,
      steps,
      techs: [...new Set(steps.flatMap((step) => [...step.options, ...step.branches]))],
    });
  }
  if (errors.length) throw new Error(`[tech] invalid track data:\n  ${errors.join('\n  ')}`);

  return { domains, techs, posts, tracks };
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

/**
 * Every direct prerequisite of a track tech must come earlier: in an earlier step
 * (spine or branch), in `assumes`, or, for a branch, in its own step's options or
 * an earlier branch of that step.
 */
function checkTrackOrder(trackId: string, steps: TrackStep[], assumes: Tech[], errors: string[]) {
  const known = new Set(assumes.map((t) => t.id));
  const check = (tech: Tech) => {
    for (const req of tech.requires) {
      if (!known.has(req)) errors.push(`track "${trackId}": "${tech.id}" requires "${req}", which is not earlier in the track`);
    }
  };
  for (const step of steps) {
    step.options.forEach(check);
    for (const tech of step.options) known.add(tech.id);
    for (const tech of step.branches) {
      check(tech);
      known.add(tech.id);
    }
  }
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
