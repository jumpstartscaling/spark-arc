/**
 * generatePseoPages.ts
 *
 * Universal campaign-driven pSEO generator.
 * Reads from src/data/pseo/globals/ and src/data/pseo/campaigns/**\/*.json
 * Produces one GeneratedPage per (location × sub-niche).
 *
 * DATA INHERITANCE ORDER (highest wins):
 *   Sub-niche template → Niche campaign → Global shared → Fallback defaults
 */

import locationsRaw from '../data/pseo/globals/locations.json';
import globalSpintaxRaw from '../data/pseo/globals/shared_spintax.json';
import globalHeadlinesRaw from '../data/pseo/globals/headline_templates.json';

// Campaign imports — add a new line here when you add a new niche JSON
import roofingCampaign from '../data/pseo/campaigns/home-services/roofing.json';
import plumbingCampaign from '../data/pseo/campaigns/home-services/plumbing.json';
import hvacCampaign from '../data/pseo/campaigns/home-services/hvac.json';
import electricalCampaign from '../data/pseo/campaigns/home-services/electrical.json';
import pestControlCampaign from '../data/pseo/campaigns/home-services/pest-control.json';
import landscapingCampaign from '../data/pseo/campaigns/home-services/landscaping.json';
import cleaningCampaign from '../data/pseo/campaigns/home-services/cleaning.json';
import restorationCampaign from '../data/pseo/campaigns/home-services/restoration.json';
import flooringCampaign from '../data/pseo/campaigns/home-services/flooring.json';
import kitchenBathCampaign from '../data/pseo/campaigns/home-services/kitchen-bath.json';

import paintingCampaign from '../data/pseo/campaigns/specialty-trades/painting.json';
import windowsDoorsCampaign from '../data/pseo/campaigns/specialty-trades/windows-doors.json';
import sidingCampaign from '../data/pseo/campaigns/specialty-trades/siding.json';
import guttersCampaign from '../data/pseo/campaigns/specialty-trades/gutters.json';
import fencingCampaign from '../data/pseo/campaigns/specialty-trades/fencing.json';
import solarCampaign from '../data/pseo/campaigns/specialty-trades/solar.json';
import poolServiceCampaign from '../data/pseo/campaigns/specialty-trades/pool-service.json';

import legalPiCampaign from '../data/pseo/campaigns/pro-services/legal-pi.json';
import businessLawCampaign from '../data/pseo/campaigns/pro-services/business-law.json';
import realEstateCampaign from '../data/pseo/campaigns/pro-services/real-estate.json';
import accountingCampaign from '../data/pseo/campaigns/pro-services/accounting.json';
import marketingCampaign from '../data/pseo/campaigns/pro-services/marketing.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationRecord {
  city: string;
  state: string;
  slug: string;
  neighborhood?: string;
  county?: string;
  zip?: string;
  motto?: string;
  landmarks?: string[];
  parks?: string[];
}

export interface GeneratedPage {
  title: string;
  slug: string;        // e.g. "insights/austin-tx/plumbing/emergency-repair"
  niche: string;       // e.g. "plumbing"
  category: string;    // e.g. "home-services"
  subNiche: string;    // e.g. "emergency-repair"
  schema: string;
  blocks: string;
  excerpt: string;
}

// ─── Internal types matching the campaign JSON schema ─────────────────────────

interface SynonymGroup { category: string; terms: string; }

interface RegionalNuance {
  focus: string;
  top_brand: string;
  tech: string;
  logic: string;
}

interface ShowTell {
  weather_anchor?: { headline: string; body: string };
  material_comparison?: { title: string; table_rows: Array<{ category: string; cheap: string; premium: string }> };
  landmark_proximity?: { trust_badge: string; text: string };
  interactive_cost_logic?: { markup: string; base_sqft_price?: number | null };
  process_guide?: { headline: string; steps: Array<{ title: string; text: string }> };
  seasonal_maintenance?: { headline: string; fall_tips: string; summer_tips: string };
  comparison_guide?: { title: string; comparison: { option_a: string; option_b: string; details: string } };
  market_analytics?: { headline: string; stats: Array<{ label: string; value: string; hint: string }>; analysis: string };
  compliance_checklist?: { title: string; warning: string; items: Array<{ title: string; text: string }> };
}

