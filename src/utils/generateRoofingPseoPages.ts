import locationsRaw from '../data/pseo/globals/locations.json';
import regionalNuanceRaw from '../data/pseo/roofing_regional_nuance.json';
import showTellRaw from '../data/pseo/roofing_dynamic_show_tell.json';
import encyclopediaRaw from '../data/pseo/roofing_encyclopedia_matrix.json';
import localTrustRaw from '../data/pseo/roofing_local_trust_matrix.json';
import conversionRaw from '../data/pseo/roofing_conversion_matrix.json';
import headlineTemplatesRaw from '../data/pseo/headline_templates.json';
import synonymGroupsRaw from '../data/pseo/roofing_synonym_groups.json';
import { siteConfig } from '../config/site';

const locations = locationsRaw as LocationRecord[];
const rRegional = (regionalNuanceRaw as { regions: Record<string, RegionalNuance> }).regions;
const rShowTell = (showTellRaw as { blocks: ShowTellBlocks }).blocks;
const rEncy = encyclopediaRaw as Encyclopedia;
const rTrust = (localTrustRaw as { stories: LocalTrustStories }).stories;
const rConv = conversionRaw as ConversionMatrix;
const headlineTemplates = (headlineTemplatesRaw as { templates: string[] }).templates;
const synonymGroups = (synonymGroupsRaw as { synonyms: SynonymGroup[] }).synonyms;

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

interface RegionalNuance {
  focus: string;
  top_brand: string;
  tech: string;
  logic: string;
}

interface ShowTellBlocks {
  weather_anchor: { headline: string; body: string };
  material_comparison: { title: string; table_rows: MaterialRow[] };
  landmark_proximity: { trust_badge: string; text: string };
  interactive_cost_logic: { markup: string; base_sqft_price?: number };
}

interface MaterialRow {
  category: string;
  cheap: string;
  premium: string;
}

interface Encyclopedia {
  brands: Record<string, { tier: string; flagship: string; value_prop: string; price_point: string }>;
  styles: Record<string, { human_name: string; benefit: string; aoe_hint: string }>;
  costs_2026: Record<string, { per_sqft: string; notes: string }>;
  aoe_hint: string[];
}

interface LocalTrustStories {
  hiring_local: { headline: string; body: string };
  neighborhood_pride: { headline: string; body: string };
  permitting_logic: { headline: string; body: string };
}

interface ConversionMatrix {
  lead_magnets: {
    storm_kit: { headline: string; subhead: string; bullets: string[]; cta: string };
  };
  qualifying_form: {
    steps: Array<{
      id: string;
      label: string;
      options?: string[];
      placeholder?: string;
    }>;
  };
  closing_blocks: { trust_final: string };
}

interface SynonymGroup {
  category: string;
  terms: string;
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
}

function resolveSpintax(text: string, seed: string, context: Record<string, string>): string {
  if (!text) return '';
  let res = text;
  let rngOffset = 0;
  const getRng = () => seededRandom(seed + rngOffset++);

  const resolvePlaceholders = (val: string) => {
    let t = val;
    for (let pass = 0; pass < 2; pass++) {
      Object.keys(context).forEach((key) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        t = t.replace(regex, context[key]);
      });
    }
    return t;
  };

  res = resolvePlaceholders(res);

  synonymGroups.forEach((group) => {
    const regex = new RegExp(`%${group.category}%`, 'g');
    if (res.includes(`%${group.category}%`)) {
      const terms = JSON.parse(group.terms) as string[];
      res = res.replace(regex, () => resolvePlaceholders(terms[Math.floor(getRng() * terms.length)]));
    }
  });

  for (;;) {
    const match = res.match(/\{([^{}]+)\}/);
    if (!match) break;
    const options = match[1]!;
    const choices = options.split('|');
    const picked = choices[Math.floor(getRng() * choices.length)]!;
    res = res.replace(match[0], picked);
  }

  return res;
}

