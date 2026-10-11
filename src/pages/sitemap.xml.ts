import type { APIContext } from 'astro';
import { getTechIndex } from '../lib/tech';

/**
 * Hand-rolled instead of @astrojs/sitemap so it can skip the tech pages
 * that carry `noindex` (techs with no posts yet).
 */
export async function GET(context: APIContext) {
  const index = await getTechIndex();
  const paths = [
    '/',
    '/tech/',
    '/posts/',
    '/news/',
    '/about/',
    ...index.posts.map((post) => `/posts/${post.id}/`),
    ...index.tracks.map((track) => `/tracks/${track.id}/`),
    ...[...index.techs.values()]
      .filter((tech) => tech.posts.length > 0 || tech.news.length > 0)
      .map((tech) => `/tech/${tech.id}/`),
  ];
  const urls = paths.map((path) => `  <url><loc>${new URL(path, context.site)}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
