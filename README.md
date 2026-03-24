# Spark Arc — Roofing pSEO (Astro template)

Light, **roofing-only** programmatic SEO starter: local guides, JSON-driven copy, dual **n8n** webhooks, and a multi-step survey. Use as a [GitHub template](https://github.com/jumpstartscaling/spark-arc) or clone for your own brand.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

- Dev server: [http://localhost:4321](http://localhost:4321) (default Astro port).
- Browse generated pages under **Local guides** or open a path like `/insights/dallas-tx/roofing`.

## Environment

| Variable | Purpose |
|----------|---------|
| `PUBLIC_N8N_WEBHOOK_TEST_URL` | Test webhook (n8n “Listen” / `webhook-test`) |
| `PUBLIC_N8N_WEBHOOK_URL` | Production webhook |
| `PUBLIC_SITE_URL` | Optional canonical URL for deploys |

Defaults in `.env.example` match the bundled fallbacks in `RoofingSurvey.astro` if variables are unset.

## Project layout

- `src/data/pseo/` — locations + roofing JSON matrices (see [PSEO_SPEC.md](./PSEO_SPEC.md)).
- `src/utils/generateRoofingPseoPages.ts` — build-time page generator.
- `src/pages/insights/[...slug].astro` — dynamic guide template + JSON-LD.
- `src/components/roofing/` — survey, thank-you content, gauge, radar, table, etc.

## Commands

```bash
npm run build    # static output in dist/
npm run preview  # serve production build locally
```

## Privacy

The survey sends **tracking_data** (referrer, UTMs, ad click IDs, user agent, screen size, timezone). Disclose this to visitors where required.

## Reference

Patterns are aligned with the live Astro site at [caw-jump/jumpstartscaling-site](https://github.com/caw-jump/jumpstartscaling-site/tree/main/), but this repo **drops B2B matrix data** and uses a **light / blue** UI only.