function spinEncyclopedia(
  enc: Encyclopedia,
  spin: (t: string, subSeed: string) => string
): Encyclopedia {
  const brands: Encyclopedia['brands'] = {};
  for (const key of Object.keys(enc.brands)) {
    const row = enc.brands[key]!;
    brands[key] = {
      ...row,
      value_prop: spin(row.value_prop, `ENCY_BRAND_${key}`),
    };
  }
  const styles: Encyclopedia['styles'] = {};
  for (const key of Object.keys(enc.styles)) {
    const row = enc.styles[key]!;
    styles[key] = {
      ...row,
      benefit: spin(row.benefit, `ENCY_STYLE_${key}_B`),
      aoe_hint: spin(row.aoe_hint, `ENCY_STYLE_${key}_H`),
    };
  }
  const costs_2026: Encyclopedia['costs_2026'] = {};
  for (const key of Object.keys(enc.costs_2026)) {
    const row = enc.costs_2026[key]!;
    costs_2026[key] = {
      ...row,
      notes: spin(row.notes, `ENCY_COST_${key}`),
    };
  }
  return {
    ...enc,
    brands,
    styles,
    costs_2026,
    aoe_hint: enc.aoe_hint.map((h, i) => spin(h, `ENCY_AOE_${i}`)),
  };
}

export interface GeneratedPage {
  title: string;
  slug: string;
  schema: string;
  blocks: string;
  excerpt: string;
}