interface SubNicheTemplate {
  headline_templates?: string[];
  faqs?: Array<{ q: string; a: string }>;
  lead_magnet?: { headline: string; subhead: string; bullets: string[]; cta: string };
  survey?: { title: string; subhead: string; steps: Array<{ id: string; label: string; options?: string[]; placeholder?: string }> };
  encyclopedia?: any;
  // Sub-niche can override/add these blocks
  process_guide?: { headline: string; steps: Array<{ title: string; text: string }> };
  seasonal_maintenance?: { headline: string; fall_tips: string; summer_tips: string };
  comparison_guide?: { title: string; comparison: { option_a: string; option_b: string; details: string } };
  market_analytics?: { headline: string; stats: Array<{ label: string; value: string; hint: string }>; analysis: string };
  compliance_checklist?: { title: string; warning: string; items: Array<{ title: string; text: string }> };
}

interface Trust {
  hiring_local?: { headline: string; body: string };
  neighborhood_pride?: { headline: string; body: string };
  permitting_logic?: { headline: string; body: string };
}

interface Campaign {
  service_config: {
    niche: string;
    niche_slug: string;
    category: string;
    category_slug: string;
    icon?: string;
    sub_niches: Array<{ label: string; slug: string }>;
  };
  branding?: {
    business_name_suffix: string; // e.g. "Roofing" or "Painting Specialists"
  };
  spintax?: { synonyms: SynonymGroup[] };
  show_tell?: ShowTell;
  trust?: Trust;
  encyclopedia?: {
    brands?: Record<string, { tier: string; flagship: string; value_prop: string; price_point: string }>;
    pricing_benchmarks?: Array<{ item: string; price: string; note: string }>;
    aoe_hints?: string[];
  };
  sub_niche_templates?: Record<string, SubNicheTemplate>;
  regional_nuance?: Record<string, RegionalNuance>;
  conversion?: { closing_trust?: string };
}

// ─── All registered campaigns ─────────────────────────────────────────────────

export const ALL_CAMPAIGNS: Campaign[] = [
  roofingCampaign as unknown as Campaign,
  plumbingCampaign as unknown as Campaign,
  hvacCampaign as unknown as Campaign,
  electricalCampaign as unknown as Campaign,
  pestControlCampaign as unknown as Campaign,
  landscapingCampaign as unknown as Campaign,
  cleaningCampaign as unknown as Campaign,
  restorationCampaign as unknown as Campaign,
  flooringCampaign as unknown as Campaign,
  kitchenBathCampaign as unknown as Campaign,
  paintingCampaign as unknown as Campaign,
  windowsDoorsCampaign as unknown as Campaign,
  sidingCampaign as unknown as Campaign,
  guttersCampaign as unknown as Campaign,
  fencingCampaign as unknown as Campaign,
  solarCampaign as unknown as Campaign,
  poolServiceCampaign as unknown as Campaign,
  legalPiCampaign as unknown as Campaign,
  businessLawCampaign as unknown as Campaign,
  realEstateCampaign as unknown as Campaign,
  accountingCampaign as unknown as Campaign,
  marketingCampaign as unknown as Campaign,
];

// ─── Globals ──────────────────────────────────────────────────────────────────

const locations = locationsRaw as LocationRecord[];
const globalSynonyms = (globalSpintaxRaw as { synonyms: SynonymGroup[] }).synonyms;
const globalHeadlines = (globalHeadlinesRaw as { templates: string[] }).templates;

// ─── Seeded random utility ────────────────────────────────────────────────────

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
}

function pickSeeded<T>(arr: T[], seed: string): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)]!;
}

// ─── Spintax resolver ─────────────────────────────────────────────────────────

