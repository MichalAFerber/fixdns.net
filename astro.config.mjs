import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://fixdns.net',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
