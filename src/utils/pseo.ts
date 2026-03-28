import locationsDataRaw from '../data/pseo/globals/locations.json';
import { getAllPseoSlugs, generatePseoPageBySlug, type LocationRecord } from './generatePseoPages';

export const STATE_NAME_MAP: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

const locations = locationsDataRaw as LocationRecord[];

function locFromSlug(slug: string): LocationRecord | null {
  // slug format: "insights/[loc-slug]/[niche]/[sub-niche]"
  const parts = slug.split('/');
  const locSlug = parts[1];
  if (!locSlug) return null;
  return locations.find((l) => l.slug === locSlug) ?? null;
}

function extractHeadline(blocksStr: string): string {
  if (!blocksStr) return 'Local service guide';
  try {
    const blocks = JSON.parse(blocksStr) as Array<{ block_type?: string; data?: { headline?: string } }>;
    const hero = blocks.find((b) => b.block_type === 'hero');
    if (hero?.data?.headline) return hero.data.headline;
  } catch { /* ignore */ }
  return 'Local service guide';
}

export interface PseoEntry {
  title: string;
  slug: string;
  category: string;    // e.g. "home-services"
  niche: string;       // e.g. "plumbing"
  subNiche: string;    // e.g. "emergency-repair"
  city: string;
  state: string;
  neighborhood: string;
  headline?: string;
  blocks?: string;
  schema?: string;
  excerpt?: string;
}

/**
 * Memory-efficient path collection for getStaticPaths
 */
export function getPseoPaths() {
  return getAllPseoSlugs();
}

/**
 * Lazy lookup for a single page's content
 */
export function getPseoEntry(slug: string): PseoEntry | null {
  const item = generatePseoPageBySlug(slug);
  if (!item) return null;

  const loc = locFromSlug(item.slug);
  const city = loc?.city ?? 'Unknown';
  const state = loc?.state ?? 'Unknown';
  const neighborhood = loc?.neighborhood ?? city;

  return {
    ...item,
    city,
    state,
    neighborhood,
    headline: extractHeadline(item.blocks),
  };
}
