import locationsDataRaw from '../data/pseo/globals/locations.json';
import { ALL_CAMPAIGNS, getAllPseoSlugs, generatePseoPageBySlug, type LocationRecord } from './generatePseoPages';

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

export interface PseoCatalogSubNiche {
  label: string;
  slug: string;
}

export interface PseoCatalogEntry {
  category: string;
  categoryLabel: string;
  niche: string;
  nicheLabel: string;
  icon?: string;
  subNiches: PseoCatalogSubNiche[];
  firstSubNiche: string;
  citiesCount: number;
  pageCount: number;
  samplePath: string;
}

export interface PseoCategoryEntry {
  category: string;
  label: string;
  niches: Array<{ slug: string; label: string; icon?: string }>;
}

export interface PseoSiblingLink {
  niche: string;
  label: string;
  href: string;
}

const locations = [...(locationsDataRaw as LocationRecord[])].sort((a, b) =>
  a.city !== b.city ? a.city.localeCompare(b.city) : a.state.localeCompare(b.state)
);

export const PSEO_LOCATIONS = locations;

const pseoCatalog = ALL_CAMPAIGNS.flatMap<PseoCatalogEntry>((campaign) => {
    const firstSubNiche = campaign.service_config.sub_niches[0]?.slug;
    if (!firstSubNiche) return [];

    return [{
      category: campaign.service_config.category_slug,
      categoryLabel: campaign.service_config.category,
      niche: campaign.service_config.niche_slug,
      nicheLabel: campaign.service_config.niche,
      icon: campaign.service_config.icon,
      subNiches: campaign.service_config.sub_niches.map((subNiche) => ({
        label: subNiche.label,
        slug: subNiche.slug,
      })),
      firstSubNiche,
      citiesCount: locations.length,
      pageCount: campaign.service_config.sub_niches.length * locations.length,
      samplePath: `${locations[0]?.slug ?? ''}/${campaign.service_config.niche_slug}/${firstSubNiche}`,
    }];
  })
  .sort((a, b) => a.category.localeCompare(b.category) || a.niche.localeCompare(b.niche));

const pseoCategoryCatalog = Array.from(
  pseoCatalog.reduce((map, entry) => {
    const existing = map.get(entry.category) ?? {
      category: entry.category,
      label: entry.categoryLabel,
      niches: [],
    };

    existing.niches.push({
      slug: entry.niche,
      label: entry.nicheLabel,
      icon: entry.icon,
    });

    map.set(entry.category, existing);
    return map;
  }, new Map<string, PseoCategoryEntry>()).values()
).map((entry) => ({
  ...entry,
  niches: [...entry.niches].sort((a, b) => a.label.localeCompare(b.label)),
}));

const pseoSubNicheMap: Record<string, string[]> = Object.fromEntries(
  pseoCatalog.map((entry) => [entry.niche, entry.subNiches.map((subNiche) => subNiche.slug)])
);

const totalPages = pseoCatalog.reduce((sum, entry) => sum + entry.pageCount, 0);
const totalStates = new Set(locations.map((location) => location.state)).size;
const totalSubNiches = pseoCatalog.reduce((sum, entry) => sum + entry.subNiches.length, 0);

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

export function getPseoNicheCatalog() {
  return pseoCatalog;
}

export function getPseoCategoryCatalog() {
  return pseoCategoryCatalog;
}

export function getPseoSubNicheMap() {
  return pseoSubNicheMap;
}

export function getPseoTotals() {
  return {
    totalPages,
    totalLocations: locations.length,
    totalStates,
    totalNiches: pseoCatalog.length,
    totalSubNiches,
  };
}

export function findFirstPseoSlugForLocationNiche(locSlug: string, niche: string) {
  const entry = pseoCatalog.find((item) => item.niche === niche);
  if (!locSlug || !entry) return null;

  return `insights/${locSlug}/${entry.niche}/${entry.firstSubNiche}`;
}

export function getSiblingNicheLinksForCity(city: string, currentNiche: string): PseoSiblingLink[] {
  const location = locations.find((item) => item.city === city);
  if (!location) return [];

  return pseoCatalog
    .filter((entry) => entry.niche !== currentNiche)
    .slice(0, 4)
    .map((entry) => ({
      niche: entry.niche,
      label: entry.nicheLabel,
      href: `/insights/${location.slug}/${entry.niche}/${entry.firstSubNiche}`,
    }));
}
