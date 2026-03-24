/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_N8N_WEBHOOK_URL?: string;
  readonly PUBLIC_N8N_WEBHOOK_TEST_URL?: string;
  readonly PUBLIC_SITE_URL?: string;
}
