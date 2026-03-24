# Spark Arc — Roofing pSEO specification

This repository is a **GitHub Template** for consumer **roofing** programmatic SEO (pSEO) on Astro. It is **not** the multi-niche B2B matrix from the legacy Jumpstart Scaling spec; it only generates homeowner roofing guides from the JSON pack below.

## Architecture

- **Build-time generation**: `src/utils/generateRoofingPseoPages.ts` expands `locations.json` plus roofing matrices into page records (`title`, `slug`, `schema`, `blocks`).
- **Routing**: `src/pages/insights/[...slug].astro` renders `blocks` as Astro sections (hero, gauge, radar, encyclopedia, survey, etc.).
- **Leads**: `src/components/roofing/RoofingSurvey.astro` POSTs JSON to **two** n8n webhooks (`Promise.allSettled`), then redirects to `/thank-you` with `city` and `neighborhood` query params.

## Data files (`src/data/pseo/`)

| File | Purpose |
|------|---------|
| `locations.json` | Cities: `slug`, `city`, `state`, `neighborhood`, `county`, `landmarks`, `parks`, `motto`, `zip` |
| `roofing_regional_nuance.json` | Per-state brand / focus / tech / logic |
| `roofing_dynamic_show_tell.json` | Weather copy, material table rows, landmark strings, estimate markup |
| `roofing_encyclopedia_matrix.json` | Brands, styles, costs, `aoe_hint` |
| `roofing_local_trust_matrix.json` | Trust stories |
| `roofing_conversion_matrix.json` | Lead magnet + survey steps |
| `headline_templates.json` | Headline templates with `{{placeholders}}` |
| `roofing_synonym_groups.json` | `%roof_damage%`, `%contractor_vibe%`, etc. |

**Excluded on purpose** (B2B / legacy): `niche_content_matrix.json`, `avatar_definitions.json`, `search_intent_matrix.json` (multi-niche), `jss_content.json`, `offer_blocks.json`, B2B `spintax_dictionaries.json`.

## Spintax

- Placeholders: `{{city}}`, `{{neighborhood}}`, `{{reg_focus}}`, …
- Synonyms: `%roof_damage%`, `%urgency%`, …
- Braces: `{A|B}` single choice per seeded random
- **Seed**: URL slug so each page is stable across rebuilds.

## Webhooks & tracking

Survey payload includes form fields plus `tracking_data` (UTMs, click IDs, referrer, UA, screen size, timezone). Document this in your privacy policy for production sites.

## Operations

1. Copy `.env.example` → `.env` and adjust URLs if needed.
2. `npm install` / `npm run dev`
3. Add rows to `locations.json` to scale pages.
4. Push to [jumpstartscaling/spark-arc](https://github.com/jumpstartscaling/spark-arc) and enable **Template repository** in GitHub settings if this is the canonical template.
