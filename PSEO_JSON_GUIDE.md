# pSEO Campaign JSON Guide: The 1,500 Word Blueprint

This document explains how to construct campaign JSON files to generate high-authority, 1,500-word pSEO pages. To reach this length, you must satisfy all "Block" requirements.

## 📁 File Structure
Place all campaign files in: `src/data/pseo/campaigns/{{category_slug}}/{{niche_slug}}.json`

---

## 🏗️ 1. Core Schema Overview
Each file follows this 5-section structure:

1.  **`service_config`**: Basic routing (Niche name, slug, sub-niches).
2.  **`spintax`**: Vocabulary overrides (Urgency, contractor vibe).
3.  **`show_tell`**: Global blocks shared across all cities (Comparison, analytics, checklist).
4.  **`encyclopedia`**: Shared knowledge base (Brands, material types).
5.  **`sub_niche_templates`**: **(CRITICAL)** Specific content for each sub-niche.
6.  **`regional_nuance`**: City/State overrides (Climate, regional brands).
7.  **`market_analytics`**: **(NEW)** High-authority data visualization.
8.  **`compliance_checklist`**: **(NEW)** Local code and safety verification.

---

## 🧩 2. Content Blocks (Interchangeable)

To reach 1,500 words, use these blocks in your `show_tell` or `sub_niche_templates`.

### A. The "Process Guide" Block (Step-by-Step)
Explains the mechanics of the service.
```json
"process_guide": {
  "headline": "How {{city}} {{sub_niche}} works step-by-step",
  "steps": [
    { "title": "Diagnostics", "text": "Our crews arrive near {{landmark}} to map the issue using thermal imaging." },
    { "title": "Permitting", "text": "We handle all {{county}} electrical/plumbing permits so you stay code-compliant." }
  ]
}
```

### B. The "Comparison Guide" (A vs B)
High-intent education.
```json
"comparison_guide": {
  "title": "{{niche}} Options for {{neighborhood}} Homes",
  "comparison": {
    "option_a": "Standard (Base Protection)",
    "option_b": "High-Efficiency (Long-term ROI)",
    "details": "Copper vs. Pex, Shingle vs. Metal, etc."
  }
}
```

### C. The "Seasonal Maintenance" Block
Adds utility and "expert" vibe.
```json
"seasonal_maintenance": {
  "headline": "Seasonal {{niche}} Guide for {{state}} Climates",
  "fall_tips": "Flush your {{sub_niche}} system before the first freeze...",
  "summer_tips": "Inspect seals near {{landmark}} for heat expansion..."
}
```

### D. The "Market Analytics" Block (Data Depth)
Adds statistical authority.
```json
"market_analytics": {
  "headline": "Local {{city}} {{niche}} Statistics (2026)",
  "analysis": "Data from {{county}} property records shows a 15% increase in high-efficiency {{niche}} upgrades near {{neighborhood}} this year.",
  "stats": [
    { "label": "Avg Home Age", "value": "24 Years", "hint": "Near {{landmark}} corridors" },
    { "label": "ROI on {{niche}}", "value": "88%", "hint": "Typical for {{state}} Resale" }
  ]
}
```

### E. The "Compliance Checklist" Block
Ensures safety and local code relevance.
```json
"compliance_checklist": {
  "title": "{{city}} {{niche}} Safety & Code Checklist",
  "warning": "Before starting any {{sub_niche}} project in {{county}}, ensure your contractor holds specific {{state}} liability coverage.",
  "items": [
    { "title": "Permit Verification", "text": "Check if your {{neighborhood}} project requires a local {{city}} building permit." },
    { "title": "Bond & Insurance", "text": "Verify the {{reg_top_brand}} certified installer is bonded in {{state}}." }
  ]
}
```

---

## 📝 3. Master JSON Checklist

### Phase 1: Contextual Setup
- [ ] **Niche Slugs**: kebab-case (e.g., `pest-control`).
- [ ] **Sub-Niches**: At least 5 per niche to ensure coverage.
- [ ] **Synonyms**: At least 5 "Urgency" and 5 "Trust" synonyms.

### Phase 2: High Volume Content
- [ ] **Brand Profiles**: At least 3 major brands with `tier` and `value_prop`.
- [ ] **FAQs**: At least 4 unique FAQs per sub-niche.
- [ ] **Regional Nuance**: Define a nuance for **FL** (Humid/Coastal) and **general** (Standard).

### Phase 3: Conversion
- [ ] **Survey Steps**: Define at least 3 diagnostic questions (e.g., "Age of system?", "Symptoms?").
- [ ] **Lead Magnet**: "The {{city}} {{niche}} Checklist" button text.

---

## 🚀 Pro-Tip: Reusing Globals
You don't have to write everything from scratch. Use the `{{tags}}` to let the engine do the work:
- `{{city}}`: Los Angeles
- `{{neighborhood}}`: Downtown LA
- `{{landmark}}`: Hollywood Sign
- `{{county}}`: Los Angeles County
- `{{niche}}`: Plumbing
- `{{sub_niche}}`: Emergency Drain Cleaning

---

## 🛠️ Full Implementation Checklist

1. **Create the Niche JSON** (using the schema above).
2. **Register the Import** in `src/utils/generatePseoPages.ts`.
3. **Add to `ALL_CAMPAIGNS` Array** in the same file.
4. **Deploy & Check `/niches` Dashboard** to verify the page count.
