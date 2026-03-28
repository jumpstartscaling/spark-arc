/**
 * Global PSEO Type Definitions
 * Centralizing data structures for the generator and Astro components.
 */

export interface Step {
  id: string;
  label: string;
  options?: string[];
  placeholder?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface LeadMagnet {
  headline: string;
  subhead: string;
  bullets: string[];
  button: string;
}

export interface SurveyData {
  title: string;
  subhead: string;
  steps: Step[];
  niche: string;
  sub_niche: string;
}

export interface ComparisonGuideData {
  title: string;
  comparison: {
    option_a: string;
    option_b: string;
    details: string;
  };
}

export interface ComplianceChecklistItem {
  title: string;
  text: string;
}

export interface ComplianceChecklistData {
  title: string;
  warning: string;
  items: ComplianceChecklistItem[];
}

export interface MarketAnalyticsStat {
  label: string;
  value: string;
  hint: string;
}

export interface MarketAnalyticsData {
  headline: string;
  analysis: string;
  stats: MarketAnalyticsStat[];
}

export interface ProcessStep {
  title: string;
  text: string;
}

export interface ProcessGuideData {
  headline: string;
  steps: ProcessStep[];
}

export interface SeasonalTipsData {
  headline: string;
  fall_tips: string;
  summer_tips: string;
}

export interface MaterialRow {
  category: string;
  cheap: string;
  premium: string;
}

export interface MaterialShowdownData {
  title: string;
  rows: MaterialRow[];
}

export interface InteractiveGaugeData {
  warning: string;
  markup: string;
}

export interface BrandInfo {
  tier: string;
  flagship: string;
  value_prop: string;
  price_point: string;
}

export interface BrandShowcaseData {
  brands: Record<string, BrandInfo>;
}

export interface EncyclopediaData {
  brands: Record<string, BrandInfo>;
  costs: Record<string, { per_sqft: string; notes: string }>;
  aoe_intro: string;
}

export interface ServiceTrackerData {
  headline: string;
  body: string;
}

export interface SiloLink {
  label: string;
  href: string;
}

export interface SiloLinksData {
  city: string;
  currentNiche: string;
}

export interface PseoBlock {
  block_type: string;
  data: any; 
}

export interface PseoEntry {
  title: string;
  slug: string;
  category: string;
  niche: string;
  subNiche: string;
  city: string;
  state: string;
  neighborhood: string;
  headline?: string;
  blocks?: string; // JSON string
  schema?: string; // JSON string
  excerpt?: string;
}
