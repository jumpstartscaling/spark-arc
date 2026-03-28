import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Build-time warning for missing PUBLIC_SITE_URL
if (!process.env.PUBLIC_SITE_URL) {
  console.warn('⚠️ WARNING: PUBLIC_SITE_URL environment variable is not set at build time');
  console.warn('   This may affect sitemap generation and canonical URLs');
  console.warn('   Set PUBLIC_SITE_URL in your build environment');
}

export default defineConfig({
  integrations: [tailwind()],
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: 'static', // Explicitly set to static mode
});