export function generateRoofingPseoPages(): GeneratedPage[] {
  const allPages: GeneratedPage[] = [];

  for (const loc of locations) {
    if (!loc.city || !loc.state || !loc.slug) continue;

    const stateNuance = rRegional[loc.state] ?? rRegional['FL'] ?? Object.values(rRegional)[0]!;
    const urlSlug = `insights/${loc.slug}/roofing`;

    const getRand = <T,>(arr: T[] | undefined, subSeed: string): T | undefined => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return undefined;
      const idx = Math.floor(seededRandom(urlSlug + subSeed) * arr.length);
      return arr[idx];
    };

    const contextBase = (): Record<string, string> => ({
      city: loc.city,
      state: loc.state,
      neighborhood: loc.neighborhood ?? loc.city,
      county: loc.county ?? `${loc.city} area`,
      landmark: getRand(loc.landmarks, 'lm') ?? 'downtown',
      parks: getRand(loc.parks, 'pk') ?? 'local parks',
      motto: loc.motto ?? '',
      zip: loc.zip ?? '',
      reg_top_brand: stateNuance.top_brand,
      reg_focus: stateNuance.focus,
      reg_logic: stateNuance.logic,
      recent_event: 'high wind and hail risk',
      storm_date: 'recent storm cycles',
      wind_speed: '60–90',
    });

    const spin = (t: string, subSeed = '') =>
      resolveSpintax(t, urlSlug + subSeed, contextBase());

    const encSpun = spinEncyclopedia(rEncy, spin);

    const headline =
      spin(headlineTemplates[Math.floor(seededRandom(urlSlug + 'head') * headlineTemplates.length)]!);

    const faqTemplates = [
      { q: 'How do I know if my {{city}} roof has hail damage?', hintIndex: 0 },
      { q: 'What is the typical cost of a roof in {{city}} right now?', hintIndex: 1 },
      { q: 'What if my insurance company denies my roof claim in {{state}}?', hintIndex: 2 },
      { q: 'Should I patch my roof or replace the whole thing?', hintIndex: 3 },
    ];
    const faqItems = faqTemplates.map((f, i) => {
      const answer = encSpun.aoe_hint[f.hintIndex % encSpun.aoe_hint.length]!;
      return {
        q: spin(f.q, `faqq${i}`),
        a: spin(answer, `faqa${i}`),
      };
    });

    const surveySteps = rConv.qualifying_form.steps.map((step, i) => ({
      id: step.id,
      label: spin(step.label, `sv${i}`),
      options: step.options,
      placeholder: step.placeholder ? spin(step.placeholder, `sph${i}`) : undefined,
    }));

    const blocks = [
      {
        block_type: 'hero',
        data: {
          badge: spin('{Local|Trusted} {{city}} roofing guide'),
          headline,
          subhead: spin(
            '**{{city}} roofs** see serious weather. If you are lining up %contractor_vibe% for work in {{neighborhood}}, start with documentation and a written scope before you commit—%urgency%.'
          ),
          cta_label: spin('{Start|Run} the roof checklist'),
          cta_href: '#roof-survey',
        },
      },
      {
        block_type: 'regional_brand_showcase',
        data: {
          title: spin('The {{reg_focus}} angle for {{city}}'),
          brand_name: stateNuance.top_brand,
          technology: stateNuance.tech,
          description: spin(stateNuance.logic),
        },
      },
      {
        block_type: 'interactive_gauge',
        data: {
          warning: spin(
            'Based on typical {{reg_focus}} exposure near {{landmark}}, many {{neighborhood}} roofs benefit from a documented inspection after major weather.'
          ),
          markup: spin(rShowTell.interactive_cost_logic.markup),
        },
      },
      {
        block_type: 'weather_alert',
        data: {
          headline: spin(rShowTell.weather_anchor.headline),
          body: spin(rShowTell.weather_anchor.body),
        },
      },
      {
        block_type: 'roof_cross_section',
        data: {},
      },
      {
        block_type: 'material_showdown',
        data: {
          title: spin(rShowTell.material_comparison.title),
          rows: rShowTell.material_comparison.table_rows.map((row) => ({
            category: row.category,
            cheap: spin(row.cheap),
            premium: spin(row.premium),
          })),
        },
      },
      {
        block_type: 'encyclopedia',
        data: {
          brands: encSpun.brands,
          styles: encSpun.styles,
          costs: encSpun.costs_2026,
          aoe_intro: spin(
            'When comparing materials in {{city}}, match wind ratings, impact class, and ventilation to {{county}} realities—not just shingle color.'
          ),
        },
      },
      {
        block_type: 'local_trust',
        data: {
          story_headline: spin(rTrust.hiring_local.headline),
          story_body: spin(rTrust.hiring_local.body),
          secondary_headline: spin(rTrust.neighborhood_pride.headline),
          secondary_body: spin(rTrust.neighborhood_pride.body),
          permit_headline: spin(rTrust.permitting_logic.headline),
          permit_body: spin(rTrust.permitting_logic.body),
          landmark_badge: spin(rShowTell.landmark_proximity.trust_badge),
          landmark_text: spin(rShowTell.landmark_proximity.text),
        },
      },
      {
        block_type: 'aoe_faq',
        data: { items: faqItems },
      },
      {
        block_type: 'lead_magnet',
        data: {
          headline: spin(rConv.lead_magnets.storm_kit.headline),
          subhead: spin(rConv.lead_magnets.storm_kit.subhead),
          bullets: rConv.lead_magnets.storm_kit.bullets.map((b, i) => spin(b, `lb${i}`)),
          button: spin(rConv.lead_magnets.storm_kit.cta),
        },
      },
      {
        block_type: 'closing_trust',
        data: { text: spin(rConv.closing_blocks.trust_final) },
      },
      {
        block_type: 'roofing_survey',
        data: {
          title: spin('{Roof|Home} health check'),
          subhead: spin('Answer a few questions—takes under a minute.'),
          steps: surveySteps,
          niche: 'roofing',
        },
      },
    ];

    const businessName = `${siteConfig.siteName} ${loc.city} ${siteConfig.businessNameSuffix}`;
    const schemaObj = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'LocalBusiness',
          name: businessName,
          description: spin('Roofing education and contractor matching context for {{neighborhood}} and {{county}}.'),
          areaServed: { '@type': 'City', name: loc.city },
          slogan: loc.motto || undefined,
        },
        {
          '@type': 'HowTo',
          name: spin('How to evaluate a roof in {{city}}'),
          description: spin('Materials, costs, and next steps for {{neighborhood}} homeowners.'),
          step: [
            {
              '@type': 'HowToStep',
              name: 'Document visible damage',
              text: spin('Check flashings, shingle edges, and gutters near {{landmark}}-area weather patterns.'),
            },
            {
              '@type': 'HowToStep',
              name: 'Compare material classes',
              text: spin('Match wind and impact ratings to {{state}} risks—not just price per square.'),
            },
            {
              '@type': 'HowToStep',
              name: 'Get written scope',
              text: spin('Line items should include tear-off, decking, underlayment, and ventilation for {{city}} code context.'),
            },
          ],
          totalTime: 'P1D',
        },
      ],
    };

    const excerpt = spin('{{city}} roofing: materials, costs, and a quick homeowner checklist.');

    allPages.push({
      title: spin(`{{city}} roofing guide | {{neighborhood}} and ${siteConfig.siteName}`),
      slug: urlSlug,
      schema: JSON.stringify(schemaObj),
      blocks: JSON.stringify(blocks),
      excerpt,
    });
  }

  return allPages;
}