function resolveSpintax(
  text: string,
  seed: string,
  ctx: Record<string, string>,
  synonyms: SynonymGroup[]
): string {
  if (!text) return '';
  let res = text;
  let rngOffset = 0;
  const getRng = () => seededRandom(seed + rngOffset++);

  const fillCtx = (val: string) => {
    let t = val;
    for (let pass = 0; pass < 2; pass++) {
      Object.keys(ctx).forEach((key) => {
        t = t.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), ctx[key]!);
      });
    }
    return t;
  };

  res = fillCtx(res);

  // Merge global + niche synonyms (niche wins on same category key)
  synonyms.forEach((group) => {
    const token = `%${group.category}%`;
    if (res.includes(token)) {
      const terms = JSON.parse(group.terms) as string[];
      res = res.replace(new RegExp(`%${group.category}%`, 'g'), () =>
        fillCtx(terms[Math.floor(getRng() * terms.length)]!)
      );
    }
  });

  // Inline {A|B|C} spintax
  for (;;) {
    const match = res.match(/\{([^{}]+)\}/);
    if (!match) break;
    const choices = match[1]!.split('|');
    res = res.replace(match[0], choices[Math.floor(getRng() * choices.length)]!);
  }

  return res;
}

// ─── Core Logic (Refactored for Lazy Loading) ────────────────────────────────

export function getAllPseoSlugs(): string[] {
  const slugs: string[] = [];
  for (const campaign of ALL_CAMPAIGNS) {
    for (const loc of locations) {
      if (!loc.slug) continue;
      for (const subNiche of campaign.service_config.sub_niches) {
        slugs.push(`insights/${loc.slug}/${campaign.service_config.niche_slug}/${subNiche.slug}`);
      }
    }
  }
  return slugs;
}

export function generatePseoPageBySlug(targetSlug: string): GeneratedPage | null {
  // Extract parts from slug: insights/[loc-slug]/[niche-slug]/[sub-niche-slug]
  const parts = targetSlug.split('/');
  if (parts.length < 4) return null;
  const targetLocSlug = parts[1];
  const targetNicheSlug = parts[2];
  const targetSubNicheSlug = parts[3];

  const campaign = ALL_CAMPAIGNS.find((c) => c.service_config.niche_slug === targetNicheSlug);
  if (!campaign) return null;

  const loc = locations.find((l) => l.slug === targetLocSlug);
  if (!loc) return null;

  const subNiche = campaign.service_config.sub_niches.find((sn) => sn.slug === targetSubNicheSlug);
  if (!subNiche) return null;

  return generateSinglePage(campaign, loc, subNiche);
}

