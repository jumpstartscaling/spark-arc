import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: process.env.PUBLIC_SITE_URL || undefined,
  vite: {
    preview: {
      allowedHosts: ['ion-arc.biz']
    }
  }
});
