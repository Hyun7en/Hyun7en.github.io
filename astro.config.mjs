// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import rehypeTableWrap from './src/plugins/rehype-table-wrap.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://hyun7en.github.io',
  integrations: [mdx()],
  markdown: {
    rehypePlugins: [rehypeTableWrap],
    shikiConfig: {
      theme: 'dracula',
    },
  },
});