function generateSinglePage(campaign: Campaign, loc: LocationRecord, subNiche: { label: string; slug: string }): GeneratedPage {
  const { service_config, spintax, show_tell, trust, encyclopedia, sub_niche_templates, regional_nuance } = campaign;

  // Merge synonyms
  const nicheSynonyms: SynonymGroup[] = spintax?.synonyms ?? [];
  const nicheCategoryKeys = new Set(nicheSynonyms.map((s) => s.category));
  const mergedSynonyms: SynonymGroup[] = [
    ...globalSynonyms.filter((s) => !nicheCategoryKeys.has(s.category)),
    ...nicheSynonyms,
  ];

  // Pick regional nuance
  const nuance: RegionalNuance | undefined =
    regional_nuance?.[loc.state] ??
    regional_nuance?.['FL'] ??
    (regional_nuance ? Object.values(regional_nuance)[0] : undefined);

  const urlSlug = `insights/${loc.slug}/${service_config.niche_slug}/${subNiche.slug}`;
  const pageSeed = urlSlug;

  const ctx = (): Record<string, string> => ({
    city: loc.city,
    state: loc.state,
    neighborhood: loc.neighborhood ?? loc.city,
    county: loc.county ?? `${loc.city} area`,
    landmark: (loc.landmarks && loc.landmarks.length > 0)
      ? pickSeeded(loc.landmarks, pageSeed + 'lm')
      : 'downtown',
    parks: (loc.parks && loc.parks.length > 0)
      ? pickSeeded(loc.parks, pageSeed + 'pk')
      : 'local parks',
    motto: loc.motto ?? '',
    zip: loc.zip ?? '',
    niche: service_config.niche,
    sub_niche: subNiche.label,
    reg_focus: nuance?.focus ?? '',
    reg_top_brand: nuance?.top_brand ?? '',
    reg_tech: nuance?.tech ?? '',
    brand: nuance?.top_brand ?? service_config.niche,
  });

  const spin = (t: string, subSeed = '') =>
    resolveSpintax(t, pageSeed + subSeed, ctx(), mergedSynonyms);

  const tpl: SubNicheTemplate = sub_niche_templates?.[subNiche.slug] ?? {};
  const headlinePool = (tpl.headline_templates && tpl.headline_templates.length > 0)
    ? tpl.headline_templates
    : globalHeadlines;
  const headline = spin(pickSeeded(headlinePool, pageSeed + 'head'));

  const faqItems = (tpl.faqs ?? []).map((f, i) => ({
    q: spin(f.q, `faqq${i}`),
    a: spin(f.a, `faqa${i}`),
  }));

  const surveySteps = (tpl.survey?.steps ?? []).map((step, i) => ({
    id: step.id,
    label: spin(step.label, `sv${i}`),
    options: step.options,
    placeholder: step.placeholder ? spin(step.placeholder, `sph${i}`) : undefined,
  }));

  const st = show_tell;

  const blocks = [
    {
      block_type: 'hero',
      data: {
        badge: spin(tpl.headline_templates?.[0] || st?.weather_anchor?.headline || (globalHeadlines as any)?.[campaign.service_config.category_slug]?.hero_badge || 'Expert Verified Guide'),
        headline: headline,
        subhead: spin(st?.weather_anchor?.body || (globalHeadlines as any)?.[campaign.service_config.category_slug]?.hero_subhead || 'Connecting you with certified local pros near {{neighborhood}}.'),
        cta_label: spin(tpl.lead_magnet?.cta || 'Get {{city}} Assessment'),
        image_alt: spin(`{{sub_niche}} services and professional local contractors in {{neighborhood}}, {{city}}`),
        cta_href: '#service-survey',
      },
    },
    ...(nuance && st?.weather_anchor ? [{
      block_type: 'regional_snapshot',
      data: {
        title: spin(`The {{reg_focus}} angle for {{city}}`),
        brand_name: nuance.top_brand,
        technology: nuance.tech,
        description: spin(nuance.logic),
      },
    }] : []),
    ...(st?.interactive_cost_logic ? [{
      block_type: 'interactive_gauge',
      data: {
        warning: spin(
          `Based on typical {{reg_focus}} conditions near {{landmark}}, many {{neighborhood}} homes benefit from a documented inspection.`
        ),
        markup: spin(st.interactive_cost_logic.markup),
      },
    }] : []),
    ...(st?.weather_anchor ? [{
      block_type: 'weather_alert',
      data: {
        headline: spin(st.weather_anchor.headline),
        body: spin(st.weather_anchor.body),
      },
    }] : []),
    ...(st?.material_comparison ? [{
      block_type: 'material_showdown',
      data: {
        title: spin(st.material_comparison.title),
        rows: st.material_comparison.table_rows.map((row) => ({
          category: row.category,
          cheap: spin(row.cheap),
          premium: spin(row.premium),
        })),
      },
    }] : []),
    ...((tpl.process_guide || st?.process_guide) ? [{
      block_type: 'process_guide',
      data: {
        headline: spin(tpl.process_guide?.headline ?? st?.process_guide?.headline ?? ''),
        steps: (tpl.process_guide?.steps ?? st?.process_guide?.steps ?? []).map((s, i) => ({
          title: spin(s.title, `ps_t${i}`),
          text: spin(s.text, `ps_tm${i}`),
        })),
      },
    }] : []),
    ...((tpl.seasonal_maintenance || st?.seasonal_maintenance) ? [{
      block_type: 'seasonal_tips',
      data: {
        headline: spin(tpl.seasonal_maintenance?.headline ?? st?.seasonal_maintenance?.headline ?? ''),
        fall_tips: spin(tpl.seasonal_maintenance?.fall_tips ?? st?.seasonal_maintenance?.fall_tips ?? ''),
        summer_tips: spin(tpl.seasonal_maintenance?.summer_tips ?? st?.seasonal_maintenance?.summer_tips ?? ''),
      },
    }] : []),
    ...((tpl.comparison_guide || st?.comparison_guide) ? [{
      block_type: 'comparison_guide',
      data: {
        title: spin(tpl.comparison_guide?.title ?? st?.comparison_guide?.title ?? ''),
        comparison: {
          option_a: spin(tpl.comparison_guide?.comparison?.option_a ?? st?.comparison_guide?.comparison?.option_a ?? ''),
          option_b: spin(tpl.comparison_guide?.comparison?.option_b ?? st?.comparison_guide?.comparison?.option_b ?? ''),
          details: spin(tpl.comparison_guide?.comparison?.details ?? st?.comparison_guide?.comparison?.details ?? ''),
        },
      },
    }] : []),
    ...((tpl.market_analytics || st?.market_analytics) ? [{
      block_type: 'market_analytics',
      data: {
        headline: spin(tpl.market_analytics?.headline ?? st?.market_analytics?.headline ?? ''),
        analysis: spin(tpl.market_analytics?.analysis ?? st?.market_analytics?.analysis ?? ''),
        stats: (tpl.market_analytics?.stats ?? st?.market_analytics?.stats ?? []).map((s, i) => ({
          label: spin(s.label, `mslt_${i}`),
          value: spin(s.value, `mskv_${i}`),
          hint: spin(s.hint, `msh_${i}`),
        })),
      },
    }] : []),
    ...((tpl.compliance_checklist || st?.compliance_checklist) ? [{
      block_type: 'compliance_checklist',
      data: {
        title: spin(tpl.compliance_checklist?.title ?? st?.compliance_checklist?.title ?? ''),
        warning: spin(tpl.compliance_checklist?.warning ?? st?.compliance_checklist?.warning ?? ''),
        items: (tpl.compliance_checklist?.items ?? st?.compliance_checklist?.items ?? []).map((s, i) => ({
          title: spin(s.title, `cct_${i}`),
          text: spin(s.text, `ccm_${i}`),
        })),
      },
    }] : []),
    ...(tpl.encyclopedia ? [{
      block_type: 'encyclopedia',
      data: {
        brands: (tpl.encyclopedia.brands || {}),
        costs: (tpl.encyclopedia.pricing_benchmarks || []),
        aoe_intro: pickSeeded(tpl.encyclopedia.aoe_hints || [], pageSeed + 'aoe'),
      },
    }] : []),
    ...(st?.landmark_proximity ? [{
      block_type: 'local_trust',
      data: {
        badge: spin(st.landmark_proximity.trust_badge),
        text: spin(st.landmark_proximity.text),
      },
    }] : []),
    {
      block_type: 'silo_links',
      data: {
        city: loc.city,
        currentNiche: service_config.niche,
      },
    },
    {
      block_type: 'survey_flow',
      data: {
        title: spin(tpl.survey?.title ?? 'Start Your Discovery'),
        subhead: spin(tpl.survey?.subhead ?? 'Answer a few questions to find the right guide.'),
        steps: surveySteps,
      },
    },
    {
      block_type: 'faq_section',
      data: {
        items: faqItems,
      },
    },
    {
      block_type: 'lead_magnet',
      data: {
        headline: spin(tpl.lead_magnet?.headline ?? 'Download the Local Guide'),
        subhead: spin(tpl.lead_magnet?.subhead ?? 'Get all the details in a printable format.'),
        bullets: (tpl.lead_magnet?.bullets ?? []).map((b, i) => spin(b, `lmb${i}`)),
        cta: spin(tpl.lead_magnet?.cta ?? 'Download Now'),
      },
    },
  ];

  return {
    title: spin(pickSeeded(headlinePool, pageSeed + 'title')),
    slug: urlSlug,
    category: service_config.category_slug,
    niche: service_config.niche_slug,
    subNiche: subNiche.slug,
    schema: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: headline,
      description: spin(`Find reliable local {{sub_niche}} experts in {{neighborhood}}, {{city}}.`),
    }),
    blocks: JSON.stringify(blocks),
    excerpt: spin(`Discover the best {{sub_niche}} solutions in {{city}}. Our guide covers local standards, pricing, and certified providers near {{landmark}}.`),
  };
}

// ─── Legacy Export (Minimized for memory efficiency) ─────────────────────────
export function generatePseoPages(): GeneratedPage[] {
  const slugs = getAllPseoSlugs();
  return slugs
    .map(slug => generatePseoPageBySlug(slug))
    .filter((p): p is GeneratedPage => p !== null);
}

// ─── Legacy shim (keeps any old imports from breaking) ────────────────────────
export { generatePseoPages as generateRoofingPseoPages };
