import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getTechIndex } from '../lib/tech';
import { site } from '../site.config';

export async function GET(context: APIContext) {
  const index = await getTechIndex();
  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: index.posts.map((post) => ({
      title: post.title,
      pubDate: post.date,
      description: post.description,
      link: `/posts/${post.id}/`,
      categories: post.tech.map((id) => index.techs.get(id)!.name),
    })),
  });
}
