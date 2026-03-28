export const siteConfig = {
  siteName: 'Ion Arc Online',
  /** Used in JSON-LD and meta; override per deploy */
  businessNameSuffix: 'Home Services',
  baseUrl: import.meta.env.PUBLIC_SITE_URL || 'https://ion-arc.online',
} as const;
